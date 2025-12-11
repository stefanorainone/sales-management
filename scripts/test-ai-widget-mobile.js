const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/ai-widget-mobile-test');

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

async function testMobileWidget(viewport) {
  console.log(`\n📱 Testing AI Widget on ${viewport.name} (${viewport.width}px)`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.scale
    });

    await login(page);

    console.log('  ➜ Navigating to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('  ➜ Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take full screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_full.png`),
      fullPage: true
    });
    console.log('  ✓ Full screenshot saved');

    // Check if widget exists
    const widgetInfo = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) return { found: false };

      const header = widget.querySelector('h3');
      const rect = widget.getBoundingClientRect();

      // Check for task sections
      const mainTasks = widget.querySelectorAll('[class*="border-purple"]');
      const bonusTasks = widget.querySelectorAll('[class*="border-gray"]');

      return {
        found: true,
        headerText: header?.textContent || '',
        visible: rect.top >= 0,
        position: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewportWidth: window.innerWidth,
        mainTasksCount: mainTasks.length,
        bonusTasksCount: bonusTasks.length
      };
    });

    console.log('\n  📊 Widget Info:');
    if (widgetInfo.found) {
      console.log(`     ✅ Widget FOUND`);
      console.log(`     Header: "${widgetInfo.headerText}"`);
      console.log(`     Visible: ${widgetInfo.visible ? 'YES' : 'NO'}`);
      console.log(`     Position: ${widgetInfo.position}px from top`);
      console.log(`     Size: ${widgetInfo.width}x${widgetInfo.height}px`);
      console.log(`     Viewport: ${widgetInfo.viewportWidth}px`);
      console.log(`     Main tasks: ${widgetInfo.mainTasksCount}`);
      console.log(`     Bonus tasks: ${widgetInfo.bonusTasksCount}`);
    } else {
      console.log(`     ❌ Widget NOT FOUND`);
    }

    // Take screenshot of top area
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_top.png`),
      clip: { x: 0, y: 0, width: viewport.width, height: Math.min(800, viewport.height) }
    });
    console.log('  ✓ Top section screenshot saved');

    return { viewport: viewport.name, ...widgetInfo };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { viewport: viewport.name, found: false, error: error.message };
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🤖 Testing AI Widget on Mobile Devices\n');

  const viewports = [
    { name: 'iPhone_12', width: 390, height: 844, scale: 3 },
    { name: 'iPhone_SE', width: 375, height: 667, scale: 2 },
    { name: 'Samsung_360', width: 360, height: 800, scale: 3 },
  ];

  const results = [];

  for (const viewport of viewports) {
    const result = await testMobileWidget(viewport);
    results.push(result);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                      SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════');

  results.forEach(r => {
    if (r.error) {
      console.log(`\n${r.viewport}: ❌ ERROR - ${r.error}`);
    } else if (r.found) {
      console.log(`\n${r.viewport}: ✅ WIDGET VISIBLE`);
      console.log(`  Tasks: ${r.mainTasksCount + r.bonusTasksCount} total`);
    } else {
      console.log(`\n${r.viewport}: ❌ WIDGET NOT FOUND`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
}

runTests().catch(console.error);
