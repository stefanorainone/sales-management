const puppeteer = require('puppeteer');

const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';

async function testTasksFlow() {
  console.log('\n🚀 Starting Tasks Flow Test...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    slowMo: 50,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // ========== STEP 1: Login as Admin ==========
    console.log('📝 Step 1: Logging in as Admin...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@vr.com');
    await page.type('input[type="password"]', 'admin123');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ Admin logged in');
    await page.screenshot({ path: 'test-tasks-1-admin-logged-in.png', fullPage: true });

    // Wait to ensure we're logged in
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========== STEP 2: Navigate to AI Tasks Manager ==========
    console.log('\n📝 Step 2: Navigating to AI Task Manager...');
    await page.goto(`${BASE_URL}/admin/ai-tasks`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ On AI Task Manager page');
    await page.screenshot({ path: 'test-tasks-2-ai-task-manager.png', fullPage: true });

    // ========== STEP 3: Select Stefano Rainone ==========
    console.log('\n📝 Step 3: Selecting Stefano Rainone...');

    // Look for Stefano in the sellers list
    const stefanoButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Stefano Rainone'));
    });

    if (stefanoButton) {
      await stefanoButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Stefano Rainone selected');
      await page.screenshot({ path: 'test-tasks-3-stefano-selected.png', fullPage: true });
    } else {
      console.log('❌ Could not find Stefano Rainone button');
    }

    // ========== STEP 4: Check for existing tasks ==========
    console.log('\n📝 Step 4: Checking existing tasks for Stefano...');

    const activeTasks = await page.evaluate(() => {
      const activeSection = Array.from(document.querySelectorAll('h3'))
        .find(h3 => h3.textContent.includes('Task Attivi'));

      if (!activeSection) return null;

      const card = activeSection.closest('div');
      const taskDivs = card.querySelectorAll('div.p-3');

      return {
        count: taskDivs.length,
        tasks: Array.from(taskDivs).map(div => {
          const title = div.querySelector('h4')?.textContent || 'No title';
          const description = div.querySelector('p')?.textContent || 'No description';
          return { title, description };
        })
      };
    });

    console.log(`📊 Active tasks found: ${activeTasks?.count || 0}`);
    if (activeTasks?.tasks) {
      activeTasks.tasks.forEach((task, i) => {
        console.log(`  ${i + 1}. ${task.title}`);
      });
    }

    // ========== STEP 5: Logout Admin ==========
    console.log('\n📝 Step 5: Logging out admin...');

    // Look for logout button (the door emoji)
    const logoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('🚪'));
    });

    if (logoutButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        logoutButton.click()
      ]);
      console.log('✅ Admin logged out');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========== STEP 6: Login as Stefano ==========
    console.log('\n📝 Step 6: Logging in as Stefano Rainone...');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.type('input[type="email"]', 'stefanorainone@gmail.com');
    await page.type('input[type="password"]', 'password123');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ Stefano logged in');
    await page.screenshot({ path: 'test-tasks-6-stefano-logged-in.png', fullPage: true });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========== STEP 7: Navigate to "I Miei Task" ==========
    console.log('\n📝 Step 7: Navigating to "I Miei Task" page...');

    await page.goto(`${BASE_URL}/today`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ On "I Miei Task" page');
    await page.screenshot({ path: 'test-tasks-7-stefano-today-page.png', fullPage: true });

    // ========== STEP 8: Check for tasks on Stefano's page ==========
    console.log('\n📝 Step 8: Checking tasks visible to Stefano...');

    const stefanoTasks = await page.evaluate(() => {
      // Look for any task cards
      const taskCards = document.querySelectorAll('[class*="TaskCard"], [data-testid*="task"]');

      // Also look for text content that might indicate tasks
      const bodyText = document.body.innerText;

      return {
        taskCardsFound: taskCards.length,
        pageContent: bodyText.substring(0, 500),
        hasTasksText: bodyText.includes('Task') || bodyText.includes('task')
      };
    });

    console.log(`📊 Task cards found: ${stefanoTasks.taskCardsFound}`);
    console.log(`📄 Page has tasks text: ${stefanoTasks.hasTasksText}`);
    console.log(`📝 Page content preview:\n${stefanoTasks.pageContent}`);

    // ========== STEP 9: Check API response ==========
    console.log('\n📝 Step 9: Checking API response for briefing...');

    // Intercept network requests
    await page.setRequestInterception(true);

    let apiResponse = null;
    page.on('request', request => {
      request.continue();
    });

    page.on('response', async response => {
      if (response.url().includes('/api/ai/briefing')) {
        try {
          const data = await response.json();
          apiResponse = data;
          console.log('📡 API Response:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('❌ Could not parse API response');
        }
      }
    });

    // Reload page to trigger API call
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Admin saw ${activeTasks?.count || 0} active tasks for Stefano`);
    console.log(`Stefano saw ${stefanoTasks.taskCardsFound} task cards on his page`);
    console.log(`API Response received: ${apiResponse ? 'Yes' : 'No'}`);
    if (apiResponse) {
      console.log(`Tasks in API response: ${apiResponse.tasks?.length || 0}`);
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testTasksFlow();
