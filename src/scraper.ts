import puppeteer from 'puppeteer';

interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  url: string;
  source: string;
}

interface ScraperConfig {
  url: string;
  selectors: {
    postContainer: string;
    title: string;
    excerpt: string;
    author: string;
    date: string;
    url: string;
  };
  waitForSelector: string;
}

const configs: Record<string, ScraperConfig> = {
  interviewing: {
    url: 'https://interviewing.io/blog',
    selectors: {
      postContainer: 'div.mb-16.border-b.pb-16',
      title: 'h1.pb-4 a',
      excerpt: 'p.py-2.text-base.leading-7',
      author: 'div.mb-2.border-t.pt-2',
      date: 'div.mb-2.border-t.pt-2',
      url: 'h1.pb-4 a'
    },
    waitForSelector: 'h1.pb-4'
  }
  // Add more configurations for other blog sources here
};

async function scrapeBlogPosts(source: string): Promise<BlogPost[]> {
  const config = configs[source];
  if (!config) {
    throw new Error(`No configuration found for source: ${source}`);
  }

  const browser = await puppeteer.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.goto(config.url, {
      waitUntil: 'networkidle0'
    });

    await page.waitForSelector(config.waitForSelector);

    const posts = await page.evaluate((selectors, sourceName) => {
      const postElements = document.querySelectorAll(selectors.postContainer);
      
      return Array.from(postElements).map(post => {
        const titleElement = post.querySelector(selectors.title);
        const authorElement = post.querySelector(selectors.author);
        const excerptElement = post.querySelector(selectors.excerpt);
        const dateElement = post.querySelector(selectors.date);
        
        return {
          title: titleElement?.textContent?.trim() || '',
          excerpt: excerptElement?.textContent?.trim() || '',
          author: authorElement?.textContent?.split('|')[0].trim() || '',
          date: dateElement?.textContent?.split('|')[1]?.trim() || '',
          url: titleElement?.getAttribute('href') || '',
          source: sourceName
        };
      });
    }, config.selectors, source);

    return posts;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    console.log('Starting to scrape blog posts...');
    const posts = await scrapeBlogPosts('interviewing');
    console.log('Scraped blog posts:', JSON.stringify(posts, null, 2));
    console.log(`Successfully scraped ${posts.length} posts`);
  } catch (error) {
    console.error('Error scraping blog posts:', error);
    process.exit(1);
  }
}

main(); 