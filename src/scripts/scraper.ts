import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { UniversalScraper } from './scrapers/UniversalScraper.js';

const program = new Command();

program
  .name('content-scraper')
  .description('Scrape content from various sources and convert to markdown')
  .version('1.0.0');

program
  .command('scrape')
  .description('Scrape content from a specific URL')
  .argument('<url>', 'URL to scrape')
  .option('-o, --output <directory>', 'Output directory for markdown files', './output')
  .action(async (url: string, options: { output: string }) => {
    try {
      console.log(chalk.blue(`Starting to scrape ${url}...`));
      
      const scraper = new UniversalScraper();
      const articles = await scraper.scrape(url);

      // Create output directory if it doesn't exist
      await fs.mkdir(options.output, { recursive: true });

      // Save each article as a markdown file
      for (const article of articles) {
        const filename = `${article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
        const filepath = path.join(options.output, filename);
        
        const markdown = `---
title: ${article.title}
url: ${article.url}
source: ${article.source}
---

${article.content}
`;

        await fs.writeFile(filepath, markdown);
        console.log(chalk.green(`Saved: ${filename}`));
      }

      console.log(chalk.blue(`Successfully scraped ${articles.length} articles from ${url}`));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv); 