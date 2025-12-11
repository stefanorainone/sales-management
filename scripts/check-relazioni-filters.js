const puppeteer = require('puppeteer');

async function checkRelazioniFilters() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'stefanorainone@gmail.com');
    await page.type('input[type="password"]', '123456');

    await page.click('button[type="submit"]');
    console.log('Logging in...');

    // Wait for navigation or URL change
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      new Promise(r => setTimeout(r, 8000))
    ]);
    console.log('After login, current URL:', page.url());

    // Screenshot after login attempt
    await page.screenshot({ path: 'screenshots/after-login.png' });
    console.log('After login screenshot saved');

    // Wait for today page to fully load and for sidebar to appear
    console.log('Waiting for dashboard to load...');
    await new Promise(r => setTimeout(r, 5000));

    // Screenshot today page first to confirm we're logged in
    await page.screenshot({ path: 'screenshots/today-page.png' });
    console.log('Today page screenshot saved');

    // Click on Relazioni link in sidebar
    console.log('Looking for Relazioni link...');
    try {
      // Try to find and click the Relazioni link
      const relazioniLink = await page.$('a[href="/relazioni"]');
      if (relazioniLink) {
        await relazioniLink.click();
        console.log('Clicked Relazioni link');
      } else {
        // Try navigating directly
        console.log('Link not found, navigating directly...');
        await page.goto('http://localhost:3001/relazioni', { waitUntil: 'load', timeout: 30000 });
      }
    } catch (e) {
      console.log('Error clicking link:', e.message);
      await page.goto('http://localhost:3001/relazioni', { waitUntil: 'load', timeout: 30000 });
    }

    // Wait for page to load
    console.log('Waiting for Relazioni page to load...');
    await new Promise(r => setTimeout(r, 8000));

    // Take a loading screenshot first
    await page.screenshot({ path: 'screenshots/relazioni-loading.png' });

    // Wait for the spinner to disappear
    try {
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent && h1.textContent.includes('Relazioni');
      }, { timeout: 15000 });
      console.log('Page loaded!');
    } catch (e) {
      console.log('Timeout waiting for page content');
    }

    await new Promise(r => setTimeout(r, 2000));
    console.log('Taking final screenshots...');

    // Screenshot desktop
    await page.screenshot({
      path: 'screenshots/relazioni-filters-desktop.png',
      fullPage: true
    });
    console.log('Desktop screenshot saved');

    // Screenshot mobile
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: 'screenshots/relazioni-filters-mobile.png',
      fullPage: true
    });
    console.log('Mobile screenshot saved');

    // Check for preset buttons
    const presetButtons = await page.$$('button');
    console.log(`Found ${presetButtons.length} buttons on page`);

    // Check page content
    const pageContent = await page.content();
    const hasPresets = pageContent.includes('Da Contattare') && pageContent.includes('Da Coltivare');
    console.log('Has new preset filters:', hasPresets);

    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

checkRelazioniFilters();
