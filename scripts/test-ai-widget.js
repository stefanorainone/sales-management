const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/ai-widget-test');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function login(page) {
  console.log('  ➜ Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('input[type="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"]', '123456');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('  ✓ Logged in');
}

async function testAIWidget() {
  console.log('🤖 Testing AI Widget on Relazioni Page\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    await login(page);

    console.log('  ➜ Navigating to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('  ➜ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'relazioni_full.png'),
      fullPage: true
    });
    console.log('  ✓ Full page screenshot saved');

    // Check if AI widget exists
    const aiWidget = await page.evaluate(() => {
      // Look for the AI widget component
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) return { found: false };

      const header = widget.querySelector('h3');
      const text = header ? header.textContent : '';
      const rect = widget.getBoundingClientRect();

      return {
        found: true,
        text,
        visible: rect.top >= 0 && rect.top < window.innerHeight,
        position: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    });

    console.log('\n📊 AI Widget Check:');
    if (aiWidget.found) {
      console.log('  ✅ AI Widget FOUND');
      console.log(`     Text: "${aiWidget.text}"`);
      console.log(`     Visible: ${aiWidget.visible ? 'YES' : 'NO'}`);
      console.log(`     Position: ${aiWidget.position}px from top`);
      console.log(`     Size: ${aiWidget.width}x${aiWidget.height}px`);
    } else {
      console.log('  ❌ AI Widget NOT FOUND');
    }

    // Take screenshot of top part where widget should be
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'relazioni_top.png'),
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    console.log('  ✓ Top section screenshot saved');

    // Check for errors in console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait a bit more to see if widget loads
    console.log('\n  ➜ Waiting 5 more seconds for lazy loading...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take another screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'relazioni_after_wait.png'),
      fullPage: true
    });
    console.log('  ✓ After-wait screenshot saved');

    // Check again
    const aiWidgetAgain = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      return { found: !!widget };
    });

    console.log(`\n  Widget after wait: ${aiWidgetAgain.found ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Get page HTML to debug
    const pageContent = await page.content();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'page.html'), pageContent);
    console.log('  ✓ Page HTML saved for debugging');

    // Check network requests for API call
    console.log('\n  ➜ Checking network activity...');
    await page.evaluate(() => {
      console.log('Page URL:', window.location.href);
      console.log('Document ready:', document.readyState);
    });

  } catch (error) {
    console.error('  ❌ Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
}

testAIWidget().catch(console.error);
