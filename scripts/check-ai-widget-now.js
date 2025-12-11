const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/ai-widget-check');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function checkAIWidget() {
  console.log('🔍 Checking AI Widget on Relazioni Page\n');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  try {
    // Login
    console.log('  ➜ Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
    await page.type('input[type="password"], input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('  ✓ Logged in\n');

    // Navigate to relazioni
    console.log('  ➜ Navigating to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    // Check for AI widget
    const widgetInfo = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) {
        return { found: false };
      }

      const rect = widget.getBoundingClientRect();
      const header = widget.querySelector('h3');
      const content = widget.textContent;

      return {
        found: true,
        position: Math.round(rect.top),
        height: Math.round(rect.height),
        headerText: header ? header.textContent : 'No header',
        hasContent: content.length > 0,
        contentPreview: content.substring(0, 100)
      };
    });

    console.log('📊 AI Widget Check Results:\n');
    if (widgetInfo.found) {
      console.log('  ✅ AI Widget FOUND!');
      console.log('  Position:', widgetInfo.position + 'px from top');
      console.log('  Height:', widgetInfo.height + 'px');
      console.log('  Header:', widgetInfo.headerText);
      console.log('  Content Preview:', widgetInfo.contentPreview.replace(/\n/g, ' ').substring(0, 80) + '...');
    } else {
      console.log('  ❌ AI Widget NOT FOUND');
    }

    // Take screenshots
    console.log('\n  ➜ Taking screenshots...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-full.png'),
      fullPage: true
    });
    console.log('  ✓ Full page screenshot saved');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-top.png'),
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    console.log('  ✓ Top section screenshot saved');

    console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('  ❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkAIWidget().catch(console.error);
