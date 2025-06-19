import puppeteer, { Page } from 'puppeteer';
import { BlogPost, ScrapeConfig } from '@/types/scraper';
import { supabase } from './supabase';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});

interface ScrapedContent {
  title: string;
  content: string;
  source_url: string;
  source_type: 'blog' | 'guide' | 'book';
  metadata: {
    author?: string;
    date?: string;
    excerpt?: string;
    [key: string]: any;
  };
}

export async function scrapeBlogPosts(config: ScrapeConfig): Promise<BlogPost[]> {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Optimize page loading for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Block images, CSS, fonts to speed up loading
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    console.log('Navigating to:', config.url);
    await page.goto(config.url, {
      waitUntil: 'domcontentloaded', // Faster than networkidle0
      timeout: 30000 // 30 second timeout per page
    });

    // Get all links on the page
    console.log('Finding links...');
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a');
      return Array.from(anchors)
        .map(a => a.href)
        .filter(href => {
          try {
            const url = new URL(href);
            // Only include links from the same domain
            return url.hostname === window.location.hostname;
          } catch {
            return false;
          }
        });
    });

    console.log('Found links:', links.length);

    const posts: BlogPost[] = [];
    const visitedUrls = new Set<string>();
    const sourceName = config.name || new URL(config.url).hostname;

    // Visit each unique link
    for (const link of links) {
      if (visitedUrls.has(link)) {
        console.log('Skipping already visited:', link);
        continue;
      }
      visitedUrls.add(link);

      try {
        console.log('Visiting:', link);
        await page.goto(link, { 
          waitUntil: 'domcontentloaded', // Faster loading
          timeout: 30000 // 30 second timeout
        });
        
        const post = await page.evaluate((sourceName: string) => {
          // Try to find the main content area
          const mainContent = document.querySelector('main, article, [role="main"], .content, #content');
          const element = mainContent || document.body;

          // Extract title from h1 or meta tags
          const title = element.querySelector('h1')?.textContent?.trim() ||
                       document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                       document.title;

          // Extract content from paragraphs
          const paragraphs = Array.from(element.querySelectorAll('p'))
            .map(p => p.textContent?.trim())
            .filter(Boolean)
            .join('\n\n');

          // Try to find author information
          const author = element.querySelector('[class*="author"], [class*="byline"], .author, .byline')?.textContent?.trim() ||
                        document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                        '';

          // Try to find date information
          const date = element.querySelector('[class*="date"], [class*="time"], .date, .time')?.textContent?.trim() ||
                      document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                      '';

          if (!title || !paragraphs) return null;

          return {
            title,
            excerpt: paragraphs.slice(0, 500) + '...', // First 500 chars as excerpt
            author,
            date,
            url: window.location.href,
            source: sourceName
          };
        }, sourceName);

        if (post) {
          console.log('Found post:', post.title);
          posts.push(post);
        } else {
          console.log('No post content found on:', link);
        }
      } catch (error) {
        console.error(`Error scraping ${link}:`, error);
        continue;
      }
    }

    console.log('Scraping completed, found posts:', posts.length);
    return posts;
  } catch (error) {
    console.error('Error in scrapeBlogPosts:', error);
    throw error;
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

async function handleCrawlMode(page: Page, config: ScrapeConfig): Promise<BlogPost[]> {
  if (!config.linkSelector || !config.contentSelector) {
    throw new Error('Link selector and content selector are required for crawl mode');
  }

  // Wait for the initial content to load
  await page.waitForSelector(config.contentSelector);

  // Get all links to crawl
  const links = await page.evaluate((selector: string) => {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => el.getAttribute('href'));
  }, config.linkSelector);

  const posts: BlogPost[] = [];

  // Visit each link and extract content
  for (const link of links) {
    if (!link) continue;

    const fullUrl = new URL(link, config.url).toString();
    await page.goto(fullUrl, { waitUntil: 'networkidle0' });

    const post = await page.evaluate((selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;

      return {
        title: element.querySelector('h1')?.textContent?.trim() || '',
        excerpt: element.querySelector('p')?.textContent?.trim() || '',
        author: element.querySelector('.author')?.textContent?.trim() || '',
        date: element.querySelector('.date')?.textContent?.trim() || '',
        url: fullUrl,
        source: config.name || new URL(config.url).hostname
      };
    }, config.contentSelector);

    if (post) {
      posts.push(post);
    }
  }

  return posts;
}

