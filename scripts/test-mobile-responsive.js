const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Pages to test (all pages from the app)
const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Today', path: '/today', requiresAuth: true },
  { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
  { name: 'Analytics', path: '/analytics', requiresAuth: true },
  { name: 'Pipeline', path: '/pipeline', requiresAuth: true },
  { name: 'Clients', path: '/clients', requiresAuth: true },
  { name: 'Activities', path: '/activities', requiresAuth: true },
  { name: 'Coach', path: '/coach', requiresAuth: true },
  { name: 'Training', path: '/training', requiresAuth: true },
  { name: 'AI Tasks', path: '/ai-tasks', requiresAuth: true },
  { name: 'Admin Dashboard', path: '/admin/dashboard', requiresAuth: true, adminOnly: true },
  { name: 'Admin Users', path: '/admin/users', requiresAuth: true, adminOnly: true },
  { name: 'Admin Tasks', path: '/admin/tasks', requiresAuth: true, adminOnly: true },
  { name: 'Admin AI Config', path: '/admin/ai-config', requiresAuth: true, adminOnly: true },
  { name: 'Admin', path: '/admin', requiresAuth: true, adminOnly: true },
];

// Mobile viewports to test
const VIEWPORTS = [
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, deviceScaleFactor: 3 },
  { name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2 },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots/mobile-test');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper to clean filename
function cleanFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Check for horizontal overflow
async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const documentWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    const viewportWidth = window.innerWidth;

    return {
      hasOverflow: documentWidth > viewportWidth,
      documentWidth,
      viewportWidth,
      overflowAmount: Math.max(0, documentWidth - viewportWidth)
    };
  });
}

// Test a single page with a specific viewport
async function testPage(browser, page, viewport, pageInfo) {
  const results = {
    page: pageInfo.name,
    viewport: viewport.name,
    url: `${BASE_URL}${pageInfo.path}`,
    success: false,
    hasOverflow: false,
    overflowInfo: null,
    screenshot: null,
    error: null
  };

  try {
    console.log(`  Testing ${pageInfo.name} on ${viewport.name}...`);

    // Set viewport
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor
    });

    // Navigate to page
    await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any animations/hydration
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for horizontal overflow
    const overflowInfo = await checkHorizontalOverflow(page);
    results.hasOverflow = overflowInfo.hasOverflow;
    results.overflowInfo = overflowInfo;

    // Take screenshot
    const screenshotFilename = `${cleanFilename(pageInfo.name)}_${cleanFilename(viewport.name)}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    results.screenshot = screenshotFilename;

    results.success = true;

    if (overflowInfo.hasOverflow) {
      console.log(`    ⚠️  Horizontal overflow detected: ${overflowInfo.overflowAmount}px`);
    } else {
      console.log(`    ✅ No horizontal overflow`);
    }

  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    results.error = error.message;
  }

  return results;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting mobile responsive tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allResults = [];

  try {
    const page = await browser.newPage();

    // Test each page with each viewport
    for (const pageInfo of PAGES) {
      console.log(`\n📱 Testing: ${pageInfo.name} (${pageInfo.path})`);

      for (const viewport of VIEWPORTS) {
        const result = await testPage(browser, page, viewport, pageInfo);
        allResults.push(result);
      }
    }

    // Generate report
    console.log('\n\n📊 Generating report...\n');
    const report = generateReport(allResults);

    const reportPath = path.join(SCREENSHOTS_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const markdownReportPath = path.join(SCREENSHOTS_DIR, 'report.md');
    fs.writeFileSync(markdownReportPath, generateMarkdownReport(report));

    console.log(`\n✅ Tests complete!`);
    console.log(`   JSON Report: ${reportPath}`);
    console.log(`   Markdown Report: ${markdownReportPath}`);
    console.log(`   Screenshots: ${SCREENSHOTS_DIR}\n`);

    printSummary(report);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

// Generate test report
function generateReport(results) {
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  const pagesWithOverflow = results.filter(r => r.hasOverflow);

  const overflowByPage = {};
  pagesWithOverflow.forEach(result => {
    if (!overflowByPage[result.page]) {
      overflowByPage[result.page] = [];
    }
    overflowByPage[result.page].push({
      viewport: result.viewport,
      overflowAmount: result.overflowInfo.overflowAmount
    });
  });

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      successful: successfulTests,
      failed: failedTests,
      pagesWithOverflow: Object.keys(overflowByPage).length,
      overflowTests: pagesWithOverflow.length
    },
    overflowByPage,
    allResults: results
  };
}

// Generate markdown report
function generateMarkdownReport(report) {
  let md = `# Mobile Responsive Test Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Tests:** ${report.summary.totalTests}\n`;
  md += `- **Successful:** ${report.summary.successful}\n`;
  md += `- **Failed:** ${report.summary.failed}\n`;
  md += `- **Pages with Overflow:** ${report.summary.pagesWithOverflow}\n`;
  md += `- **Total Overflow Issues:** ${report.summary.overflowTests}\n\n`;

  if (Object.keys(report.overflowByPage).length > 0) {
    md += `## ⚠️  Pages with Horizontal Overflow\n\n`;
    Object.entries(report.overflowByPage).forEach(([pageName, viewports]) => {
      md += `### ${pageName}\n\n`;
      viewports.forEach(v => {
        md += `- **${v.viewport}**: ${v.overflowAmount}px overflow\n`;
      });
      md += `\n`;
    });
  } else {
    md += `## ✅ No Horizontal Overflow Issues Found!\n\n`;
  }

  md += `## Detailed Results\n\n`;

  const groupedResults = {};
  report.allResults.forEach(result => {
    if (!groupedResults[result.page]) {
      groupedResults[result.page] = [];
    }
    groupedResults[result.page].push(result);
  });

  Object.entries(groupedResults).forEach(([pageName, results]) => {
    md += `### ${pageName}\n\n`;
    md += `| Viewport | Status | Overflow | Screenshot |\n`;
    md += `|----------|--------|----------|------------|\n`;
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      const overflow = r.hasOverflow ? `⚠️ ${r.overflowInfo.overflowAmount}px` : '✅ None';
      const screenshot = r.screenshot || 'N/A';
      md += `| ${r.viewport} | ${status} | ${overflow} | ${screenshot} |\n`;
    });
    md += `\n`;
  });

  return md;
}

// Print summary to console
function printSummary(report) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('                      SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Tests:           ${report.summary.totalTests}`);
  console.log(`Successful:            ${report.summary.successful} ✅`);
  console.log(`Failed:                ${report.summary.failed} ❌`);
  console.log(`Pages with Overflow:   ${report.summary.pagesWithOverflow} ${report.summary.pagesWithOverflow > 0 ? '⚠️' : '✅'}`);
  console.log(`Total Overflow Issues: ${report.summary.overflowTests}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (Object.keys(report.overflowByPage).length > 0) {
    console.log('⚠️  PAGES WITH OVERFLOW ISSUES:');
    Object.entries(report.overflowByPage).forEach(([pageName, viewports]) => {
      console.log(`\n  ${pageName}:`);
      viewports.forEach(v => {
        console.log(`    - ${v.viewport}: ${v.overflowAmount}px overflow`);
      });
    });
    console.log('');
  }
}

// Run the tests
runTests().catch(console.error);
