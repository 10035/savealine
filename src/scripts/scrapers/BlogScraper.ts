import { ScrapedContent, ScraperConfig } from '../types.js';
import { BaseScraper } from './BaseScraper.js';

export class BlogScraper extends BaseScraper {
  async scrape(config: ScraperConfig): Promise<ScrapedContent[]> {
    const allArticles: ScrapedContent[] = [];
    let currentPage = 1;
    let currentUrl: string | null = config.baseUrl;

    while (currentUrl && (!config.maxPages || currentPage <= config.maxPages)) {
      const $ = await this.fetchPage(currentUrl);
      const articles = await this.extractContent($, config);
      allArticles.push(...articles);

      currentUrl = await this.getNextPageUrl($, config);
      currentPage++;
    }

    return allArticles;
  }
} 