const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/relazioni-mobile');

// Mobile viewports to test
const VIEWPORTS = [
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, deviceScaleFactor: 3 },
];

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
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

    // Also check for elements that overflow
    const overflowingElements = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth || rect.left < 0) {
        const computedStyle = window.getComputedStyle(el);
        overflowingElements.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          width: rect.width,
          right: rect.right,
          left: rect.left,
          overflow: computedStyle.overflow,
          overflowX: computedStyle.overflowX
        });
      }
    });

    return {
      hasOverflow: documentWidth > viewportWidth,
      documentWidth,
      viewportWidth,
      overflowAmount: Math.max(0, documentWidth - viewportWidth),
      overflowingElements: overflowingElements.slice(0, 10) // Limit to first 10
    };
  });
}

// Check for text that gets cut off
async function checkTextCutoff(page) {
  return await page.evaluate(() => {
    const textElements = [];
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');

    elements.forEach(el => {
      if (el.scrollWidth > el.clientWidth && el.textContent.trim().length > 0) {
        textElements.push({
          tag: el.tagName,
          class: el.className,
          text: el.textContent.substring(0, 50),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflow: el.scrollWidth - el.clientWidth
        });
      }
    });

    return textElements.slice(0, 10); // Limit to first 10
  });
}

// Login function
async function login(page) {
  console.log(`  ➜ Logging in...`);

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Fill in login form
  await page.type('input[type="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"]', '123456');

  // Click login button and wait for navigation using Promise.all
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  // Wait for auth to complete - look for a common element that appears after login
  await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});

  // Give it extra time for Firebase auth
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`  ✓ Logged in successfully`);
}

// Test the relazioni page
async function testRelazioniPage(browser, viewport) {
  console.log(`\n📱 Testing Relazioni page on ${viewport.name} (${viewport.width}x${viewport.height})`);

  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor
    });

    // Login first
    await login(page);

    console.log(`  ➜ Navigating to ${BASE_URL}/relazioni...`);

    // Navigate to relazioni page
    await page.goto(`${BASE_URL}/relazioni`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take full page screenshot
    const screenshotName = `relazioni_${viewport.name.replace(/\s+/g, '_')}_full.png`;
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, screenshotName),
      fullPage: true
    });
    console.log(`  ✓ Full page screenshot saved: ${screenshotName}`);

    // Check for horizontal overflow
    console.log(`  ➜ Checking for horizontal overflow...`);
    const overflowInfo = await checkHorizontalOverflow(page);

    if (overflowInfo.hasOverflow) {
      console.log(`  ❌ HORIZONTAL OVERFLOW DETECTED!`);
      console.log(`     Document width: ${overflowInfo.documentWidth}px`);
      console.log(`     Viewport width: ${overflowInfo.viewportWidth}px`);
      console.log(`     Overflow: ${overflowInfo.overflowAmount}px`);

      if (overflowInfo.overflowingElements.length > 0) {
        console.log(`     Overflowing elements:`);
        overflowInfo.overflowingElements.forEach((el, idx) => {
          console.log(`       ${idx + 1}. <${el.tag}> class="${el.class}" width=${el.width}px right=${el.right}px`);
        });
      }
    } else {
      console.log(`  ✅ No horizontal overflow`);
    }

    // Check for text cutoff
    console.log(`  ➜ Checking for text cutoff...`);
    const textCutoff = await checkTextCutoff(page);

    if (textCutoff.length > 0) {
      console.log(`  ⚠️  Text cutoff detected in ${textCutoff.length} elements:`);
      textCutoff.forEach((el, idx) => {
        console.log(`       ${idx + 1}. <${el.tag}> class="${el.class.substring(0, 30)}" overflow=${el.overflow}px`);
        console.log(`          "${el.text}..."`);
      });
    } else {
      console.log(`  ✅ No text cutoff detected`);
    }

    // Take screenshot of just the header/stats section
    const headerElement = await page.$('div[class*="space-y"]');
    if (headerElement) {
      await headerElement.screenshot({
        path: path.join(SCREENSHOTS_DIR, `relazioni_${viewport.name.replace(/\s+/g, '_')}_header.png`)
      });
      console.log(`  ✓ Header section screenshot saved`);
    }

    // Scroll down to see cards/list
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(resolve => setTimeout(resolve, 500));

    const contentScreenshot = `relazioni_${viewport.name.replace(/\s+/g, '_')}_content.png`;
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, contentScreenshot)
    });
    console.log(`  ✓ Content section screenshot saved`);

    // Test grid view if exists
    const gridButton = await page.$('button:has-text("Griglia")');
    if (gridButton) {
      await gridButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `relazioni_${viewport.name.replace(/\s+/g, '_')}_grid.png`),
        fullPage: true
      });
      console.log(`  ✓ Grid view screenshot saved`);
    }

    return {
      viewport: viewport.name,
      success: true,
      hasOverflow: overflowInfo.hasOverflow,
      overflowAmount: overflowInfo.overflowAmount,
      overflowingElements: overflowInfo.overflowingElements.length,
      textCutoffCount: textCutoff.length
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      viewport: viewport.name,
      success: false,
      error: error.message
    };
  } finally {
    await page.close();
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Relazioni page mobile responsive tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

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
      const result = await testRelazioniPage(browser, viewport);
      results.push(result);
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                      SUMMARY                          ');
    console.log('═══════════════════════════════════════════════════════');

    results.forEach(r => {
      if (r.success) {
        console.log(`\n${r.viewport}:`);
        console.log(`  Status: ${r.hasOverflow ? '❌ HAS OVERFLOW' : '✅ NO OVERFLOW'}`);
        if (r.hasOverflow) {
          console.log(`  Overflow: ${r.overflowAmount}px`);
          console.log(`  Overflowing elements: ${r.overflowingElements}`);
        }
        console.log(`  Text cutoff issues: ${r.textCutoffCount}`);
      } else {
        console.log(`\n${r.viewport}: ❌ FAILED - ${r.error}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`\n✅ Tests complete! Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

    // Save JSON report
    const reportPath = path.join(SCREENSHOTS_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results
    }, null, 2));
    console.log(`📄 JSON report saved to: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(console.error);
