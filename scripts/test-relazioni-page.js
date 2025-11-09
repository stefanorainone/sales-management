const puppeteer = require('puppeteer');

const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';
const TEST_EMAIL = 'stefano.rainone@gmail.com';
const TEST_PASSWORD = 'Test123!';

async function testRelazioniPage() {
  console.log('🚀 Starting Relazioni Page Test\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`❌ Browser Error: ${text}`);
      } else if (text.includes('👤') || text.includes('🔍') || text.includes('📊') || text.includes('❌')) {
        console.log(`📱 Browser Log: ${text}`);
      }
    });

    // Capture network errors
    page.on('requestfailed', (request) => {
      console.log(`❌ Request Failed: ${request.url()}`);
    });

    console.log('1️⃣ Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    console.log('2️⃣ Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    ]);

    console.log('✅ Login successful\n');

    console.log('3️⃣ Navigating to Relazioni page...');
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    console.log('4️⃣ Checking debug panel...');

    // Try to find debug panel
    const debugPanel = await page.$('.bg-yellow-50');
    if (debugPanel) {
      const debugText = await page.evaluate(() => {
        const panel = document.querySelector('.bg-yellow-50');
        return panel ? panel.innerText : null;
      });
      console.log('\n📊 DEBUG PANEL INFO:');
      console.log(debugText);
      console.log('');
    } else {
      console.log('⚠️  No debug panel found (might be in production mode)\n');
    }

    // Check for relationships on the page
    console.log('5️⃣ Checking for relationships...');
    const relationshipsCount = await page.evaluate(() => {
      // Check grid view
      const gridCards = document.querySelectorAll('.grid .hover\\:shadow-lg');
      return gridCards.length;
    });

    console.log(`📊 Found ${relationshipsCount} relationship cards on page\n`);

    // Check if there's an "Add" button
    console.log('6️⃣ Testing Add Relationship button...');
    const addButton = await page.$('button:has-text("+ Nuova Relazione")');
    if (!addButton) {
      // Try alternative selector
      const addButtons = await page.$$('button');
      for (const btn of addButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Nuova Relazione')) {
          console.log('✅ Found "Add Relationship" button');
          await btn.click();
          await page.waitForTimeout(1000);

          // Check if modal opened
          const modalTitle = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"], .fixed.inset-0');
            if (modal) {
              const title = modal.querySelector('h3');
              return title ? title.textContent : null;
            }
            return null;
          });

          if (modalTitle) {
            console.log(`✅ Modal opened: "${modalTitle}"\n`);

            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } else {
            console.log('❌ Modal did not open\n');
          }
          break;
        }
      }
    }

    // Try to click edit on first relationship if exists
    if (relationshipsCount > 0) {
      console.log('7️⃣ Testing Edit button on first relationship...');
      const editButtons = await page.$$('button');
      for (const btn of editButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Modifica')) {
          console.log('✅ Found "Edit" button, clicking...');
          await btn.click();
          await page.waitForTimeout(1000);

          // Check if modal opened
          const modalTitle = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"], .fixed.inset-0');
            if (modal) {
              const title = modal.querySelector('h3');
              return title ? title.textContent : null;
            }
            return null;
          });

          if (modalTitle) {
            console.log(`✅ Edit modal opened: "${modalTitle}"`);

            // Get form data
            const formData = await page.evaluate(() => {
              const inputs = Array.from(document.querySelectorAll('input'));
              return inputs.map(input => ({
                placeholder: input.placeholder,
                value: input.value
              })).filter(i => i.placeholder);
            });

            console.log('📝 Form data:');
            formData.forEach(field => {
              console.log(`  - ${field.placeholder}: ${field.value || '(empty)'}`);
            });

            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
          break;
        }
      }
    }

    // Take screenshot
    console.log('\n8️⃣ Taking screenshot...');
    await page.screenshot({
      path: 'relazioni-page-test.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved as relazioni-page-test.png\n');

    // Get user info from AuthContext
    console.log('9️⃣ Checking authentication state...');
    const authInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            cookies: document.cookie,
            localStorage: Object.keys(localStorage).reduce((acc, key) => {
              acc[key] = localStorage.getItem(key);
              return acc;
            }, {})
          });
        }, 500);
      });
    });

    console.log('🔐 Auth Info:');
    console.log(`  - Cookies: ${authInfo.cookies || 'None'}`);
    console.log(`  - LocalStorage keys: ${Object.keys(authInfo.localStorage).join(', ') || 'None'}\n`);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testRelazioniPage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
