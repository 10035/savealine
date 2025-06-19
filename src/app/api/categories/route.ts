import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Extract all unique link/button texts
    const categories = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button'));
      return Array.from(new Set(elements.map(e => e.textContent?.trim()).filter(Boolean)));
    });

    return NextResponse.json({ categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    await browser.close();
  }
} 