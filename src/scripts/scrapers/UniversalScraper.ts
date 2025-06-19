import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { ScrapedContent } from '../types.js';

export class UniversalScraper {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });
  }

  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      console.log('Opening new page...');
      const page = await browser.newPage();
      
      // Set a longer timeout and wait for network idle
      console.log('Navigating to page...');
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for content to load
      console.log('Waiting for content to load...');
      await new Promise(res => setTimeout(res, 5000));

      // Get the page content
      console.log('Getting page content...');
      const content = await page.content();
      
      // Debug: Log the first 500 characters of content
      console.log('Page content preview:', content.substring(0, 500));
      
      return cheerio.load(content);
    } finally {
      console.log('Closing browser...');
      await browser.close();
    }
  }

  private convertToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }

  private getCommonSelectors(): { article: string[], title: string[], content: string[] } {
    return {
      article: [
        'article',
        '.post',
        '.entry',
        '.content',
        'main',
        '.blog-post',
        '.post-item',
        '.blog-item',
        '.post-card',
        '[data-testid="blog-post"]',
        '[data-testid="article"]',
        '.blog-entry',
        '.post-entry'
      ],
      title: [
        'h1',
        'h2',
        '.title',
        '.post-title',
        '.entry-title',
        'header h1',
        'header h2',
        '[data-testid="post-title"]',
        '.blog-title',
        '.post-heading'
      ],
      content: [
        '.post-content',
        '.entry-content',
        '.content',
        'article',
        '.blog-content',
        '.post-body',
        '[data-testid="post-content"]',
        '.article-content',
        '.post-text'
      ]
    };
  }

  private async extractContent($: cheerio.CheerioAPI, url: string): Promise<ScrapedContent[]> {
    const selectors = this.getCommonSelectors();
    const articles: ScrapedContent[] = [];

    console.log('Starting content extraction...');

    // First try to find individual articles
    for (const articleSelector of selectors.article) {
      console.log(`Trying article selector: ${articleSelector}`);
      const elements = $(articleSelector);
      console.log(`Found ${elements.length} elements with selector ${articleSelector}`);

      elements.each((_, element) => {
        const $article = $(element);
        let title = '';
        let content = '';

        for (const titleSelector of selectors.title) {
          const $title = $article.find(titleSelector);
          if ($title.length > 0) {
            title = $title.text().trim();
            console.log(`Found title with selector ${titleSelector}: ${title}`);
            break;
          }
        }

        for (const contentSelector of selectors.content) {
          const $content = $article.find(contentSelector);
          if ($content.length > 0) {
            content = this.convertToMarkdown($content.html() || '');
            console.log(`Found content with selector ${contentSelector} (length: ${content.length})`);
            break;
          }
        }

        if (title && content) {
          articles.push({
            title,
            content,
            url,
            source: url
          });
        }
      });
    }

    // If no articles found, try to extract the main content
    if (articles.length === 0) {
      console.log('No articles found, trying to extract main content...');
      const mainContent = $('main, article, .content, #content, #main');
      if (mainContent.length > 0) {
        const title = $('h1, h2').first().text().trim() || 'Untitled';
        const content = this.convertToMarkdown(mainContent.html() || '');
        console.log(`Found main content with title: ${title}`);
        articles.push({
          title,
          content,
          url,
          source: url
        });
      }
    }

    console.log(`Total articles found: ${articles.length}`);
    return articles;
  }

  async scrape(url: string): Promise<ScrapedContent[]> {
    console.log(`Starting to scrape ${url}...`);
    const $ = await this.fetchPage(url);
    return this.extractContent($, url);
  }
} 