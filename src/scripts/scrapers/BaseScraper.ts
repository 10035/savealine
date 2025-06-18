import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { ScrapedContent, ScraperConfig } from '../types.js';

export class BaseScraper {
  protected turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });
  }

  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  }

  protected convertToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }

  protected async extractContent($: cheerio.CheerioAPI, config: ScraperConfig): Promise<ScrapedContent[]> {
    const articles: ScrapedContent[] = [];
    
    $(config.articleSelector).each((_, element) => {
      const $article = $(element);
      
      const title = $article.find(config.titleSelector).text().trim();
      const content = this.convertToMarkdown($article.find(config.contentSelector).html() || '');
      const url = $article.find('a').attr('href') || '';
      const date = config.dateSelector ? $article.find(config.dateSelector).text().trim() : undefined;
      const author = config.authorSelector ? $article.find(config.authorSelector).text().trim() : undefined;
      const tags = config.tagsSelector 
        ? $article.find(config.tagsSelector).map((_, el) => $(el).text().trim()).get()
        : undefined;

      articles.push({
        title,
        content,
        url: url.startsWith('http') ? url : `${config.baseUrl}${url}`,
        source: config.baseUrl,
        date,
        author,
        tags
      });
    });

    return articles;
  }

  protected async getNextPageUrl($: cheerio.CheerioAPI, config: ScraperConfig): Promise<string | null> {
    if (!config.nextPageSelector) return null;
    
    const nextPageElement = $(config.nextPageSelector);
    if (!nextPageElement.length) return null;
    
    const nextPageUrl = nextPageElement.attr('href');
    return nextPageUrl ? `${config.baseUrl}${nextPageUrl}` : null;
  }
} 