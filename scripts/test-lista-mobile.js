const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/lista-mobile-test');

// Mobile viewports to test
const VIEWPORTS = [
  { name: 'iPhone_12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPhone_SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'Samsung_S20', width: 360, height: 800, deviceScaleFactor: 3 },
  { name: 'Small_Mobile', width: 320, height: 568, deviceScaleFactor: 2 }, // iPhone 5
];

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Login function
async function login(page) {
  console.log(`  ➜ Logging in...`);

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.type('input[type="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"]', '123456');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`  ✓ Logged in`);
}

// Check for horizontal overflow
async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const documentWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    const viewportWidth = window.innerWidth;

    // Check for overflowing elements
    const overflowingElements = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 5 || rect.left < -5) { // 5px tolerance
        const computedStyle = window.getComputedStyle(el);
        overflowingElements.push({
          tag: el.tagName,
          class: el.className.substring(0, 50),
          id: el.id,
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          left: Math.round(rect.left),
          text: el.textContent?.substring(0, 30) || '',
        });
      }
    });

    return {
      hasOverflow: documentWidth > viewportWidth,
      documentWidth,
      viewportWidth,
      overflowAmount: Math.max(0, documentWidth - viewportWidth),
      overflowingElements: overflowingElements.slice(0, 5)
    };
  });
}

// Get list view info
async function getListViewInfo(page) {
  return await page.evaluate(() => {
    const listCards = document.querySelectorAll('[class*="flex flex-col gap-2"]');
    const results = {
      totalCards: listCards.length,
      cards: []
    };

    listCards.forEach((card, idx) => {
      if (idx < 3) { // Check first 3 cards
        const rect = card.getBoundingClientRect();
        results.cards.push({
          index: idx,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          fitsInViewport: rect.right <= window.innerWidth && rect.left >= 0
        });
      }
    });

    return results;
  });
}

// Test list view on a specific viewport
async function testListView(browser, viewport) {
  console.log(`\n📱 Testing List View on ${viewport.name} (${viewport.width}x${viewport.height})`);

  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor
    });

    // Login
    await login(page);

    console.log(`  ➜ Navigating to relazioni...`);
    await page.goto(`${BASE_URL}/relazioni`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Make sure we're in list view (should be default)
    console.log(`  ➜ Checking view mode...`);

    // Take full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_full.png`),
      fullPage: true
    });
    console.log(`  ✓ Full screenshot saved`);

    // Check for overflow
    console.log(`  ➜ Checking for horizontal overflow...`);
    const overflowInfo = await checkHorizontalOverflow(page);

    if (overflowInfo.hasOverflow) {
      console.log(`  ❌ OVERFLOW DETECTED!`);
      console.log(`     Document: ${overflowInfo.documentWidth}px vs Viewport: ${overflowInfo.viewportWidth}px`);
      console.log(`     Overflow: ${overflowInfo.overflowAmount}px`);

      if (overflowInfo.overflowingElements.length > 0) {
        console.log(`     Overflowing elements:`);
        overflowInfo.overflowingElements.forEach((el, idx) => {
          console.log(`       ${idx + 1}. <${el.tag}> class="${el.class}" width=${el.width}px right=${el.right}px`);
          if (el.text) console.log(`          Text: "${el.text}..."`);
        });
      }
    } else {
      console.log(`  ✅ No horizontal overflow`);
    }

    // Get list view specific info
    console.log(`  ➜ Analyzing list cards...`);
    const listInfo = await getListViewInfo(page);

    console.log(`  📋 Found ${listInfo.totalCards} cards in list view`);
    listInfo.cards.forEach(card => {
      const status = card.fitsInViewport ? '✅' : '❌';
      console.log(`     Card ${card.index + 1}: ${status} ${card.width}x${card.height}px`);
    });

    // Scroll to see middle cards
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${viewport.name}_middle.png`)
    });
    console.log(`  ✓ Middle section screenshot saved`);

    // Test a specific card
    const firstCard = await page.$('[class*="flex flex-col gap-2"]');
    if (firstCard) {
      await firstCard.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${viewport.name}_card.png`)
      });
      console.log(`  ✓ Individual card screenshot saved`);
    }

    return {
      viewport: viewport.name,
      width: viewport.width,
      success: true,
      hasOverflow: overflowInfo.hasOverflow,
      overflowAmount: overflowInfo.overflowAmount,
      overflowingElements: overflowInfo.overflowingElements,
      listInfo: listInfo
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      viewport: viewport.name,
      width: viewport.width,
      success: false,
      error: error.message
    };
  } finally {
    await page.close();
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting List View Mobile Responsive Tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  const results = [];

  try {
    for (const viewport of VIEWPORTS) {
      const result = await testListView(browser, viewport);
      results.push(result);
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    SUMMARY                            ');
    console.log('═══════════════════════════════════════════════════════');

    let allPassed = true;

    results.forEach(r => {
      if (r.success) {
        const status = r.hasOverflow ? '❌ HAS OVERFLOW' : '✅ RESPONSIVE';
        console.log(`\n${r.viewport} (${r.width}px):`);
        console.log(`  Status: ${status}`);
        if (r.hasOverflow) {
          console.log(`  Overflow: ${r.overflowAmount}px`);
          allPassed = false;
          if (r.overflowingElements && r.overflowingElements.length > 0) {
            console.log(`  Problem elements:`);
            r.overflowingElements.forEach((el, idx) => {
              console.log(`    ${idx + 1}. <${el.tag}> "${el.class}"`);
            });
          }
        }
        if (r.listInfo) {
          console.log(`  Cards: ${r.listInfo.totalCards} found`);
          const allFit = r.listInfo.cards.every(c => c.fitsInViewport);
          console.log(`  Cards fit: ${allFit ? '✅' : '❌'}`);
        }
      } else {
        console.log(`\n${r.viewport}: ❌ FAILED - ${r.error}`);
        allPassed = false;
      }
    });

    console.log('\n═══════════════════════════════════════════════════════');

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! List view is fully responsive!\n');
    } else {
      console.log('\n⚠️  SOME ISSUES FOUND. Check details above.\n');
    }

    // Save JSON report
    const reportPath = path.join(SCREENSHOTS_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      allPassed,
      results
    }, null, 2));
    console.log(`📄 Report saved: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
