# Content Scraper

A scalable web scraper that converts blog posts and articles into markdown format. This tool is designed to work with various blog platforms and can be easily extended to support new sources.

## Features

- Converts HTML content to clean markdown
- Handles pagination automatically
- Preserves metadata (title, date, author, tags)
- Supports multiple content sources
- Easy to extend for new sources
- Command-line interface for easy use

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Usage

### List Available Sources

```bash
npm run scrape list-sources
```

### Scrape Content

```bash
npm run scrape scrape <source> [options]
```

Options:

- `-o, --output <directory>`: Output directory for markdown files (default: './output')

Example:

```bash
npm run scrape scrape interviewing-blog -o ./content
```

### Supported Sources

- interviewing-blog: Blog posts from interviewing.io
- interviewing-companies: Company guides from interviewing.io
- interviewing-guides: Interview guides from interviewing.io
- nilmamano-dsa: DS&A blog posts from nilmamano.com

## Adding New Sources

To add a new source, add a new configuration to the `configs` object in `src/scripts/scraper.ts`. The configuration should include:

- `baseUrl`: The base URL of the source
- `articleSelector`: CSS selector for article containers
- `titleSelector`: CSS selector for article titles
- `contentSelector`: CSS selector for article content
- `dateSelector` (optional): CSS selector for article dates
- `authorSelector` (optional): CSS selector for article authors
- `tagsSelector` (optional): CSS selector for article tags
- `nextPageSelector` (optional): CSS selector for pagination next button

## Output Format

Each scraped article is saved as a markdown file with the following structure:

```markdown
---
title: Article Title
url: https://source.com/article
source: https://source.com
date: 2024-01-01
author: Author Name
tags: tag1, tag2, tag3
---

Article content in markdown format...
```

## Contributing

Feel free to submit issues and enhancement requests!
