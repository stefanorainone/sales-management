const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'stefanorainone@gmail.com';
const TEST_PASSWORD = '123456';

async function testRelazioniPage() {
  console.log('🚀 Starting Relazioni Page Test (Local)\n');

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
      console.log(`📱 [${type.toUpperCase()}] ${text}`);
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

    console.log('3️⃣ Clicking submit...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    console.log('✅ Login successful\n');

    console.log('4️⃣ Navigating to Relazioni page...');
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    console.log('5️⃣ Checking debug panel...\n');

    // Get all text from debug panel
    const debugInfo = await page.evaluate(() => {
      const panel = document.querySelector('.bg-yellow-50');
      if (panel) {
        return {
          found: true,
          text: panel.innerText,
          userIdElement: panel.querySelector('div:nth-child(2)')?.innerText,
          emailElement: panel.querySelector('div:nth-child(3)')?.innerText,
          countElement: panel.querySelector('div:nth-child(5)')?.innerText,
        };
      }
      return { found: false };
    });

    if (debugInfo.found) {
      console.log('═══════════════════════════════════════');
      console.log('           DEBUG PANEL DATA            ');
      console.log('═══════════════════════════════════════');
      console.log(debugInfo.text);
      console.log('═══════════════════════════════════════\n');
    } else {
      console.log('⚠️  No debug panel found\n');
    }

    // Check for relationships on the page
    console.log('6️⃣ Checking for relationships...');
    const pageInfo = await page.evaluate(() => {
      const gridCards = document.querySelectorAll('.hover\\:shadow-lg');
      const relationships = [];

      gridCards.forEach((card, index) => {
        const nameEl = card.querySelector('h3');
        const companyEl = card.querySelector('p.text-xs.text-gray-500');

        relationships.push({
          index: index + 1,
          name: nameEl ? nameEl.textContent : 'N/A',
          company: companyEl ? companyEl.textContent : 'N/A'
        });
      });

      return {
        count: gridCards.length,
        relationships
      };
    });

    console.log(`📊 Found ${pageInfo.count} relationship(s) on page:`);
    pageInfo.relationships.forEach(rel => {
      console.log(`   ${rel.index}. ${rel.name} - ${rel.company}`);
    });
    console.log('');

    // Test Add button
    console.log('7️⃣ Testing "Add Relationship" button...');
    const clickedAdd = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Nuova Relazione'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });

    if (clickedAdd) {
      await page.waitForTimeout(1000);

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
          const title = modal.querySelector('h3');
          return {
            opened: true,
            title: title ? title.textContent : 'No title'
          };
        }
        return { opened: false };
      });

      if (modalInfo.opened) {
        console.log(`✅ Add modal opened: "${modalInfo.title}"`);

        // Try to add a test relationship
        console.log('8️⃣ Filling form...');
        await page.type('input[placeholder*="Mario Rossi"]', 'Test Relazione');
        await page.type('input[placeholder*="Acme Corp"]', 'Azienda Test');
        await page.type('input[placeholder*="CEO"]', 'Manager');

        await page.waitForTimeout(500);
        console.log('✅ Form filled');

        // Close modal without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('ℹ️  Modal closed (not saved)\n');
      } else {
        console.log('❌ Add modal did not open\n');
      }
    } else {
      console.log('❌ Could not find Add button\n');
    }

    // Test Edit button if relationships exist
    if (pageInfo.count > 0) {
      console.log('9️⃣ Testing "Edit" button on first relationship...');
      const clickedEdit = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(btn => btn.textContent.includes('Modifica'));
        if (editBtn) {
          editBtn.click();
          return true;
        }
        return false;
      });

      if (clickedEdit) {
        await page.waitForTimeout(1000);

        const editModalInfo = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          if (modal) {
            const title = modal.querySelector('h3');
            const inputs = Array.from(modal.querySelectorAll('input'));
            return {
              opened: true,
              title: title ? title.textContent : 'No title',
              fields: inputs.map(inp => ({
                placeholder: inp.placeholder,
                value: inp.value
              }))
            };
          }
          return { opened: false };
        });

        if (editModalInfo.opened) {
          console.log(`✅ Edit modal opened: "${editModalInfo.title}"`);
          console.log('📝 Current form values:');
          editModalInfo.fields.forEach(field => {
            if (field.placeholder) {
              console.log(`   - ${field.placeholder}: "${field.value}"`);
            }
          });

          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          console.log('ℹ️  Edit modal closed\n');
        } else {
          console.log('❌ Edit modal did not open\n');
        }
      } else {
        console.log('❌ Could not find Edit button\n');
      }
    }

    // Take screenshot
    console.log('🔟 Taking screenshot...');
    await page.screenshot({
      path: 'relazioni-page-test.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved as relazioni-page-test.png\n');

    console.log('═══════════════════════════════════════');
    console.log('        TEST COMPLETED SUCCESSFULLY     ');
    console.log('═══════════════════════════════════════');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

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
