/**
 * Simple Test - Server Health and Recent Changes
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testServerHealth() {
  log('\n========================================', colors.magenta);
  log('TEST: Server Health Check', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.ok) {
      log('✅ Server is responding on port 3001', colors.green);
      return true;
    } else {
      log(`❌ Server returned status: ${response.status}`, colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Server health check failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testLoginPageLoad() {
  log('\n========================================', colors.magenta);
  log('TEST: Login Page Loads', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 10000 });

    const title = await page.title();
    const hasEmailInput = await page.$('input[type="email"]');
    const hasPasswordInput = await page.$('input[type="password"]');

    if (hasEmailInput && hasPasswordInput) {
      log('✅ Login page loads with email and password fields', colors.green);
      return true;
    } else {
      log('❌ Login page missing form elements', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Login page test failed: ${err.message}`, colors.red);
    return false;
  } finally {
    await browser.close();
  }
}

async function testActivitiesRemoved() {
  log('\n========================================', colors.magenta);
  log('TEST: Activities Page Removed', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  try {
    const response = await fetch(`${BASE_URL}/activities`);

    // Should be 404 or redirect
    if (response.status === 404 || response.status === 307 || response.status === 308) {
      log(`✅ Activities page returns ${response.status} (removed as expected)`, colors.green);
      return true;
    } else if (!response.ok) {
      log(`✅ Activities page not accessible (status ${response.status})`, colors.green);
      return true;
    } else {
      log(`❌ Activities page still accessible (status ${response.status})`, colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testInlineEditComponent() {
  log('\n========================================', colors.magenta);
  log('TEST: InlineEdit Component Exists', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const componentPath = path.join(process.cwd(), 'components/ui/InlineEdit.tsx');

  try {
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');

      const hasOnSave = content.includes('onSave');
      const hasIsEditing = content.includes('isEditing');
      const hasHandleSave = content.includes('handleSave');
      const hasEscape = content.includes('Escape');

      if (hasOnSave && hasIsEditing && hasHandleSave && hasEscape) {
        log('✅ InlineEdit component exists with key features:', colors.green);
        log('   - onSave prop', colors.blue);
        log('   - isEditing state', colors.blue);
        log('   - handleSave function', colors.blue);
        log('   - Escape key handling', colors.blue);
        return true;
      } else {
        log('❌ InlineEdit component missing some features', colors.red);
        return false;
      }
    } else {
      log('❌ InlineEdit component file not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testRelationshipActionSimplified() {
  log('\n========================================', colors.magenta);
  log('TEST: Relationship Action Simplified', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const hookPath = path.join(process.cwd(), 'lib/hooks/useRelationships.ts');

  try {
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf8');

      // Check that RelationshipAction interface doesn't have type field
      const actionInterfaceMatch = content.match(/interface RelationshipAction\s*\{[^}]+\}/s);

      if (actionInterfaceMatch) {
        const interfaceContent = actionInterfaceMatch[0];
        const hasTypeField = interfaceContent.includes('type:');

        if (!hasTypeField) {
          log('✅ RelationshipAction interface does NOT have type field (correct)', colors.green);

          // Check that completeAction doesn't require type parameter
          const completeActionMatch = content.match(/completeAction.*?\(/);
          if (completeActionMatch) {
            const params = content.substring(
              content.indexOf('completeAction'),
              content.indexOf('{', content.indexOf('completeAction'))
            );

            if (!params.includes("type: 'call'") && !params.includes("'call' | 'email'")) {
              log('✅ completeAction function does NOT require type parameter (correct)', colors.green);
              return true;
            } else {
              log('❌ completeAction still has type parameter', colors.red);
              return false;
            }
          }

          return true;
        } else {
          log('❌ RelationshipAction interface still has type field', colors.red);
          return false;
        }
      } else {
        log('⚠️  Could not find RelationshipAction interface', colors.red);
        return false;
      }
    } else {
      log('❌ useRelationships.ts not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testAnalyticsSimplified() {
  log('\n========================================', colors.magenta);
  log('TEST: Analytics Page Simplified', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const analyticsPath = path.join(process.cwd(), 'app/(dashboard)/analytics/page.tsx');

  try {
    if (fs.existsSync(analyticsPath)) {
      const content = fs.readFileSync(analyticsPath, 'utf8');

      // Check MetricType only has 2 options
      const metricTypeMatch = content.match(/type MetricType = ['"]([^'"]+)['"] \| ['"]([^'"]+)['"]/);

      if (metricTypeMatch) {
        const types = [metricTypeMatch[1], metricTypeMatch[2]];

        if (types.includes('relationships') && types.includes('time_investment')) {
          log('✅ MetricType has only 2 options: relationships & time_investment', colors.green);

          // Check that old metrics don't exist
          const hasActivities = content.includes("'activities'");
          const hasConversion = content.includes("'conversion'");
          const hasPerformance = content.includes("'performance'");

          if (!hasActivities && !hasConversion && !hasPerformance) {
            log('✅ Old metric types removed (activities, conversion, performance)', colors.green);
            return true;
          } else {
            log('❌ Some old metric types still exist', colors.red);
            return false;
          }
        } else {
          log(`❌ MetricType has wrong options: ${types.join(', ')}`, colors.red);
          return false;
        }
      } else {
        log('⚠️  Could not parse MetricType', colors.red);
        return false;
      }
    } else {
      log('❌ analytics/page.tsx not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testAIAnalyticsUsesOpenAI() {
  log('\n========================================', colors.magenta);
  log('TEST: AI Analytics Uses OpenAI', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const routePath = path.join(process.cwd(), 'app/api/admin/ai-analytics/route.ts');

  try {
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');

      const usesOpenAI = content.includes("from 'openai'");
      const usesAnthropic = content.includes("@anthropic-ai/sdk");
      const hasGPT4 = content.includes("gpt-4");

      if (usesOpenAI && !usesAnthropic && hasGPT4) {
        log('✅ AI Analytics uses OpenAI (not Anthropic)', colors.green);
        log('✅ Uses GPT-4o model', colors.green);
        return true;
      } else {
        if (usesAnthropic) log('❌ Still uses Anthropic SDK', colors.red);
        if (!usesOpenAI) log('❌ Does not use OpenAI', colors.red);
        if (!hasGPT4) log('❌ Does not use GPT-4 model', colors.red);
        return false;
      }
    } else {
      log('❌ ai-analytics route not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testTextChanges() {
  log('\n========================================', colors.magenta);
  log('TEST: Text Changes (AI Rationale → Motivo)', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const aiTasksPath = path.join(process.cwd(), 'app/admin/ai-tasks/page.tsx');

  try {
    if (fs.existsSync(aiTasksPath)) {
      const content = fs.readFileSync(aiTasksPath, 'utf8');

      const hasMotivo = content.includes('Motivo:');
      const hasOldLabel = content.includes('AI Rationale:');
      const hasConfidence = content.includes('Confidence:') || content.includes('🎯 Confidence');
      const hasImpact = content.includes('Impact:') || content.includes('⚡ Impact');

      let passed = true;

      if (hasMotivo) {
        log('✅ "Motivo:" label found', colors.green);
      } else {
        log('❌ "Motivo:" label not found', colors.red);
        passed = false;
      }

      if (!hasOldLabel) {
        log('✅ "AI Rationale:" removed', colors.green);
      } else {
        log('❌ "AI Rationale:" still exists', colors.red);
        passed = false;
      }

      if (!hasConfidence) {
        log('✅ Confidence metric removed', colors.green);
      } else {
        log('❌ Confidence metric still exists', colors.red);
        passed = false;
      }

      if (!hasImpact) {
        log('✅ Impact metric removed', colors.green);
      } else {
        log('❌ Impact metric still exists', colors.red);
        passed = false;
      }

      return passed;
    } else {
      log('❌ ai-tasks/page.tsx not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function testBuildSuccess() {
  log('\n========================================', colors.magenta);
  log('TEST: Next.js Build Files', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  const fs = require('fs');
  const path = require('path');

  const nextDir = path.join(process.cwd(), '.next');

  try {
    if (fs.existsSync(nextDir)) {
      const buildId = path.join(nextDir, 'BUILD_ID');

      if (fs.existsSync(buildId)) {
        const id = fs.readFileSync(buildId, 'utf8').trim();
        log(`✅ Build successful (BUILD_ID: ${id})`, colors.green);
        return true;
      } else {
        log('⚠️  No BUILD_ID found (server may still be compiling)', colors.red);
        return false;
      }
    } else {
      log('❌ .next directory not found', colors.red);
      return false;
    }
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 SIMPLE TEST SUITE - Recent Changes Verification\n', colors.bright + colors.blue);
  log(`Testing: ${BASE_URL}`, colors.blue);
  log(`Time: ${new Date().toLocaleString()}\n`, colors.blue);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Login Page Loads', fn: testLoginPageLoad },
    { name: 'Activities Page Removed', fn: testActivitiesRemoved },
    { name: 'InlineEdit Component', fn: testInlineEditComponent },
    { name: 'Relationship Action Simplified', fn: testRelationshipActionSimplified },
    { name: 'Analytics Simplified', fn: testAnalyticsSimplified },
    { name: 'AI Analytics Uses OpenAI', fn: testAIAnalyticsUsesOpenAI },
    { name: 'Text Changes', fn: testTextChanges },
    { name: 'Build Success', fn: testBuildSuccess },
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      if (passed) results.passed++;
      else results.failed++;
    } catch (err) {
      log(`❌ Test "${test.name}" threw error: ${err.message}`, colors.red);
      results.tests.push({ name: test.name, passed: false });
      results.failed++;
    }
  }

  // Summary
  log('\n========================================', colors.magenta);
  log('TEST SUMMARY', colors.bright + colors.magenta);
  log('========================================', colors.magenta);

  log(`\nTotal Tests: ${results.tests.length}`, colors.bright);
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`❌ Failed: ${results.failed}`, colors.red);
  log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`, colors.bright);

  log('Detailed Results:', colors.bright);
  results.tests.forEach((test, idx) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? colors.green : colors.red;
    log(`  ${idx + 1}. ${status} ${test.name}`, color);
  });

  log('\n========================================\n', colors.magenta);

  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉\n', colors.bright + colors.green);
  } else {
    log(`⚠️  ${results.failed} test(s) failed\n`, colors.red);
  }

  return results;
}

runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`, colors.red);
  console.error(err);
  process.exit(1);
});
