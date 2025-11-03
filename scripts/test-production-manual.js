const puppeteer = require('puppeteer');

// PRODUCTION URL
const PROD_URL = 'https://sales-management-pzxuyg66lq-ew.a.run.app';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProduction() {
  console.log('🚀 Production Test - Manual Interactive\n');
  console.log('📝 This test will open a browser window for you to observe\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // ============================================================================
    // ADMIN LOGIN AND TASK VERIFICATION
    // ============================================================================
    console.log('📱 STEP 1: Admin Login\n');
    console.log('   → Opening admin login page...');
    await page.goto(`${PROD_URL}/admin`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    console.log('   → Please login manually with your admin credentials');
    console.log('   → Press Enter when you are logged in...');

    // Wait for user to login
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n   ✅ Continuing...\n');

    // ============================================================================
    // NAVIGATE TO TASKS PAGE
    // ============================================================================
    console.log('📱 STEP 2: Navigate to Tasks Management\n');
    console.log('   → Going to admin/tasks page...');
    await page.goto(`${PROD_URL}/admin/tasks`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    await page.screenshot({ path: 'test-results/admin-tasks-dashboard.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/admin-tasks-dashboard.png\n');

    // ============================================================================
    // VERIFY EXISTING TASKS
    // ============================================================================
    console.log('📱 STEP 3: Check Existing Tasks\n');

    const existingTasks = await page.evaluate(() => {
      const taskRows = document.querySelectorAll('table tbody tr, [data-task-id]');
      console.log('Found task rows:', taskRows.length);
      return taskRows.length;
    });

    console.log(`   → Found ${existingTasks} existing tasks\n`);

    if (existingTasks > 0) {
      console.log('   → Clicking on first task to see details...');

      // Click on first task row
      await page.evaluate(() => {
        const firstTask = document.querySelector('table tbody tr, [data-task-id]');
        if (firstTask) firstTask.click();
      });

      await sleep(2000);
      await page.screenshot({ path: 'test-results/task-details.png', fullPage: true });
      console.log('   ✅ Screenshot: test-results/task-details.png\n');
    }

    // ============================================================================
    // GENERATE NEW TASKS (OPTIONAL)
    // ============================================================================
    console.log('📱 STEP 4: Task Generation (Optional)\n');
    console.log('   ⚠️  WARNING: This will generate new tasks in production!');
    console.log('   → Do you want to generate new tasks? (y/n)');

    const shouldGenerate = await new Promise(resolve => {
      process.stdin.once('data', data => {
        const answer = data.toString().trim().toLowerCase();
        resolve(answer === 'y' || answer === 'yes');
      });
    });

    if (shouldGenerate) {
      console.log('\n   → Looking for "Genera Task" button...');

      const generateClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const generateBtn = buttons.find(btn =>
          btn.textContent.includes('Genera') || btn.textContent.includes('Generate')
        );
        if (generateBtn) {
          generateBtn.click();
          return true;
        }
        return false;
      });

      if (generateClicked) {
        console.log('   ✅ Clicked "Genera Task" button');
        console.log('   → Waiting for task generation (this may take 10-30 seconds)...\n');

        await sleep(30000); // Wait 30 seconds for AI generation

        await page.screenshot({ path: 'test-results/after-generation.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/after-generation.png\n');

        // Reload page to see new tasks
        await page.reload({ waitUntil: 'networkidle2' });
        await sleep(2000);

        await page.screenshot({ path: 'test-results/new-tasks-list.png', fullPage: true });
        console.log('   ✅ Screenshot: test-results/new-tasks-list.png\n');
      } else {
        console.log('   ⚠️  Could not find "Genera Task" button\n');
      }
    } else {
      console.log('   → Skipping task generation\n');
    }

    // ============================================================================
    // CHECK API RESPONSE FOR expectedOutputFormat
    // ============================================================================
    console.log('📱 STEP 5: Verify expectedOutputFormat in API\n');

    // Setup network interception
    await page.setRequestInterception(true);

    let taskData = null;

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/ai/briefing') || url.includes('/api/admin/tasks')) {
        try {
          const data = await response.json();
          if (data.tasks && data.tasks.length > 0) {
            taskData = data.tasks;
            console.log(`   ✅ Captured API response with ${data.tasks.length} tasks\n`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    page.on('request', request => {
      request.continue();
    });

    // Navigate to a seller's today page to trigger briefing
    console.log('   → Navigating to seller today page to capture API response...');
    console.log('   → Please manually navigate to a seller\'s /today page');
    console.log('   → Press Enter when you have navigated...');

    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    await sleep(5000); // Wait for API call

    if (taskData && taskData.length > 0) {
      console.log('\n   ✅ API VERIFICATION RESULTS:\n');

      let tasksWithExpectedOutput = 0;
      let tasksWithDocumentRequired = 0;

      taskData.forEach((task, index) => {
        if (task.expectedOutputFormat) {
          tasksWithExpectedOutput++;

          if (task.expectedOutputFormat.documentRequired === true) {
            tasksWithDocumentRequired++;
          }

          if (index === 0) {
            console.log('   📋 First Task Details:');
            console.log(`      Title: ${task.title}`);
            console.log(`      Type: ${task.type}`);
            console.log('      Expected Output Format:');
            console.log(`        - type: ${task.expectedOutputFormat.type}`);
            console.log(`        - description: ${task.expectedOutputFormat.description?.substring(0, 100)}...`);
            console.log(`        - documentRequired: ${task.expectedOutputFormat.documentRequired}`);
            if (task.expectedOutputFormat.example) {
              console.log(`        - example: ${task.expectedOutputFormat.example?.substring(0, 80)}...`);
            }
            console.log('');
          }
        }
      });

      console.log(`   📊 Summary:`);
      console.log(`      Total tasks: ${taskData.length}`);
      console.log(`      Tasks with expectedOutputFormat: ${tasksWithExpectedOutput}/${taskData.length}`);
      console.log(`      Tasks with documentRequired=true: ${tasksWithDocumentRequired}/${taskData.length}\n`);

      if (tasksWithExpectedOutput === taskData.length && tasksWithDocumentRequired === taskData.length) {
        console.log('   ✅ SUCCESS: ALL tasks have expectedOutputFormat with documentRequired=true!\n');
      } else {
        console.log('   ⚠️  WARNING: Not all tasks have proper expectedOutputFormat\n');
      }
    } else {
      console.log('   ⚠️  Could not capture task data from API\n');
    }

    // ============================================================================
    // MOBILE RESPONSIVE TEST
    // ============================================================================
    console.log('📱 STEP 6: Mobile Responsive Test\n');
    console.log('   → Testing mobile view (iPhone 12 Pro)...');

    await page.setViewport({ width: 390, height: 844 });
    await sleep(1000);

    await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/mobile-view.png\n');

    // Test tablet view
    console.log('   → Testing tablet view (iPad)...');
    await page.setViewport({ width: 768, height: 1024 });
    await sleep(1000);

    await page.screenshot({ path: 'test-results/tablet-view.png', fullPage: true });
    console.log('   ✅ Screenshot: test-results/tablet-view.png\n');

    // Back to desktop
    await page.setViewport({ width: 1920, height: 1080 });

    // ============================================================================
    // FINAL REPORT
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST COMPLETED');
    console.log('='.repeat(80) + '\n');

    console.log('✅ All screenshots saved in test-results/\n');
    console.log('Review the screenshots to verify:');
    console.log('  1. Tasks are displayed correctly on desktop');
    console.log('  2. Tasks are displayed correctly on mobile');
    console.log('  3. expectedOutputFormat is generated by AI');
    console.log('  4. documentRequired=true is set for all tasks\n');

    console.log('Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Run test
(async () => {
  try {
    await testProduction();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
