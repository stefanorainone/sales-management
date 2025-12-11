const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/mobile-issues');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"], input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function testMobileIssues() {
  console.log('🔍 Analisi Dettagliata Problemi Mobile\n');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // iPhone 12 viewport
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    // Analisi dettagliata
    const analysis = await page.evaluate(() => {
      const results = {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        issues: [],
        elements: []
      };

      // Check for horizontal overflow
      const bodyWidth = document.body.scrollWidth;
      const viewportWidth = window.innerWidth;
      if (bodyWidth > viewportWidth) {
        results.issues.push({
          type: 'OVERFLOW',
          severity: 'HIGH',
          message: `Horizontal overflow detected: body is ${bodyWidth}px but viewport is ${viewportWidth}px`
        });
      }

      // Check AI widget specifically
      const aiWidget = document.querySelector('[class*="from-purple-50"]') ||
                       document.querySelector('[class*="to-blue-50"]');

      if (aiWidget) {
        const widgetRect = aiWidget.getBoundingClientRect();
        results.elements.push({
          name: 'AI Widget Container',
          width: Math.round(widgetRect.width),
          computedWidth: window.getComputedStyle(aiWidget).width,
          overflowing: widgetRect.width > viewportWidth
        });

        // Check all task cards
        const taskCards = aiWidget.querySelectorAll('[class*="bg-white"]');
        taskCards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(card);

          results.elements.push({
            name: `Task Card ${idx + 1}`,
            width: Math.round(cardRect.width),
            padding: computedStyle.padding,
            fontSize: computedStyle.fontSize,
            overflowing: cardRect.width > viewportWidth
          });

          // Check for text overflow
          const textElements = card.querySelectorAll('div');
          textElements.forEach((text, textIdx) => {
            const textRect = text.getBoundingClientRect();
            const textStyle = window.getComputedStyle(text);
            if (textRect.width > cardRect.width) {
              results.issues.push({
                type: 'TEXT_OVERFLOW',
                severity: 'MEDIUM',
                message: `Text in Card ${idx + 1} overflows: ${Math.round(textRect.width)}px > ${Math.round(cardRect.width)}px`,
                element: text.textContent?.substring(0, 50)
              });
            }
          });
        });

        // Check header
        const header = aiWidget.querySelector('h3');
        if (header) {
          const headerRect = header.getBoundingClientRect();
          const headerStyle = window.getComputedStyle(header);
          results.elements.push({
            name: 'Widget Header',
            fontSize: headerStyle.fontSize,
            width: Math.round(headerRect.width),
            text: header.textContent
          });
        }

        // Check badges
        const badges = aiWidget.querySelectorAll('[class*="rounded-full"]');
        badges.forEach((badge, idx) => {
          const badgeStyle = window.getComputedStyle(badge);
          const badgeRect = badge.getBoundingClientRect();
          results.elements.push({
            name: `Badge ${idx + 1}`,
            fontSize: badgeStyle.fontSize,
            padding: badgeStyle.padding,
            width: Math.round(badgeRect.width),
            text: badge.textContent
          });
        });
      }

      // Check stats cards
      const statsContainer = document.querySelector('[class*="overflow-x-auto"]');
      if (statsContainer) {
        const statsRect = statsContainer.getBoundingClientRect();
        results.elements.push({
          name: 'Stats Container',
          width: Math.round(statsRect.width),
          scrollWidth: statsContainer.scrollWidth,
          hasHorizontalScroll: statsContainer.scrollWidth > statsRect.width
        });
      }

      return results;
    });

    // Report results
    console.log(`📊 Viewport: ${analysis.viewport.width}x${analysis.viewport.height}\n`);

    if (analysis.issues.length > 0) {
      console.log('⚠️  PROBLEMI TROVATI:\n');
      analysis.issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.severity}] ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.element) {
          console.log(`   Element: "${issue.element}..."`);
        }
        console.log('');
      });
    } else {
      console.log('✅ Nessun problema di overflow trovato\n');
    }

    console.log('📐 ANALISI ELEMENTI:\n');
    analysis.elements.forEach((el, idx) => {
      console.log(`${idx + 1}. ${el.name}`);
      if (el.width !== undefined) console.log(`   Width: ${el.width}px`);
      if (el.computedWidth) console.log(`   Computed Width: ${el.computedWidth}`);
      if (el.fontSize) console.log(`   Font Size: ${el.fontSize}`);
      if (el.padding) console.log(`   Padding: ${el.padding}`);
      if (el.overflowing !== undefined) console.log(`   Overflowing: ${el.overflowing ? 'YES ❌' : 'NO ✅'}`);
      if (el.hasHorizontalScroll !== undefined) console.log(`   Horizontal Scroll: ${el.hasHorizontalScroll ? 'YES ✅' : 'NO'}`);
      if (el.text) console.log(`   Text: "${el.text.substring(0, 40)}..."`);
      console.log('');
    });

    // Take screenshots
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile_full_page.png'),
      fullPage: true
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile_viewport.png'),
      clip: { x: 0, y: 0, width: 390, height: 844 }
    });

    console.log(`📁 Screenshots salvati in: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileIssues().catch(console.error);
