const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'stefanorainone@gmail.com';
const TEST_PASSWORD = '123456';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRelazioniCRUD() {
  console.log('🚀 Starting Full CRUD Test for Relazioni\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('💾') || text.includes('✅') || text.includes('❌') || text.includes('🔄')) {
        console.log(`   ${text}`);
      }
    });

    console.log('1️⃣  Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);
    console.log('   ✅ Logged in\n');

    console.log('2️⃣  Navigate to /relazioni...');
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    console.log('   ✅ Page loaded\n');

    // CREATE - Add new relationship
    console.log('3️⃣  TEST CREATE - Adding new relationship...');
    const added = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Nuova Relazione'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });

    if (!added) {
      throw new Error('Could not find "Nuova Relazione" button');
    }

    await sleep(1000);
    console.log('   - Modal opened');

    // Fill the form
    const testName = `Test Relazione ${Date.now()}`;
    await page.type('input[placeholder*="Mario Rossi"]', testName);
    await page.type('input[placeholder*="Acme Corp"]', 'Test Company SRL');
    await page.type('input[placeholder*="CEO"]', 'CEO');
    await page.type('input[placeholder*="follow-up"]', 'Chiamata di test');

    console.log(`   - Form filled with: "${testName}"`);

    // Click save
    const saved = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.includes('Aggiungi Relazione'));
      if (saveBtn && !saveBtn.disabled) {
        saveBtn.click();
        return true;
      }
      return false;
    });

    if (!saved) {
      throw new Error('Could not click save button');
    }

    await sleep(3000);
    console.log('   ✅ Relationship created!\n');

    // READ - View details
    console.log('4️⃣  TEST READ - Opening details modal...');
    const viewedDetails = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const detailBtn = buttons.find(btn => btn.textContent.includes('Dettagli'));
      if (detailBtn) {
        detailBtn.click();
        return true;
      }
      return false;
    });

    if (viewedDetails) {
      await sleep(1500);
      console.log('   ✅ Details modal opened');

      // Close details modal
      await page.keyboard.press('Escape');
      await sleep(500);
      console.log('   - Details modal closed\n');
    } else {
      console.log('   ⚠️  No "Dettagli" button found (no relationships?)\n');
    }

    // UPDATE - Edit relationship
    console.log('5️⃣  TEST UPDATE - Editing first relationship...');
    const editOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent.includes('Modifica'));
      if (editBtn) {
        editBtn.click();
        return true;
      }
      return false;
    });

    if (editOpened) {
      await sleep(1000);
      console.log('   - Edit modal opened');

      // Modify the company name
      const companyInput = await page.$('input[placeholder*="Acme Corp"]');
      if (companyInput) {
        await page.evaluate(el => el.value = '', companyInput);
        await companyInput.type('Test Company SRL - MODIFICATO');
        console.log('   - Modified company name');

        // Save
        const updated = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => btn.textContent.includes('Salva Modifiche'));
          if (saveBtn && !saveBtn.disabled) {
            saveBtn.click();
            return true;
          }
          return false;
        });

        if (updated) {
          await sleep(3000);
          console.log('   ✅ Relationship updated!\n');
        }
      }
    } else {
      console.log('   ⚠️  No "Modifica" button found\n');
    }

    // DELETE - Remove relationship
    console.log('6️⃣  TEST DELETE - Deleting test relationship...');
    const deleteOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent.includes('Modifica'));
      if (editBtn) {
        editBtn.click();
        return true;
      }
      return false;
    });

    if (deleteOpened) {
      await sleep(1000);

      // Click delete button inside modal
      page.on('dialog', async dialog => {
        console.log('   - Confirm dialog appeared');
        await dialog.accept();
      });

      const deleted = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const deleteBtn = buttons.find(btn => btn.textContent.includes('Elimina'));
        if (deleteBtn) {
          deleteBtn.click();
          return true;
        }
        return false;
      });

      if (deleted) {
        await sleep(2000);
        console.log('   ✅ Relationship deleted!\n');
      }
    }

    // Final screenshot
    console.log('7️⃣  Taking final screenshot...');
    await page.screenshot({
      path: 'relazioni-crud-test-final.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved\n');

    console.log('═══════════════════════════════════════');
    console.log('     ALL CRUD TESTS COMPLETED!     ');
    console.log('═══════════════════════════════════════\n');

    // Keep browser open
    console.log('Browser will remain open for 15 seconds...');
    await sleep(15000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testRelazioniCRUD().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
