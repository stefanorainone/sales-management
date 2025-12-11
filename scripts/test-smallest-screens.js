const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/smallest-screens');

// Test smallest screens
const VIEWPORTS = [
  { name: 'Samsung_360', width: 360, height: 800 },
  { name: 'iPhone5_320', width: 320, height: 568 },
];

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.type('input[type="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"]', '123456');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const elements = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      if (rect.right > window.innerWidth + 2 || rect.width > window.innerWidth + 2) {
        elements.push({
          tag: el.tagName,
          class: el.className.substring(0, 60),
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          viewportWidth: window.innerWidth,
          overflow: Math.round(rect.right - window.innerWidth),
          text: el.textContent?.substring(0, 40) || '',
          display: style.display,
          position: style.position,
          whiteSpace: style.whiteSpace
        });
      }
    });

    return {
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      overflowElements: elements.slice(0, 10)
    };
  });
}

async function testViewport(viewport) {
  console.log(`\n📱 Testing ${viewport.name} (${viewport.width}px)`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 2 });

    await login(page);

    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Full screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_full.png`),
      fullPage: true
    });
    console.log(`  ✓ Screenshot saved`);

    // Check overflow
    const overflow = await checkOverflow(page);

    if (overflow.hasOverflow) {
      console.log(`  ❌ OVERFLOW DETECTED!`);
      console.log(`     Scroll width: ${overflow.scrollWidth}px vs Viewport: ${overflow.viewportWidth}px`);
      console.log(`     Overflow: ${overflow.scrollWidth - overflow.viewportWidth}px`);

      if (overflow.overflowElements.length > 0) {
        console.log(`\n  Problematic elements:`);
        overflow.overflowElements.forEach((el, idx) => {
          console.log(`\n  ${idx + 1}. <${el.tag}> class="${el.class}"`);
          console.log(`     Width: ${el.width}px (viewport: ${el.viewportWidth}px)`);
          console.log(`     Overflow: ${el.overflow}px`);
          console.log(`     Display: ${el.display}, Position: ${el.position}`);
          console.log(`     WhiteSpace: ${el.whiteSpace}`);
          if (el.text) console.log(`     Text: "${el.text}"`);
        });
      }
    } else {
      console.log(`  ✅ No overflow detected`);
    }

    // Test specific card
    await page.evaluate(() => window.scrollTo(0, 300));
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_card_detail.png`)
    });

    return { viewport: viewport.name, hasOverflow: overflow.hasOverflow, overflow };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { viewport: viewport.name, error: error.message };
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🔍 Testing SMALLEST Mobile Screens...\n');

  const results = [];

  for (const viewport of VIEWPORTS) {
    const result = await testViewport(viewport);
    results.push(result);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('              SUMMARY                  ');
  console.log('═══════════════════════════════════════');

  results.forEach(r => {
    if (r.error) {
      console.log(`\n${r.viewport}: ❌ ERROR - ${r.error}`);
    } else {
      console.log(`\n${r.viewport}: ${r.hasOverflow ? '❌ HAS OVERFLOW' : '✅ RESPONSIVE'}`);
    }
  });

  console.log('\n═══════════════════════════════════════\n');
}

runTests().catch(console.error);
