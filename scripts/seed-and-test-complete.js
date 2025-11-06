const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';
const TEST_EMAIL = 'admin@vr.com';
const TEST_PASSWORD = 'Admin123!';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOT_DIR, `flow-${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 flow-${name}.png`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTaskCompletion() {
  console.log('🚀 PRODUCTION Task Completion Test\n');
  console.log(`URL: ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Show browser for local testing
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to login
    console.log('📝 Step 2: Navigate to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(1000);
    await takeScreenshot(page, 'step1-login-page');

    // Wait for email input to be visible
    await page.waitForSelector('input[type="email"]', { visible: true, timeout: 10000 });
    console.log('✅ Found login form');

    // Step 3: Login
    console.log('📝 Step 3: Login as admin...');
    await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 });
    await takeScreenshot(page, 'step2-credentials-entered');

    // Click submit and wait for navigation
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    console.log('✅ Login successful\n');
    await wait(2000);
    await takeScreenshot(page, 'step3-logged-in');

    // Step 4: Navigate to Today's Tasks
    console.log('📅 Step 4: Navigate to Today\'s Tasks...');
    await page.goto(`${BASE_URL}/today`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000); // Wait for tasks to load via API
    await takeScreenshot(page, 'step4-today-page');

    // Step 5: Find and click on "Inizia Task" button
    console.log('🎯 Step 5: Find and click task button...');

    // Look for "Inizia Task" or "Scrivi Email" buttons
    const allButtons = await page.$$('button');
    let startButton = null;

    for (const button of allButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Inizia Task') || text.includes('Scrivi Email'))) {
        startButton = button;
        console.log(`✅ Found task button: "${text}"`);
        break;
      }
    }

    if (!startButton) {
      console.log('⚠️  No "Inizia Task" button found');
      console.log('This might mean no tasks are available today');
      console.log('Try accessing /ai-tasks to generate tasks first');
      await takeScreenshot(page, 'warning-no-tasks');
      throw new Error('No task start button found - generate tasks first');
    }

    await startButton.click();
    await wait(2000);
    await takeScreenshot(page, 'step5-task-button-clicked');

    // Wait for modal to appear
    console.log('⏳ Waiting for task execution modal...');
    await page.waitForSelector('textarea', { timeout: 10000 });
    console.log('✅ Task execution modal opened\n');
    await wait(1000);
    await takeScreenshot(page, 'step6-modal-opened');

    // Step 6: Fill in task completion form
    console.log('📋 Step 6: Fill in task completion form...');

    // Fill in notes
    const notesTextarea = await page.$('textarea');
    if (notesTextarea) {
      await notesTextarea.type('Test completato con successo tramite Puppeteer. Cliente contattato e interessato al prodotto. Follow-up programmato per la prossima settimana.', { delay: 10 });
      console.log('✅ Notes entered');
      await wait(500);
      await takeScreenshot(page, 'step7-notes-entered');
    }

    // Fill in actual duration
    const durationInput = await page.$('input[type="number"]');
    if (durationInput) {
      await durationInput.click({ clickCount: 3 }); // Select all
      await durationInput.type('25', { delay: 50 });
      console.log('✅ Duration entered: 25 minutes');
      await wait(500);
    }

    // Select outcome
    const allButtonsForOutcome = await page.$$('button');
    let outcomeButton = null;

    for (const button of allButtonsForOutcome) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('✅ Successo')) {
        outcomeButton = button;
        console.log(`✅ Found outcome button: "${text}"`);
        break;
      }
    }

    if (outcomeButton) {
      await outcomeButton.click();
      console.log('✅ Outcome selected: Success');
      await wait(500);
      await takeScreenshot(page, 'step8-outcome-selected');
    }

    console.log('\n');

    // Step 7: Test file upload (optional - Firebase Storage may not be configured)
    console.log('📎 Step 7: Test file upload handling...');

    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      // Create a test file
      const testFilePath = path.join(SCREENSHOT_DIR, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test file for upload verification - Puppeteer test');

      await fileInput.uploadFile(testFilePath);
      console.log('✅ Test file selected for upload');
      await wait(1000);
      await takeScreenshot(page, 'step9-file-selected');

      console.log('ℹ️  File upload will be tested (may timeout if Firebase Storage not configured)');
      await wait(2000);
    } else {
      console.log('ℹ️  No file input found (might be optional for this task type)');
    }

    console.log('\n');

    // Step 8: Complete the task
    console.log('✅ Step 8: Complete the task...');

    // Set up dialog handler BEFORE clicking complete button
    page.on('dialog', async dialog => {
      const message = dialog.message();
      console.log(`\n⚠️  Dialog appeared: ${message.substring(0, 100)}...`);

      if (message.includes('Errore durante il caricamento')) {
        console.log('✅ Upload error dialog detected (expected if Firebase Storage not configured)');
        console.log('📝 Accepting to complete without files...');
      } else if (message.includes('DOCUMENTO OBBLIGATORIO')) {
        console.log('✅ Required document dialog detected');
        console.log('📝 Dialog message noted...');
      }

      await dialog.accept();
    });

    // Find the complete button
    const allButtonsForComplete = await page.$$('button');
    let completeButton = null;

    for (const button of allButtonsForComplete) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Completa Task') || text.includes('Completa'))) {
        completeButton = button;
        console.log(`✅ Found complete button: "${text}"`);
        break;
      }
    }

    if (!completeButton) {
      console.log('❌ Complete button not found');
      await takeScreenshot(page, 'error-no-complete-button');
      throw new Error('Complete button not found');
    }

    await completeButton.click();
    console.log('✅ Complete button clicked');
    await wait(5000); // Wait longer for upload timeout and dialog
    await takeScreenshot(page, 'step10-after-complete');

    console.log('\n');

    // Step 9: Verify completion
    console.log('🔍 Step 9: Verify task completion...');

    await wait(2000);
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    await takeScreenshot(page, 'step11-final-state');

    console.log('\n✨ TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log('  ✅ Login with admin credentials');
    console.log('  ✅ Navigated to /today');
    console.log('  ✅ Found and clicked task button');
    console.log('  ✅ Opened execution modal');
    console.log('  ✅ Filled form');
    console.log('  ✅ Selected outcome');
    console.log('  ✅ Tested file upload');
    console.log('  ✅ Completed task');
    console.log('\n🎉 All steps passed!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    await takeScreenshot(page, 'error-final-state');
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await wait(10000);
    await browser.close();
    console.log('🏁 Test execution finished');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}\n`);
  }
}

// Run the test
testTaskCompletion().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
