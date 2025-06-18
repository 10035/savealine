export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  source: string;
  date?: string;
  author?: string;
  tags?: string[];
}

export interface ScraperConfig {
  baseUrl: string;
  articleSelector: string;
  titleSelector: string;
  contentSelector: string;
  dateSelector?: string;
  authorSelector?: string;
  tagsSelector?: string;
  paginationSelector?: string;
  nextPageSelector?: string;
  maxPages?: number;
}

export interface Scraper {
  scrape(config: ScraperConfig): Promise<ScrapedContent[]>;
} 