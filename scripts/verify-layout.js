const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/layout-verification');

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

async function verifyLayout() {
  console.log('🔍 Verifying Relazioni Page Layout\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Test on mobile viewport
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });

    await login(page);

    console.log('  ➜ Navigating to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('  ➜ Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get layout order
    const layoutInfo = await page.evaluate(() => {
      const elements = [];
      const viewportWidth = window.innerWidth;

      // Helper to check if element is actually visible in viewport (not translated off-screen)
      const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        // Element must be at least partially in the horizontal viewport
        return rect.right > 0 && rect.left < viewportWidth;
      };

      // Find AI widget
      const aiWidget = document.querySelector('[class*="from-purple-50"]') ||
                       document.querySelector('[class*="to-blue-50"]');
      if (aiWidget && isInViewport(aiWidget)) {
        const rect = aiWidget.getBoundingClientRect();
        elements.push({
          name: 'AI Widget',
          position: Math.round(rect.top),
          height: Math.round(rect.height),
          text: aiWidget.querySelector('h3')?.textContent || 'No header'
        });
      }

      // Find page header (skip sidebar h1 if it's off-screen)
      const headers = document.querySelectorAll('h1');
      for (const header of headers) {
        if (isInViewport(header)) {
          const rect = header.getBoundingClientRect();
          elements.push({
            name: 'Page Header',
            position: Math.round(rect.top),
            height: Math.round(rect.height),
            text: header.textContent?.substring(0, 30) || 'No text'
          });
          break; // Only take first visible h1
        }
      }

      // Find stats cards
      const statsContainer = document.querySelector('[class*="overflow-x-auto"]') ||
                             document.querySelectorAll('[class*="border-l-4"]')[0]?.parentElement;
      if (statsContainer && isInViewport(statsContainer)) {
        const rect = statsContainer.getBoundingClientRect();
        elements.push({
          name: 'Stats Cards',
          position: Math.round(rect.top),
          height: Math.round(rect.height),
          text: 'Stats container'
        });
      }

      // Check if stats are horizontal
      const statsCards = document.querySelectorAll('[class*="border-l-4"]');
      let statsLayout = 'unknown';
      if (statsCards.length >= 2) {
        const first = statsCards[0].getBoundingClientRect();
        const second = statsCards[1].getBoundingClientRect();
        // If second card is on same row (similar Y position), they're horizontal
        statsLayout = Math.abs(first.top - second.top) < 10 ? 'horizontal' : 'vertical';
      }

      return {
        elements: elements.sort((a, b) => a.position - b.position),
        statsLayout,
        statsCount: statsCards.length,
        viewportWidth: window.innerWidth
      };
    });

    console.log('\n📊 Layout Analysis:\n');
    console.log(`  Viewport: ${layoutInfo.viewportWidth}px`);
    console.log(`  Stats layout: ${layoutInfo.statsLayout}`);
    console.log(`  Stats cards found: ${layoutInfo.statsCount}`);
    console.log('\n  Element Order (top to bottom):');

    layoutInfo.elements.forEach((el, idx) => {
      console.log(`    ${idx + 1}. ${el.name} (${el.position}px from top, ${el.height}px tall)`);
      console.log(`       "${el.text}"`);
    });

    // Take screenshots
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile_full.png'),
      fullPage: true
    });
    console.log('\n  ✓ Full page screenshot saved');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile_top.png'),
      clip: { x: 0, y: 0, width: 390, height: 844 }
    });
    console.log('  ✓ Top section screenshot saved');

    // Scroll to stats
    await page.evaluate(() => {
      const stats = document.querySelector('[class*="overflow-x-auto"]');
      if (stats) stats.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile_stats.png'),
      clip: { x: 0, y: 0, width: 390, height: 844 }
    });
    console.log('  ✓ Stats section screenshot saved');

    // Check what's first
    const firstElement = layoutInfo.elements[0];
    if (firstElement.name === 'AI Widget') {
      console.log('\n  ✅ CORRECT: AI Widget is FIRST');
    } else {
      console.log(`\n  ❌ WRONG: ${firstElement.name} is first, not AI Widget`);
    }

    if (layoutInfo.statsLayout === 'horizontal') {
      console.log('  ✅ CORRECT: Stats are horizontal on mobile');
    } else {
      console.log(`  ❌ WRONG: Stats are ${layoutInfo.statsLayout}, not horizontal`);
    }

    console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('  ❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyLayout().catch(console.error);
