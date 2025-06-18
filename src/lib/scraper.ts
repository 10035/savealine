import puppeteer from 'puppeteer';
import { BlogPost, ScraperConfig } from '@/types/blog';

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
};

export async function scrapeBlogPosts(source: string): Promise<BlogPost[]> {
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