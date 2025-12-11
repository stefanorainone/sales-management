const puppeteer = require('puppeteer');

async function testMobileFilters() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // iPhone 14 Pro dimensions
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3 });

    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'stefanorainone@gmail.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await Promise.race([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
      new Promise(r => setTimeout(r, 8000))
    ]);

    // Wait for dashboard
    await new Promise(r => setTimeout(r, 5000));

    // On mobile, need to open hamburger menu first or navigate directly
    console.log('Navigating to relazioni...');
    await page.goto('http://localhost:3001/relazioni', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Wait for page
    await new Promise(r => setTimeout(r, 8000));

    // Screenshot iPhone 14 Pro
    await page.screenshot({
      path: 'screenshots/relazioni-iphone14pro.png',
      fullPage: true
    });
    console.log('iPhone 14 Pro screenshot saved');

    // Check for preset text
    const pageContent = await page.content();
    console.log('Has "Da Contattare":', pageContent.includes('Da Contattare'));
    console.log('Has "Da Coltivare":', pageContent.includes('Da Coltivare'));
    console.log('Has "VIP":', pageContent.includes('VIP'));
    console.log('Has motivational quote:', pageContent.includes('networking') || pageContent.includes('relazioni'));

    // iPhone SE (smaller)
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: 'screenshots/relazioni-iphoneSE.png',
      fullPage: true
    });
    console.log('iPhone SE screenshot saved');

    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

testMobileFilters();
