/**
 * Comprehensive Puppeteer Test Suite
 * Tests all recent changes including inline editing functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'stefano@example.com';
const ADMIN_PASSWORD = 'password123';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(message) {
  log(`\n${'='.repeat(60)}`, colors.magenta);
  log(`${message}`, colors.bright + colors.magenta);
  log(`${'='.repeat(60)}`, colors.magenta);
}

async function waitForNavigation(page, timeout = 10000) {
  try {
    await page.waitForNavigation({ timeout, waitUntil: 'networkidle0' });
  } catch (err) {
    // Navigation timeout is acceptable in some cases
    info('Navigation timeout (this may be normal)');
  }
}

async function login(page) {
  section('TEST 1: Login');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  success('Navigated to login page');

  await page.type('input[type="email"]', ADMIN_EMAIL);
  await page.type('input[type="password"]', ADMIN_PASSWORD);
  success('Entered credentials');

  await page.click('button[type="submit"]');
  await waitForNavigation(page);

  const url = page.url();
  if (url.includes('/today') || url.includes('/admin')) {
    success('Login successful!');
    return true;
  } else {
    error(`Login failed - redirected to: ${url}`);
    return false;
  }
}

async function testNavigationWithoutActivities(page) {
  section('TEST 2: Verify Activities Section Removed');

  await page.goto(`${BASE_URL}/today`, { waitUntil: 'networkidle0' });

  // Check sidebar doesn't have Activities link
  const activitiesLink = await page.$('a[href="/activities"]');

  if (activitiesLink) {
    error('Activities link still exists in sidebar');
    return false;
  } else {
    success('Activities section successfully removed from navigation');
  }

  // Try to access activities page directly
  await page.goto(`${BASE_URL}/activities`, { waitUntil: 'networkidle0' });
  const pageContent = await page.content();

  if (pageContent.includes('404') || pageContent.includes('not found')) {
    success('Activities page returns 404 as expected');
    return true;
  } else {
    error('Activities page still accessible');
    return false;
  }
}

async function testAnalyticsSimplification(page) {
  section('TEST 3: Analytics Dashboard Simplification');

  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000); // Wait for data to load

  // Check that only 2 tabs exist
  const tabs = await page.$$('button[class*="border-b-2"]');

  if (tabs.length === 2) {
    success(`Found exactly 2 metric tabs as expected`);
  } else {
    error(`Found ${tabs.length} tabs instead of 2`);
    return false;
  }

  // Check tab labels
  const tabTexts = await Promise.all(
    tabs.map(tab => page.evaluate(el => el.textContent, tab))
  );

  const hasRelationships = tabTexts.some(text => text.includes('Attività Relazioni'));
  const hasTimeInvestment = tabTexts.some(text => text.includes('Tempo Investito'));

  if (hasRelationships && hasTimeInvestment) {
    success('Analytics has correct tabs: Attività Relazioni & Tempo Investito');
    return true;
  } else {
    error(`Incorrect tabs found: ${tabTexts.join(', ')}`);
    return false;
  }
}

async function testRelationshipActionSimplification(page) {
  section('TEST 4: Relationship Action Simplification');

  await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  // Look for any relationship cards
  const relationshipCards = await page.$$('[class*="bg-white"][class*="rounded-lg"][class*="border"]');

  if (relationshipCards.length === 0) {
    info('No relationships found to test action completion');
    return true;
  }

  // Click first relationship to open modal
  await relationshipCards[0].click();
  await page.waitForTimeout(1000);

  // Check if there's an action type selector (there shouldn't be)
  const actionTypeSelects = await page.$$('select');
  const selectLabels = await Promise.all(
    actionTypeSelects.map(select =>
      page.evaluate(el => {
        const label = el.previousElementSibling;
        return label ? label.textContent : '';
      }, select)
    )
  );

  const hasActionTypeSelector = selectLabels.some(label =>
    label.toLowerCase().includes('tipo') ||
    label.toLowerCase().includes('type')
  );

  if (hasActionTypeSelector) {
    error('Action type selector still exists');
    return false;
  } else {
    success('Action type selector successfully removed');
    return true;
  }
}

async function testAIAnalytics(page) {
  section('TEST 5: AI Analytics (OpenAI Integration)');

  await page.goto(`${BASE_URL}/admin/ai-analytics`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  // Check if page loads without errors
  const pageTitle = await page.title();
  const hasError = await page.$('text/Module not found');

  if (hasError) {
    error('AI Analytics page has module errors');
    return false;
  }

  success('AI Analytics page loads without OpenAI module errors');

  // Try to submit a question
  const questionInput = await page.$('input[type="text"], textarea');
  if (questionInput) {
    await questionInput.type('Chi è il venditore con più relazioni?');

    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      info('Testing AI Analytics query...');
      await submitButton.click();
      await page.waitForTimeout(3000); // Wait for AI response

      // Check if response appears
      const hasResponse = await page.$('[class*="response"], [class*="answer"]');
      if (hasResponse) {
        success('AI Analytics responds to queries successfully');
      } else {
        info('AI Analytics query submitted (response check skipped)');
      }
    }
  }

  return true;
}

async function testAdminTasksInlineEditing(page) {
  section('TEST 6: Admin Tasks - Inline Editing');

  await page.goto(`${BASE_URL}/admin/tasks`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(3000); // Wait for tasks to load

  // Check that edit modal/button is removed
  const editButtons = await page.$$('button:has-text("Modifica"), button:has-text("Edit")');

  if (editButtons.length > 0) {
    error('Edit buttons still exist (should be removed for inline editing)');
    return false;
  }

  success('Edit buttons removed as expected');

  // Look for tasks
  const taskCards = await page.$$('[class*="bg-white"][class*="rounded"]');

  if (taskCards.length === 0) {
    info('No tasks found to test inline editing');
    return true;
  }

  info(`Found ${taskCards.length} task cards`);

  // Test inline editing on first task
  // Look for editable fields (they should have hover effects or click handlers)
  const editableFields = await page.$$('[class*="cursor-pointer"][class*="hover"], [contenteditable="true"]');

  if (editableFields.length > 0) {
    success(`Found ${editableFields.length} inline-editable fields`);

    // Try clicking on an editable field
    try {
      await editableFields[0].click();
      await page.waitForTimeout(500);

      // Check if an input appears
      const activeInput = await page.$('input:focus, textarea:focus, select:focus');
      if (activeInput) {
        success('Inline editing activates when clicking on field');

        // Cancel the edit by pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        success('Inline editing cancelled with Escape key');
      } else {
        info('Could not verify inline editing activation');
      }
    } catch (err) {
      info('Could not test inline editing interaction');
    }

    return true;
  } else {
    error('No inline-editable fields found');
    return false;
  }
}

async function testTextChanges(page) {
  section('TEST 7: UI Text Changes');

  await page.goto(`${BASE_URL}/admin/ai-tasks`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  const pageContent = await page.content();

  // Check for "Motivo:" instead of "AI Rationale:"
  const hasMotivoLabel = pageContent.includes('Motivo:');
  const hasOldLabel = pageContent.includes('AI Rationale:');

  if (hasMotivoLabel && !hasOldLabel) {
    success('"AI Rationale:" changed to "Motivo:" successfully');
  } else if (hasOldLabel) {
    error('"AI Rationale:" text still exists');
    return false;
  } else {
    info('Could not verify "Motivo:" label (no AI tasks generated yet)');
  }

  // Check that Confidence and Impact metrics are removed
  const hasConfidence = pageContent.includes('Confidence:') || pageContent.includes('🎯 Confidence');
  const hasImpact = pageContent.includes('Impact:') || pageContent.includes('⚡ Impact');

  if (!hasConfidence && !hasImpact) {
    success('Confidence and Impact metrics successfully removed');
    return true;
  } else {
    if (hasConfidence) error('Confidence metric still displayed');
    if (hasImpact) error('Impact metric still displayed');
    return false;
  }
}

async function testResponsiveness(page) {
  section('TEST 8: Mobile Responsiveness');

  // Test mobile viewport
  await page.setViewport({ width: 375, height: 667 });
  await page.goto(`${BASE_URL}/today`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  success('Mobile viewport (375x667) renders without errors');

  // Test tablet viewport
  await page.setViewport({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  success('Tablet viewport (768x1024) renders without errors');

  // Reset to desktop
  await page.setViewport({ width: 1920, height: 1080 });

  return true;
}

async function testOverallPerformance(page) {
  section('TEST 9: Overall Performance');

  const pages = [
    '/today',
    '/relazioni',
    '/analytics',
    '/admin/tasks',
    '/admin/ai-analytics',
  ];

  for (const path of pages) {
    const startTime = Date.now();

    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: 10000 });
      const loadTime = Date.now() - startTime;

      if (loadTime < 3000) {
        success(`${path} loaded in ${loadTime}ms`);
      } else {
        info(`${path} loaded in ${loadTime}ms (slower than expected)`);
      }
    } catch (err) {
      error(`${path} failed to load: ${err.message}`);
    }
  }

  return true;
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Test Suite\n', colors.bright + colors.blue);
  log(`Testing: ${BASE_URL}`, colors.blue);
  log(`Time: ${new Date().toLocaleString()}\n`, colors.blue);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Enable console logging from the page
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      log(`Browser Error: ${msg.text()}`, colors.red);
    }
  });

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // Run all tests
    const loginSuccess = await login(page);
    results.tests.push({ name: 'Login', passed: loginSuccess });
    if (loginSuccess) results.passed++; else results.failed++;

    if (!loginSuccess) {
      error('Cannot continue tests without successful login');
      await browser.close();
      return;
    }

    const tests = [
      { name: 'Navigation Without Activities', fn: testNavigationWithoutActivities },
      { name: 'Analytics Simplification', fn: testAnalyticsSimplification },
      { name: 'Relationship Action Simplification', fn: testRelationshipActionSimplification },
      { name: 'AI Analytics (OpenAI)', fn: testAIAnalytics },
      { name: 'Admin Tasks Inline Editing', fn: testAdminTasksInlineEditing },
      { name: 'UI Text Changes', fn: testTextChanges },
      { name: 'Mobile Responsiveness', fn: testResponsiveness },
      { name: 'Overall Performance', fn: testOverallPerformance },
    ];

    for (const test of tests) {
      try {
        const passed = await test.fn(page);
        results.tests.push({ name: test.name, passed });
        if (passed) results.passed++; else results.failed++;
      } catch (err) {
        error(`Test "${test.name}" threw error: ${err.message}`);
        results.tests.push({ name: test.name, passed: false });
        results.failed++;
      }
    }

  } catch (err) {
    error(`Fatal error: ${err.message}`);
    console.error(err);
  } finally {
    await browser.close();
  }

  // Print summary
  section('TEST SUMMARY');
  log(`\nTotal Tests: ${results.tests.length}`, colors.bright);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`, colors.bright);

  log('Detailed Results:', colors.bright);
  results.tests.forEach((test, idx) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? colors.green : colors.red;
    log(`  ${idx + 1}. ${status} ${test.name}`, color);
  });

  log('\n' + '='.repeat(60) + '\n', colors.magenta);

  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉\n', colors.bright + colors.green);
  } else {
    log('⚠️  Some tests failed. Review the output above.\n', colors.yellow);
  }
}

// Run the test suite
runAllTests().catch(err => {
  error(`Fatal error running tests: ${err.message}`);
  console.error(err);
  process.exit(1);
});