async function handleSingleMode(page: Page, config: ScrapeConfig): Promise<BlogPost[]> {
  if (!config.contentSelector) {
    throw new Error('Content selector is required for single mode');
  }

  await page.waitForSelector(config.contentSelector);

  const post = await page.evaluate((selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;

    return {
      title: element.querySelector('h1')?.textContent?.trim() || '',
      excerpt: element.querySelector('p')?.textContent?.trim() || '',
      author: element.querySelector('.author')?.textContent?.trim() || '',
      date: element.querySelector('.date')?.textContent?.trim() || '',
      url: window.location.href,
      source: config.name || new URL(config.url).hostname
    };
  }, config.contentSelector);

  return post ? [post] : [];
}

async function handlePartialMode(page: Page, config: ScrapeConfig): Promise<BlogPost[]> {
  if (!config.contentSelector) {
    throw new Error('Content selector is required for partial mode');
  }

  await page.waitForSelector(config.contentSelector);

  const posts = await page.evaluate((selector: string) => {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(element => ({
      title: element.querySelector('h1, h2, h3')?.textContent?.trim() || '',
      excerpt: element.querySelector('p')?.textContent?.trim() || '',
      author: element.querySelector('.author')?.textContent?.trim() || '',
      date: element.querySelector('.date')?.textContent?.trim() || '',
      url: window.location.href,
      source: config.name || new URL(config.url).hostname
    }));
  }, config.contentSelector);

  return posts;
}

async function handlePdfMode(page: Page, config: ScrapeConfig): Promise<BlogPost[]> {
  // TODO: Implement PDF handling
  throw new Error('PDF mode not implemented yet');
}

export async function scrapeContent(config: ScrapeConfig, supabase: any): Promise<ScrapedContent[]> {
  console.log('Starting scrape with config:', config);
  
  // Temporarily disabled auth checks for testing
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   throw new Error('User not authenticated');
  // }

  // // Verify ownership of the knowledge base
  // const { data: knowledgeBase, error: kbError } = await supabase
  //   .from('knowledge_bases')
  //   .select('id')
  //   .eq('id', config.knowledge_base_id)
  //   .eq('user_id', user.id)
  //   .single();

  // if (kbError || !knowledgeBase) {
  //   console.error('Knowledge base ownership check failed:', kbError);
  //   throw new Error('Knowledge base not found or access denied');
  // }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(config.url, { waitUntil: 'networkidle0' });

    // Extract content based on the source type
    const content = await page.evaluate((sourceType) => {
      const getContent = () => {
        switch (sourceType) {
          case 'blog':
            return {
              title: document.querySelector('h1')?.textContent?.trim() || '',
              content: document.querySelector('article')?.innerHTML || '',
              author: document.querySelector('[class*="author"]')?.textContent?.trim(),
              date: document.querySelector('time')?.textContent?.trim(),
              excerpt: document.querySelector('[class*="excerpt"]')?.textContent?.trim()
            };
          case 'guide':
            return {
              title: document.querySelector('h1')?.textContent?.trim() || '',
              content: document.querySelector('main')?.innerHTML || '',
              author: document.querySelector('[class*="author"]')?.textContent?.trim(),
              date: document.querySelector('time')?.textContent?.trim()
            };
          case 'book':
            return {
              title: document.querySelector('h1')?.textContent?.trim() || '',
              content: document.querySelector('[class*="content"]')?.innerHTML || '',
              author: document.querySelector('[class*="author"]')?.textContent?.trim(),
              date: document.querySelector('time')?.textContent?.trim()
            };
          default:
            return {
              title: document.title,
              content: document.body.innerHTML,
              author: undefined,
              date: undefined
            };
        }
      };

      return getContent();
    }, config.source_type);

    // Convert HTML content to Markdown
    const markdownContent = turndownService.turndown(content.content);

    // Store in Supabase
    const { data: entry, error } = await supabase
      .from('knowledge_entries')
      .insert({
        knowledge_base_id: config.knowledge_base_id,
        title: content.title,
        content: markdownContent,
        source_url: config.url,
        source_type: config.source_type,
        metadata: {
          author: content.author,
          date: content.date,
          excerpt: content.excerpt
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing content:', error);
      throw error;
    }

    return [{
      title: content.title,
      content: markdownContent,
      source_url: config.url,
      source_type: config.source_type,
      metadata: {
        author: content.author,
        date: content.date,
        excerpt: content.excerpt
      }
    }];
  } finally {
    await browser.close();
  }
} 