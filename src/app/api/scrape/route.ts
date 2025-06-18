import { NextResponse } from 'next/server';
import { scrapeBlogPosts } from '@/lib/scraper';

export async function POST() {
  try {
    const posts = await scrapeBlogPosts('interviewing');
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error scraping posts:', error);
    return NextResponse.json(
      { error: 'Failed to scrape posts' },
      { status: 500 }
    );
  }
} 