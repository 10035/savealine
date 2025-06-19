export interface BlogPost {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  url: string;
  source: string;
}

export interface ScrapeConfig {
  url: string;
  name?: string;
  mode?: 'crawl' | 'pdf';
  source_type: 'blog' | 'guide' | 'book';
  knowledge_base_id: string;
  linkSelector?: string;
  contentSelector?: string;
  chunkSize?: number;
  preset?: string;
  category?: string;
}

export interface ScrapePreset {
  id: string;
  name: string;
  description: string;
  config: ScrapeConfig;
}

export const PRESETS: ScrapePreset[] = [
  {
    id: 'interviewing-blog',
    name: 'Interviewing.io Blog',
    description: 'Scrape all blog posts from interviewing.io',
    config: {
      url: 'https://interviewing.io/blog',
      name: 'interviewing-blog'
    }
  },
  {
    id: 'interviewing-companies',
    name: 'Company Guides',
    description: 'Scrape all company guides from interviewing.io',
    config: {
      url: 'https://interviewing.io/topics#companies',
      name: 'company-guides'
    }
  },
  {
    id: 'interviewing-guides',
    name: 'Interview Guides',
    description: 'Scrape all interview guides from interviewing.io',
    config: {
      url: 'https://interviewing.io/learn#interview-guides',
      name: 'interview-guides'
    }
  },
  {
    id: 'nil-dsa',
    name: "Nil's DSA Blog",
    description: 'Scrape all DSA blog posts from nilmamano.com',
    config: {
      url: 'https://nilmamano.com/blog/category/dsa',
      name: 'nil-dsa'
    }
  },
  {
    id: 'custom-blog',
    name: 'Custom Blog',
    description: 'Scrape any blog with custom selectors',
    config: {
      url: '',
      name: 'custom-blog'
    }
  }
]; 