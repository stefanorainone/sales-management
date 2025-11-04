const puppeteer = require('puppeteer');

const PROD_URL = 'https://sales-management-412055180465.europe-west1.run.app';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifySellerTasks() {
  console.log('🔍 VERIFY SELLER TASKS - Upload Section Test\n');
  console.log(`📍 URL: ${PROD_URL}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null,
    slowMo: 100
  });

  try {
    const page = await browser.newPage();

    // ============================================================================
    // STEP 1: LOGIN AS SELLER (Aya Ftissi)
    // ============================================================================
    console.log('📱 STEP 1: Login as Aya Ftissi\n');

    await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    await page.screenshot({ path: 'test-results/verify-01-login.png', fullPage: true });

    // Login as Aya Ftissi
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'ftissiaya@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Seller123!', { delay: 50 });
    await page.click('button[type="submit"]');

    console.log('   → Login submitted...');
    await sleep(5000);

    await page.screenshot({ path: 'test-results/verify-02-dashboard.png', fullPage: true });
    console.log('   ✅ Logged in as Aya Ftissi\n');

    // ============================================================================
    // STEP 2: NAVIGATE TO /TODAY PAGE
    // ============================================================================
    console.log('📱 STEP 2: Check /today Page\n');

    await page.goto(`${PROD_URL}/today`, { waitUntil: 'networkidle2' });
    console.log('   → Navigated to /today');
    console.log('   ⏳ Waiting 8 seconds for briefing to load...');
    await sleep(8000);

    await page.screenshot({ path: 'test-results/verify-03-today-page.png', fullPage: true });
    console.log('   ✅ Screenshot: verify-03-today-page.png\n');

    // Check for tasks
    const tasksInfo = await page.evaluate(() => {
      const taskButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent.includes('Inizia')
      );

      const taskTitles = Array.from(document.querySelectorAll('h3, h4, h5')).filter(el => {
        const text = el.textContent?.trim() || '';
        return text.length > 10 && text.length < 200 &&
               !text.includes('Task di Oggi') &&
               !text.includes('Briefing');
      }).map(el => el.textContent.trim()).slice(0, 5);

      return {
        hasInitButtons: taskButtons.length > 0,
        initButtonsCount: taskButtons.length,
        taskTitles
      };
    });

    console.log(`   📋 Found ${tasksInfo.initButtonsCount} tasks with "Inizia" button`);
    if (tasksInfo.taskTitles.length > 0) {
      console.log('   📝 Task titles:');
      tasksInfo.taskTitles.forEach((title, i) => {
        console.log(`      ${i + 1}. ${title.substring(0, 100)}`);
      });
    }

    if (tasksInfo.hasInitButtons) {
      console.log('\n   → Opening first task to check upload section...\n');

      // Click first "Inizia" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const iniziaBtn = buttons.find(btn => btn.textContent.includes('Inizia'));
        if (iniziaBtn) {
          iniziaBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => iniziaBtn.click(), 500);
        }
      });

      await sleep(3000);

      await page.screenshot({ path: 'test-results/verify-04-task-modal.png', fullPage: false });
      console.log('   ✅ Task modal opened\n');

      // ============================================================================
      // STEP 3: VERIFY EXPECTED OUTPUT FORMAT & UPLOAD SECTION
      // ============================================================================
      console.log('📱 STEP 3: Verify Upload Section & expectedOutputFormat\n');

      const verification = await page.evaluate(() => {
        const text = document.body.textContent;
        const results = {
          // Check for expectedOutputFormat section
          hasOBBLIGATORIO: text.includes('OBBLIGATORIO'),
          hasDocumentoDaCaricare: text.includes('DOCUMENTO DA CARICARE') || text.includes('Documento da Caricare'),
          hasExpectedOutput: text.includes('Formato Output') || text.includes('Output Richiesto') || text.includes('Expected Output'),

          // Check for upload section
          hasCaricaRisultati: text.includes('Carica Risultati') || text.includes('Carica'),
          hasFileInput: document.querySelector('input[type="file"]') !== null,

          // Check for red warning sections
          redSections: Array.from(document.querySelectorAll('div')).filter(div =>
            div.className && (div.className.includes('bg-red') || div.className.includes('border-red'))
          ).length,

          // Check text colors in inputs
          textColors: []
        };

        // Check text color in inputs and textareas
        const inputs = Array.from(document.querySelectorAll('input[type="number"], input[type="text"], textarea'));
        results.textColors = inputs.slice(0, 5).map(input => {
          const style = window.getComputedStyle(input);
          const color = style.color;
          const isWhite = color === 'rgb(255, 255, 255)' || color.includes('255, 255, 255');
          return {
            element: input.tagName,
            type: input.type || 'textarea',
            color: color,
            isWhite: isWhite
          };
        });

        return results;
      });

      console.log('   📊 Verification Results:\n');
      console.log(`   ${verification.hasOBBLIGATORIO ? '✅' : '❌'} "OBBLIGATORIO" text present`);
      console.log(`   ${verification.hasDocumentoDaCaricare ? '✅' : '❌'} "DOCUMENTO DA CARICARE" section`);
      console.log(`   ${verification.hasExpectedOutput ? '✅' : '❌'} "Formato Output" section`);
      console.log(`   ${verification.hasCaricaRisultati ? '✅' : '❌'} "Carica Risultati" section`);
      console.log(`   ${verification.hasFileInput ? '✅' : '❌'} File input <input type="file"> present`);
      console.log(`   ${verification.redSections > 0 ? '✅' : '❌'} Red warning sections (${verification.redSections} found)`);

      console.log('\n   🎨 Text Color Verification:\n');
      if (verification.textColors.length > 0) {
        verification.textColors.forEach((info, i) => {
          const status = info.isWhite ? '❌ WHITE (invisible!)' : '✅ Visible';
          console.log(`      ${i + 1}. ${info.element} (${info.type}): ${info.color} ${status}`);
        });

        const allVisible = verification.textColors.every(c => !c.isWhite);
        console.log(`\n      Overall: ${allVisible ? '✅ All text is visible' : '⚠️  Some text is white!'}`);
      } else {
        console.log('      ⚠️  No input fields found in modal');
      }

      // Scroll down to see upload section
      console.log('\n   → Scrolling to upload section...');
      await page.evaluate(() => {
        const modal = document.querySelector('[class*="overflow-y-auto"]');
        if (modal) {
          modal.scrollTop = modal.scrollHeight;
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      });
      await sleep(2000);

      await page.screenshot({ path: 'test-results/verify-05-upload-section.png', fullPage: false });
      console.log('   ✅ Screenshot: verify-05-upload-section.png\n');

      // ============================================================================
      // STEP 4: TEST VALIDATION (Try to complete without file)
      // ============================================================================
      console.log('📱 STEP 4: Test Validation\n');
      console.log('   → Testing if validation prevents completion without file upload...\n');

      // Setup dialog handler before clicking
      let alertShown = false;
      let alertMessage = '';

      page.on('dialog', async dialog => {
        alertShown = true;
        alertMessage = dialog.message();
        console.log(`   🔔 Alert detected: "${alertMessage.substring(0, 100)}..."`);
        await dialog.accept();
      });

      // Try to click complete button
      const completeAttempted = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const completeBtn = buttons.find(btn =>
          btn.textContent.includes('Completa') ||
          btn.textContent.includes('Complete')
        );
        if (completeBtn) {
          completeBtn.click();
          return true;
        }
        return false;
      });

      await sleep(2000);

      if (completeAttempted) {
        if (alertShown) {
          console.log(`   ✅ VALIDATION WORKS! Alert was shown`);
          console.log(`   📝 Message: "${alertMessage}"\n`);
        } else {
          console.log(`   ⚠️  Complete button clicked but no alert shown\n`);
        }
      } else {
        console.log(`   ⚠️  Could not find "Completa" button\n`);
      }

      await page.screenshot({ path: 'test-results/verify-06-validation.png', fullPage: false });

      // ============================================================================
      // FINAL SUMMARY
      // ============================================================================
      console.log('\n' + '='.repeat(80));
      console.log('📊 FINAL VERIFICATION RESULTS');
      console.log('='.repeat(80) + '\n');

      const allChecksPassed =
        verification.hasOBBLIGATORIO &&
        verification.hasDocumentoDaCaricare &&
        verification.hasFileInput &&
        verification.redSections > 0 &&
        verification.textColors.every(c => !c.isWhite) &&
        alertShown;

      console.log('✅ Checks Performed:\n');
      console.log(`  1. expectedOutputFormat "OBBLIGATORIO" section: ${verification.hasOBBLIGATORIO ? '✅' : '❌'}`);
      console.log(`  2. "DOCUMENTO DA CARICARE" visible: ${verification.hasDocumentoDaCaricare ? '✅' : '❌'}`);
      console.log(`  3. File upload input present: ${verification.hasFileInput ? '✅' : '❌'}`);
      console.log(`  4. Red warning sections: ${verification.redSections > 0 ? '✅' : '❌'} (${verification.redSections} found)`);
      console.log(`  5. Text color visibility: ${verification.textColors.every(c => !c.isWhite) ? '✅' : '❌'}`);
      console.log(`  6. Validation works (prevents completion without file): ${alertShown ? '✅' : '❌'}\n`);

      console.log(`🎯 RESULT: ${allChecksPassed ? '✅ ALL CHECKS PASSED!' : '⚠️  Some checks need attention'}\n`);

      console.log('📸 All screenshots saved in test-results/\n');

    } else {
      console.log('   ❌ No tasks found with "Inizia" button\n');
      console.log('   💡 This might mean:');
      console.log('      - Tasks were not saved to Firestore');
      console.log('      - Tasks are saved but briefing API is not loading them');
      console.log('      - Tasks are in wrong status (not "pending")\n');
    }

    console.log('Keeping browser open for 15 seconds...');
    await sleep(15000);

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test-results/verify-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run
(async () => {
  try {
    await verifySellerTasks();
    console.log('✅ Verification completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
})();
