const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'stefanorainone@gmail.com',
  password: '123456',
};

async function testBriefingLoop() {
  console.log('🧪 Testing Briefing Loading Loop Issue\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    devtools: true,
  });

  try {
    const page = await browser.newPage();

    // Monitor network requests
    const requests = [];
    const briefingRequests = [];

    page.on('request', request => {
      const url = request.url();
      requests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString(),
      });

      if (url.includes('/api/ai/briefing')) {
        briefingRequests.push({
          timestamp: new Date().toISOString(),
          method: request.method(),
        });
        console.log(`📡 [${briefingRequests.length}] Briefing API Request: ${request.method()}`);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/ai/briefing')) {
        console.log(`📥 Briefing API Response: ${response.status()}`);
        try {
          const data = await response.json();
          console.log(`   Tasks: ${data.tasks?.length || 0}, Insights: ${data.insights?.length || 0}`);
        } catch (e) {
          console.log(`   Could not parse response`);
        }
      }
    });

    // Monitor console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('briefing') || text.includes('Briefing') || text.includes('Loading')) {
        console.log(`🖥️  Console: ${text}`);
      }
    });

    console.log('1️⃣  Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    console.log('2️⃣  Logging in...');
    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    console.log('3️⃣  Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}\n`);

    console.log('4️⃣  Monitoring briefing requests for 30 seconds...\n');
    console.log('   Looking for loop pattern (multiple identical requests)...\n');

    // Wait and monitor
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n📊 RESULTS:\n');
    console.log(`Total network requests: ${requests.length}`);
    console.log(`Briefing API requests: ${briefingRequests.length}\n`);

    if (briefingRequests.length > 3) {
      console.log('❌ LOOP DETECTED!');
      console.log(`   Expected: 1-2 requests`);
      console.log(`   Actual: ${briefingRequests.length} requests\n`);

      console.log('🔍 Request Timeline:');
      briefingRequests.forEach((req, idx) => {
        console.log(`   [${idx + 1}] ${req.timestamp} - ${req.method}`);

        // Calculate time between requests
        if (idx > 0) {
          const prev = new Date(briefingRequests[idx - 1].timestamp);
          const curr = new Date(req.timestamp);
          const diff = (curr - prev) / 1000;
          console.log(`       ⏱️  ${diff.toFixed(2)}s since last request`);
        }
      });
    } else if (briefingRequests.length === 0) {
      console.log('⚠️  NO BRIEFING REQUESTS');
      console.log('   The briefing API was never called!');
    } else {
      console.log('✅ NO LOOP DETECTED');
      console.log(`   Normal behavior: ${briefingRequests.length} request(s)`);
    }

    // Check for loading indicators stuck
    console.log('\n5️⃣  Checking for stuck loading indicators...');

    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], [class*="animate-spin"]');
    console.log(`   Found ${loadingElements.length} loading elements`);

    if (loadingElements.length > 0) {
      console.log('   ⚠️  Loading indicators still present after 30s');
    }

    // Take screenshot
    console.log('\n6️⃣  Taking screenshot...');
    await page.screenshot({
      path: 'briefing-test-screenshot.png',
      fullPage: true
    });
    console.log('   Screenshot saved: briefing-test-screenshot.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

// Run the test
testBriefingLoop().catch(console.error);
