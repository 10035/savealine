export interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  url: string;
  source: string;
}

export interface ScraperConfig {
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