const puppeteer = require('puppeteer');

const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';
const TEST_EMAIL = 'stefanorainone@gmail.com';
const TEST_PASSWORD = '123456';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProductionRelazioni() {
  console.log('🚀 Testing PRODUCTION Relazioni Page\n');
  console.log(`📍 URL: ${BASE_URL}/relazioni\n`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Disable cache to force fresh content
    await page.setCacheEnabled(false);

    // Enable console logging
    page.on('console', (msg) => {
      const text = msg.text();
      console.log(`   [BROWSER] ${text}`);
    });

    // Capture errors
    page.on('pageerror', (error) => {
      console.log(`   ❌ [PAGE ERROR] ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      console.log(`   ❌ [REQUEST FAILED] ${request.url()}`);
    });

    console.log('1️⃣  Navigating to login page...');
    await page.goto(`${BASE_URL}/login?_=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('2️⃣  Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);
    console.log('   ✅ Logged in\n');

    console.log('3️⃣  Navigating to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni?_=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    // Check page content
    const pageInfo = await page.evaluate(() => {
      // Check for debug panel
      const debugPanel = document.querySelector('.bg-yellow-50');

      // Check for relationships
      const gridCards = document.querySelectorAll('.hover\\:shadow-lg');

      // Check for buttons
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim());

      // Check for modals
      const modals = document.querySelectorAll('.fixed.inset-0');

      return {
        hasDebugPanel: !!debugPanel,
        debugPanelText: debugPanel ? debugPanel.innerText : null,
        relationshipsCount: gridCards.length,
        buttons: buttons.filter(b => b.length > 0 && b.length < 50),
        modalsCount: modals.length,
        pageTitle: document.title,
        url: window.location.href
      };
    });

    console.log('═══════════════════════════════════════');
    console.log('          PAGE INSPECTION              ');
    console.log('═══════════════════════════════════════');
    console.log(`URL: ${pageInfo.url}`);
    console.log(`Title: ${pageInfo.pageTitle}`);
    console.log(`Debug Panel: ${pageInfo.hasDebugPanel ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`Relationships: ${pageInfo.relationshipsCount}`);
    console.log(`Open Modals: ${pageInfo.modalsCount}`);
    console.log(`\nButtons found on page:`);
    pageInfo.buttons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn}"`);
    });

    if (pageInfo.debugPanelText) {
      console.log('\n📊 DEBUG PANEL CONTENT:');
      console.log('---');
      console.log(pageInfo.debugPanelText);
      console.log('---');
    }
    console.log('═══════════════════════════════════════\n');

    // Test ADD button
    console.log('4️⃣  Testing "Add Relationship" button...');
    const hasAddButton = pageInfo.buttons.some(b => b.includes('Nuova Relazione'));

    if (hasAddButton) {
      console.log('   ✅ "Nuova Relazione" button found');

      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent.includes('Nuova Relazione'));
        if (addBtn) {
          addBtn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await sleep(2000);

        const modalOpened = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          return !!modal;
        });

        if (modalOpened) {
          console.log('   ✅ Modal opened successfully');

          // Check form fields
          const formFields = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const selects = Array.from(document.querySelectorAll('select'));
            return {
              inputs: inputs.map(i => ({ placeholder: i.placeholder, type: i.type })),
              selects: selects.map(s => s.options[s.selectedIndex]?.text)
            };
          });

          console.log('   📝 Form fields detected:');
          formFields.inputs.forEach((input, i) => {
            console.log(`      - Input ${i + 1}: ${input.placeholder || input.type}`);
          });
          formFields.selects.forEach((select, i) => {
            console.log(`      - Select ${i + 1}: ${select}`);
          });

          // Close modal
          await page.keyboard.press('Escape');
          await sleep(500);
          console.log('   - Modal closed');
        } else {
          console.log('   ❌ Modal did NOT open');
        }
      }
    } else {
      console.log('   ❌ "Nuova Relazione" button NOT found');
    }

    // Test DETAILS button if relationships exist
    if (pageInfo.relationshipsCount > 0) {
      console.log('\n5️⃣  Testing "Details" button...');
      const hasDetailsButton = pageInfo.buttons.some(b => b.includes('Dettagli') || b.includes('👁️'));

      if (hasDetailsButton) {
        console.log('   ✅ Details button found');

        const clicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const detailsBtn = buttons.find(btn => btn.textContent.includes('Dettagli') || btn.textContent.includes('👁️'));
          if (detailsBtn) {
            detailsBtn.click();
            return true;
          }
          return false;
        });

        if (clicked) {
          await sleep(1500);

          const detailsModalOpened = await page.evaluate(() => {
            const modal = document.querySelector('.fixed.inset-0');
            const title = modal?.querySelector('h3');
            return {
              opened: !!modal,
              title: title?.textContent || null
            };
          });

          if (detailsModalOpened.opened) {
            console.log(`   ✅ Details modal opened: "${detailsModalOpened.title}"`);
            await page.keyboard.press('Escape');
            await sleep(500);
          } else {
            console.log('   ❌ Details modal did NOT open');
          }
        }
      } else {
        console.log('   ❌ Details button NOT found');
      }

      // Test EDIT button
      console.log('\n6️⃣  Testing "Edit" button...');
      const hasEditButton = pageInfo.buttons.some(b => b.includes('Modifica') || b.includes('✏️'));

      if (hasEditButton) {
        console.log('   ✅ Edit button found');

        const clicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const editBtn = buttons.find(btn => btn.textContent.includes('Modifica'));
          if (editBtn) {
            editBtn.click();
            return true;
          }
          return false;
        });

        if (clicked) {
          await sleep(1500);

          const editModalOpened = await page.evaluate(() => {
            const modal = document.querySelector('.fixed.inset-0');
            const title = modal?.querySelector('h3');
            return {
              opened: !!modal,
              title: title?.textContent || null
            };
          });

          if (editModalOpened.opened) {
            console.log(`   ✅ Edit modal opened: "${editModalOpened.title}"`);
            await page.keyboard.press('Escape');
            await sleep(500);
          } else {
            console.log('   ❌ Edit modal did NOT open');
          }
        }
      } else {
        console.log('   ❌ Edit button NOT found');
      }
    }

    // Screenshot
    console.log('\n7️⃣  Taking screenshot...');
    await page.screenshot({
      path: 'production-relazioni-test.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved as production-relazioni-test.png\n');

    console.log('═══════════════════════════════════════');
    console.log('            TEST SUMMARY               ');
    console.log('═══════════════════════════════════════');
    console.log(`✓ Page loaded: YES`);
    console.log(`✓ Relationships found: ${pageInfo.relationshipsCount}`);
    console.log(`✓ Add button: ${hasAddButton ? 'YES' : 'NO'}`);
    console.log(`✓ Details button: ${pageInfo.buttons.some(b => b.includes('Dettagli') || b.includes('👁️')) ? 'YES' : 'NO'}`);
    console.log(`✓ Edit button: ${pageInfo.buttons.some(b => b.includes('Modifica')) ? 'YES' : 'NO'}`);
    console.log('═══════════════════════════════════════\n');

    console.log('⏸️  Browser will remain open for 20 seconds for manual inspection...');
    await sleep(20000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testProductionRelazioni().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
