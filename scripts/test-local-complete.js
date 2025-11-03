const puppeteer = require('puppeteer');

// LOCAL URL
const LOCAL_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLocal() {
  console.log('🚀 Local Environment Test - Automated\n');
  console.log('   Make sure your dev server is running on port 3001!\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
    slowMo: 50 // Slow down so we can see what's happening
  });

  try {
    // ============================================================================
    // DESKTOP TEST
    // ============================================================================
    console.log('📱 TEST 1: DESKTOP - Complete Flow\n');

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Setup console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   🔴 Console Error:', msg.text());
      }
    });

    // Navigate to app
    console.log('   → Navigating to local app...');
    try {
      await page.goto(LOCAL_URL, { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e) {
      console.log('   ❌ Could not connect to local server. Is it running on port 3001?');
      console.log('   → Run: npm run dev');
      await browser.close();
      return;
    }

    await sleep(2000);
    await page.screenshot({ path: 'test-results/local-01-login.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/local-01-login.png\n');

    // Check if login page loaded
    const hasLoginForm = await page.evaluate(() => {
      return document.querySelector('input[type="email"]') !== null;
    });

    if (!hasLoginForm) {
      console.log('   ⚠️  Login form not found. Might already be logged in or redirected.\n');
    }

    // Try admin login
    console.log('   → Attempting admin login...');
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'admin@vr.com', { delay: 50 });
      await page.type('input[type="password"]', 'Admin123!', { delay: 50 });

      await page.click('button[type="submit"]');
      console.log('   → Login submitted, waiting for redirect...');

      await sleep(3000);

      await page.screenshot({ path: 'test-results/local-02-after-login.png', fullPage: true });
      console.log('   ✅ Screenshot: test-results/local-02-after-login.png\n');
    } catch (e) {
      console.log('   ⚠️  Could not complete login:', e.message, '\n');
    }

    // Navigate to /today page
    console.log('   → Navigating to /today page...');
    await page.goto(`${LOCAL_URL}/today`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    await page.screenshot({ path: 'test-results/local-03-today-page.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/local-03-today-page.png\n');

    // Check for tasks
    const tasksVisible = await page.evaluate(() => {
      // Look for task cards or task list
      const taskElements = document.querySelectorAll('[class*="task"]');
      const hasTasks = taskElements.length > 0;

      // Check for "no tasks" message
      const noTasksMsg = document.body.textContent.includes('Hai completato tutti i task') ||
                         document.body.textContent.includes('task da fare');

      return { hasTasks, count: taskElements.length, noTasksMsg };
    });

    console.log(`   → Tasks visible: ${tasksVisible.hasTasks}`);
    console.log(`   → Task elements found: ${tasksVisible.count}\n`);

    if (tasksVisible.count > 0) {
      // Try to find and click "Vedi Guida" button
      console.log('   → Looking for task guidance button...');

      const guidaClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const guidaBtn = buttons.find(btn => btn.textContent.includes('Vedi Guida') || btn.textContent.includes('Guida'));
        if (guidaBtn) {
          guidaBtn.click();
          return true;
        }
        return false;
      });

      if (guidaClicked) {
        console.log('   ✅ Clicked "Vedi Guida" button');
        await sleep(1500);
        await page.screenshot({ path: 'test-results/local-04-task-guidance.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/local-04-task-guidance.png\n');

        // Close modal
        await page.evaluate(() => {
          const closeBtn = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.includes('Chiudi') || btn.textContent.includes('×')
          );
          if (closeBtn) closeBtn.click();
        });
        await sleep(500);
      }

      // Try to click "Inizia Task"
      console.log('   → Looking for "Inizia Task" button...');

      const iniziaClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const iniziaBtn = buttons.find(btn => btn.textContent.includes('Inizia'));
        if (iniziaBtn) {
          iniziaBtn.scrollIntoView();
          iniziaBtn.click();
          return true;
        }
        return false;
      });

      if (iniziaClicked) {
        console.log('   ✅ Clicked "Inizia Task" button');
        await sleep(2000);

        await page.screenshot({ path: 'test-results/local-05-task-execution-modal.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/local-05-task-execution-modal.png\n');

        // Check for expectedOutputFormat section
        const hasOutputFormat = await page.evaluate(() => {
          const text = document.body.textContent;
          return {
            hasObbligatorio: text.includes('OBBLIGATORIO'),
            hasCarica: text.includes('Carica Risultati') || text.includes('Carica'),
            hasRedSection: Array.from(document.querySelectorAll('div')).some(div =>
              div.className.includes('red') && div.className.includes('border')
            )
          };
        });

        console.log('   📋 Expected Output Format Check:');
        console.log(`      - OBBLIGATORIO text: ${hasOutputFormat.hasObbligatorio ? '✅' : '❌'}`);
        console.log(`      - Upload section: ${hasOutputFormat.hasCarica ? '✅' : '❌'}`);
        console.log(`      - Red border section: ${hasOutputFormat.hasRedSection ? '✅' : '❌'}\n`);

        // Scroll down to see upload section
        console.log('   → Scrolling to file upload section...');
        await page.evaluate(() => {
          const modal = document.querySelector('[class*="overflow-y-auto"]');
          if (modal) {
            modal.scrollTop = modal.scrollHeight;
          }
        });
        await sleep(1000);

        await page.screenshot({ path: 'test-results/local-06-upload-section.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/local-06-upload-section.png\n');

        // Test validation: try to complete without file
        console.log('   → Testing validation (complete without file)...');

        // Fill in duration and notes
        await page.evaluate(() => {
          const durationInput = document.querySelector('input[type="number"]');
          if (durationInput) durationInput.value = '15';

          const textarea = document.querySelector('textarea');
          if (textarea) textarea.value = 'Test notes for validation';
        });

        // Listen for alert
        page.once('dialog', async dialog => {
          console.log(`   ✅ VALIDATION PASSED: Alert shown!`);
          console.log(`      Message: "${dialog.message().substring(0, 100)}..."\n`);
          await dialog.accept();
        });

        // Try to click complete button
        const completeClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const completeBtn = buttons.find(btn => btn.textContent.includes('Completa'));
          if (completeBtn) {
            completeBtn.click();
            return true;
          }
          return false;
        });

        if (completeClicked) {
          await sleep(1500);
        }

        await page.screenshot({ path: 'test-results/local-07-after-validation.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/local-07-after-validation.png\n');
      }
    } else {
      console.log('   ⚠️  No tasks found on page. Generate tasks first in admin panel.\n');
    }

    await page.close();

    // ============================================================================
    // MOBILE TEST
    // ============================================================================
    console.log('📱 TEST 2: MOBILE - Responsive Test\n');

    const mobilePage = await browser.newPage();
    await mobilePage.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
    await mobilePage.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro

    console.log('   → Loading /today page on mobile...');
    await mobilePage.goto(`${LOCAL_URL}/today`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    await mobilePage.screenshot({ path: 'test-results/local-08-mobile-today.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/local-08-mobile-today.png\n');

    // Check mobile layout
    const mobileLayout = await mobilePage.evaluate(() => {
      const width = window.innerWidth;
      const hasMobileNav = document.querySelector('[class*="mobile"]') !== null;
      const hasResponsiveText = document.querySelector('[class*="sm:"]') !== null;

      return { width, hasMobileNav, hasResponsiveText };
    });

    console.log(`   → Mobile viewport width: ${mobileLayout.width}px`);
    console.log(`   → Responsive classes detected: ${mobileLayout.hasResponsiveText ? '✅' : '⚠️'}\n`);

    // Try to open task on mobile
    const mobileTaskClicked = await mobilePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const iniziaBtn = buttons.find(btn => btn.textContent.includes('Inizia'));
      if (iniziaBtn) {
        iniziaBtn.click();
        return true;
      }
      return false;
    });

    if (mobileTaskClicked) {
      console.log('   → Opened task on mobile');
      await sleep(2000);

      await mobilePage.screenshot({ path: 'test-results/local-09-mobile-task-modal.png', fullPage: true });
      console.log('   ✅ Screenshot: test-results/local-09-mobile-task-modal.png\n');

      // Scroll to upload section
      await mobilePage.evaluate(() => {
        const modal = document.querySelector('[class*="overflow-y-auto"]');
        if (modal) modal.scrollTop = modal.scrollHeight;
      });
      await sleep(1000);

      await mobilePage.screenshot({ path: 'test-results/local-10-mobile-upload.png', fullPage: true });
      console.log('   ✅ Screenshot: test-results/local-10-mobile-upload.png\n');
    }

    await mobilePage.close();

    // ============================================================================
    // API VERIFICATION
    // ============================================================================
    console.log('📱 TEST 3: API - Verify expectedOutputFormat\n');

    const apiPage = await browser.newPage();
    await apiPage.setRequestInterception(true);

    let briefingData = null;

    apiPage.on('response', async response => {
      if (response.url().includes('/api/ai/briefing')) {
        try {
          const data = await response.json();
          briefingData = data;
        } catch (e) {
          // Ignore
        }
      }
    });

    apiPage.on('request', request => {
      request.continue();
    });

    console.log('   → Loading /today to capture API response...');
    await apiPage.goto(`${LOCAL_URL}/today`, { waitUntil: 'networkidle2' });
    await sleep(5000);

    if (briefingData && briefingData.tasks) {
      console.log(`   ✅ Captured briefing with ${briefingData.tasks.length} tasks\n`);

      const analysis = {
        total: briefingData.tasks.length,
        withExpectedOutput: 0,
        withDocumentRequired: 0,
        withGuidelines: 0,
        withBestPractices: 0,
        withCommonMistakes: 0
      };

      briefingData.tasks.forEach(task => {
        if (task.expectedOutputFormat) analysis.withExpectedOutput++;
        if (task.expectedOutputFormat?.documentRequired === true) analysis.withDocumentRequired++;
        if (task.guidelines?.length > 0) analysis.withGuidelines++;
        if (task.bestPractices?.length > 0) analysis.withBestPractices++;
        if (task.commonMistakes?.length > 0) analysis.withCommonMistakes++;
      });

      console.log('   📊 API Analysis:');
      console.log(`      Total tasks: ${analysis.total}`);
      console.log(`      ✅ With expectedOutputFormat: ${analysis.withExpectedOutput}/${analysis.total}`);
      console.log(`      ✅ With documentRequired=true: ${analysis.withDocumentRequired}/${analysis.total}`);
      console.log(`      ✅ With guidelines: ${analysis.withGuidelines}/${analysis.total}`);
      console.log(`      ✅ With bestPractices: ${analysis.withBestPractices}/${analysis.total}`);
      console.log(`      ✅ With commonMistakes: ${analysis.withCommonMistakes}/${analysis.total}\n`);

      if (analysis.total > 0) {
        const firstTask = briefingData.tasks[0];
        console.log('   📋 First Task Sample:');
        console.log(`      Title: ${firstTask.title}`);
        console.log(`      Type: ${firstTask.type}`);
        if (firstTask.expectedOutputFormat) {
          console.log('      Expected Output:');
          console.log(`        - type: ${firstTask.expectedOutputFormat.type}`);
          console.log(`        - description: ${firstTask.expectedOutputFormat.description?.substring(0, 80)}...`);
          console.log(`        - documentRequired: ${firstTask.expectedOutputFormat.documentRequired}`);
        }
        console.log('');
      }

      if (analysis.withExpectedOutput === analysis.total && analysis.withDocumentRequired === analysis.total) {
        console.log('   🎉 SUCCESS: ALL TASKS HAVE EXPECTED OUTPUT FORMAT WITH DOCUMENT REQUIRED!\n');
      } else {
        console.log('   ⚠️  WARNING: Some tasks missing expectedOutputFormat or documentRequired\n');
      }
    } else {
      console.log('   ⚠️  Could not capture API response\n');
    }

    await apiPage.close();

    // ============================================================================
    // FINAL REPORT
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 LOCAL TEST COMPLETED');
    console.log('='.repeat(80) + '\n');

    console.log('✅ All tests completed!');
    console.log('📸 Screenshots saved in test-results/\n');

    console.log('Verification checklist:');
    console.log('  □ Desktop layout works correctly');
    console.log('  □ Mobile layout is responsive');
    console.log('  □ Task guidance modal shows properly');
    console.log('  □ Task execution modal has red "OBBLIGATORIO" section');
    console.log('  □ File upload section is visible (red background)');
    console.log('  □ Validation prevents completion without file');
    console.log('  □ API returns expectedOutputFormat for all tasks');
    console.log('  □ documentRequired=true for all tasks\n');

    console.log('Next step: Deploy to production and run test-production-manual.js\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('Closing browser in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

// Run test
(async () => {
  try {
    await testLocal();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
