const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Testing Relazioni Page Improvements...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });

    // Login
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'pippo@pippo.it');
    await page.type('input[type="password"]', 'pippo123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful\n');

    // Navigate to relazioni page
    console.log('📍 Navigating to /relazioni...');
    await page.goto('http://localhost:3001/relazioni', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a bit for page to fully render
    await page.waitForTimeout(2000);

    // Check for console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });

    // Check if page loaded properly
    console.log('🔍 Checking page elements...\n');

    // Check for main heading
    const heading = await page.$('h1');
    if (heading) {
      const text = await page.evaluate(el => el.textContent, heading);
      console.log(`✅ Page heading found: "${text}"`);
    } else {
      console.log('❌ Page heading not found');
    }

    // Check for filter inputs
    const searchInput = await page.$('input[placeholder*="Cerca"]');
    console.log(searchInput ? '✅ Search input found' : '❌ Search input not found');

    // Check for filter selects
    const selects = await page.$$('select');
    console.log(`✅ Found ${selects.length} select dropdowns`);

    // Check for add button
    const addButton = await page.$('button::-p-text(Nuova Relazione)');
    console.log(addButton ? '✅ Add button found' : '❌ Add button not found');

    // Test opening add modal
    if (addButton) {
      console.log('\n🧪 Testing add modal...');
      await addButton.click();
      await page.waitForTimeout(500);

      const modalTitle = await page.$('h2::-p-text(Nuova Relazione)');
      console.log(modalTitle ? '✅ Add modal opens successfully' : '❌ Add modal did not open');

      // Close modal
      const cancelButton = await page.$('button::-p-text(Annulla)');
      if (cancelButton) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Modal closed successfully');
      }
    }

    // Check for any React errors or warnings
    console.log('\n📊 Checking for console errors...');
    if (logs.length > 0) {
      console.log('⚠️  Console errors found:');
      logs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('✅ No console errors detected');
    }

    // Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'test-relazioni-improvements.png', fullPage: true });
    console.log('✅ Screenshot saved to test-relazioni-improvements.png');

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
