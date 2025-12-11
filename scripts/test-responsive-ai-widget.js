const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/responsive-ai-widget');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Samsung S20', width: 360, height: 800 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"], input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function testDevice(device) {
  console.log(`\n📱 Testing ${device.name} (${device.width}x${device.height})`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({
    width: device.width,
    height: device.height,
    deviceScaleFactor: 2
  });

  try {
    await login(page);

    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    // Analyze AI widget
    const widgetAnalysis = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) return { found: false };

      const rect = widget.getBoundingClientRect();
      const header = widget.querySelector('h3');
      const tasks = widget.querySelectorAll('[class*="bg-white"]');

      // Get padding from first task card
      let taskPadding = 'unknown';
      if (tasks.length > 0) {
        const firstTask = tasks[0];
        const computedStyle = window.getComputedStyle(firstTask);
        taskPadding = computedStyle.padding;
      }

      return {
        found: true,
        position: Math.round(rect.top),
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        headerText: header ? header.textContent : 'No header',
        taskCount: tasks.length,
        taskPadding: taskPadding,
        viewportHeight: window.innerHeight,
        widgetPercentage: Math.round((rect.height / window.innerHeight) * 100)
      };
    });

    if (widgetAnalysis.found) {
      console.log(`  ✅ Widget trovato`);
      console.log(`  📏 Dimensioni: ${widgetAnalysis.width}x${widgetAnalysis.height}px`);
      console.log(`  📊 Occupa ${widgetAnalysis.widgetPercentage}% del viewport`);
      console.log(`  🎯 Task cards: ${widgetAnalysis.taskCount}`);
      console.log(`  📦 Padding task: ${widgetAnalysis.taskPadding}`);

      // Check if widget is too tall (more than 80% of viewport)
      if (widgetAnalysis.widgetPercentage > 80) {
        console.log(`  ⚠️  Widget occupa troppo spazio (>${80}%)`);
      } else {
        console.log(`  ✓ Dimensioni ottimali`);
      }
    } else {
      console.log(`  ❌ Widget NON trovato`);
    }

    // Take screenshot
    const deviceSlug = device.name.replace(/\s+/g, '_');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${deviceSlug}_full.png`),
      fullPage: true
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${deviceSlug}_viewport.png`),
      clip: { x: 0, y: 0, width: device.width, height: device.height }
    });

    console.log(`  ✓ Screenshots salvati`);

  } catch (error) {
    console.log(`  ❌ Errore: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🔍 Testing AI Widget Responsiveness\n');
  console.log('=' .repeat(50));

  for (const device of devices) {
    await testDevice(device);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📁 Screenshots salvati in: ${SCREENSHOTS_DIR}\n`);
}

runTests().catch(console.error);
