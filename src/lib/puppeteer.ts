let puppeteer: any;
let chromium: any;

if (process.env.NODE_ENV === 'production') {
  // Use puppeteer-core and @sparticuz/chromium in production (Vercel)
  chromium = require('@sparticuz/chromium');
  puppeteer = require('puppeteer-core');
} else {
  // Use regular puppeteer in development
  puppeteer = require('puppeteer');
}

import type { Browser, Page } from 'puppeteer-core';

// Singleton browser instance for better performance
let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    if (process.env.NODE_ENV === 'production') {
      browserInstance = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
      });
    }
  }
  return browserInstance!;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Utility function to create a new page with common configurations
export async function createPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Set common page configurations
  await page.setViewport({ width: 1280, height: 720 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Optimize for scraping by blocking unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', (req: any) => {
    const resourceType = req.resourceType();
    if ([
      'image',
      'stylesheet',
      'font',
      'media',
    ].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
}

// Cleanup function to be called when the process exits
process.on('exit', () => {
  closeBrowser();
});

process.on('SIGINT', () => {
  closeBrowser();
  process.exit();
});

process.on('SIGTERM', () => {
  closeBrowser();
  process.exit();
}); 