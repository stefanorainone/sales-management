const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"], input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function debugWidthIssue() {
  console.log('🔍 Debug Width Issue\n');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/relazioni?v=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    const analysis = await page.evaluate(() => {
      const results = [];

      // Check body
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      results.push({
        element: 'body',
        width: body.scrollWidth,
        minWidth: bodyStyles.minWidth,
        maxWidth: bodyStyles.maxWidth,
        boxSizing: bodyStyles.boxSizing
      });

      // Check main container
      const main = document.querySelector('main');
      if (main) {
        const mainStyles = window.getComputedStyle(main);
        results.push({
          element: 'main',
          width: main.scrollWidth,
          minWidth: mainStyles.minWidth,
          maxWidth: mainStyles.maxWidth,
          padding: mainStyles.padding,
          boxSizing: mainStyles.boxSizing
        });
      }

      // Check AI widget
      const aiWidget = document.querySelector('[class*="from-purple-50"]') ||
                       document.querySelector('[class*="to-blue-50"]');
      if (aiWidget) {
        const widgetStyles = window.getComputedStyle(aiWidget);
        results.push({
          element: 'AI Widget',
          width: Math.round(aiWidget.getBoundingClientRect().width),
          minWidth: widgetStyles.minWidth,
          maxWidth: widgetStyles.maxWidth,
          cssWidth: widgetStyles.width,
          boxSizing: widgetStyles.boxSizing,
          padding: widgetStyles.padding
        });
      }

      return results;
    });

    console.log('📊 WIDTH DEBUG:\n');
    analysis.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.element}`);
      console.log(`   Actual Width: ${item.width}px`);
      console.log(`   CSS Width: ${item.cssWidth || 'N/A'}`);
      console.log(`   Min Width: ${item.minWidth}`);
      console.log(`   Max Width: ${item.maxWidth}`);
      console.log(`   Box Sizing: ${item.boxSizing}`);
      if (item.padding) console.log(`   Padding: ${item.padding}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugWidthIssue().catch(console.error);
