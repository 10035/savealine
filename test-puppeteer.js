import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('Testing Puppeteer setup...');
  
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('✅ Page created successfully');
    
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    console.log('✅ Successfully navigated to example.com');
    
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    console.log('✅ All tests passed! Puppeteer is working correctly.');
    
    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPuppeteer(); 