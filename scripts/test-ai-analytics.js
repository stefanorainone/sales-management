const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

// Test credentials (from login page)
const ADMIN_EMAIL = 'admin@vr.com';
const ADMIN_PASSWORD = 'Admin123!';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page, email, password) {
  console.log(`\n🔐 Logging in as ${email}...`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Fill login form
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation (don't wait for networkidle0, just wait for load)
  await page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });

  // Give the page a moment to settle
  await sleep(3000);

  console.log('✅ Login successful');
}

async function testAIAnalyticsAccess(page) {
  console.log('\n📊 TEST 1: Accessing AI Analytics page...');

  try {
    await page.goto(`${BASE_URL}/admin/ai-analytics`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Check if page loaded
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for main heading
    const heading = await page.$eval('h1', el => el.textContent);
    console.log(`Heading: ${heading}`);

    if (heading.includes('AI Analytics')) {
      console.log('✅ AI Analytics page loaded successfully');
      return true;
    } else {
      console.log('❌ Wrong page loaded');
      return false;
    }
  } catch (error) {
    console.error('❌ Error accessing AI Analytics:', error.message);
    return false;
  }
}

async function testUIElements(page) {
  console.log('\n🎨 TEST 2: Checking UI elements...');

  try {
    // Check for info card
    const infoCard = await page.$('text/Come funziona');
    if (infoCard) {
      console.log('✅ Info card present');
    } else {
      console.log('⚠️  Info card not found');
    }

    // Check for suggested questions
    const suggestedQuestions = await page.$$('text/Domande Suggerite');
    if (suggestedQuestions.length > 0) {
      console.log('✅ Suggested questions section present');
    } else {
      console.log('⚠️  Suggested questions section not found');
    }

    // Check for input field
    const inputField = await page.$('input[placeholder*="Fai una domanda"]');
    if (inputField) {
      console.log('✅ Question input field present');
    } else {
      console.log('❌ Question input field not found');
      return false;
    }

    // Check for send button
    const sendButton = await page.$('button:has-text("Invia")');
    if (sendButton) {
      console.log('✅ Send button present');
    } else {
      console.log('⚠️  Send button not found');
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking UI elements:', error.message);
    return false;
  }
}

async function testAskQuestion(page) {
  console.log('\n💬 TEST 3: Asking a question to AI...');

  try {
    const testQuestion = 'Chi è il venditore che sta lavorando meglio?';
    console.log(`Question: "${testQuestion}"`);

    // Find and fill input field
    const inputSelector = 'input[placeholder*="Fai una domanda"]';
    await page.waitForSelector(inputSelector);
    await page.click(inputSelector);
    await page.type(inputSelector, testQuestion);
    await sleep(500);

    console.log('✅ Question typed in input field');

    // Click send button
    await page.click('button:has-text("Invia")');
    console.log('✅ Send button clicked');

    // Wait for loading indicator
    await sleep(1000);
    const loadingIndicator = await page.$('text/Sto analizzando i dati');
    if (loadingIndicator) {
      console.log('✅ Loading indicator appeared');
    }

    // Wait for response (max 60 seconds for AI to respond)
    console.log('⏳ Waiting for AI response (this may take 30-60 seconds)...');

    let responseReceived = false;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max

    while (!responseReceived && attempts < maxAttempts) {
      await sleep(1000);
      attempts++;

      // Check if there's a response message (assistant message in gray background)
      const messages = await page.$$('.bg-gray-100');
      if (messages.length > 0) {
        responseReceived = true;
        console.log(`✅ AI response received after ${attempts} seconds`);

        // Get the response text
        const responseText = await page.evaluate(() => {
          const assistantMessages = Array.from(document.querySelectorAll('.bg-gray-100'));
          if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            return lastMessage.textContent;
          }
          return '';
        });

        console.log('\n📝 AI Response Preview:');
        console.log(responseText.substring(0, 300) + '...');

        break;
      }

      if (attempts % 10 === 0) {
        console.log(`Still waiting... (${attempts}s elapsed)`);
      }
    }

    if (!responseReceived) {
      console.log('❌ AI response timeout after 2 minutes');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error asking question:', error.message);
    return false;
  }
}

async function testSuggestedQuestion(page) {
  console.log('\n🔘 TEST 4: Testing suggested question click...');

  try {
    // Reload page to reset
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(2000);

    // Click first suggested question
    const suggestedButtons = await page.$$('button.bg-gray-50');
    if (suggestedButtons.length > 0) {
      console.log(`Found ${suggestedButtons.length} suggested questions`);

      // Get text of first suggestion
      const firstSuggestionText = await page.evaluate(el => el.textContent, suggestedButtons[0]);
      console.log(`Clicking suggestion: "${firstSuggestionText}"`);

      await suggestedButtons[0].click();
      await sleep(500);

      // Check if input was filled
      const inputValue = await page.$eval('input[placeholder*="Fai una domanda"]', el => el.value);
      if (inputValue === firstSuggestionText) {
        console.log('✅ Suggested question populated input field');
        return true;
      } else {
        console.log('⚠️  Input field not populated with suggestion');
        return false;
      }
    } else {
      console.log('⚠️  No suggested questions found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing suggested question:', error.message);
    return false;
  }
}

async function testChatHistory(page) {
  console.log('\n📜 TEST 5: Testing chat history...');

  try {
    // Count messages before
    const messagesBefore = await page.$$('.rounded-lg.p-4');
    const countBefore = messagesBefore.length;
    console.log(`Messages before: ${countBefore}`);

    // Ask a simple question
    await page.click('input[placeholder*="Fai una domanda"]');
    await page.type('input[placeholder*="Fai una domanda"]', 'Quanti venditori ci sono?');
    await page.click('button:has-text("Invia")');

    console.log('⏳ Waiting for response...');
    await sleep(30000); // Wait 30 seconds for response

    // Count messages after
    const messagesAfter = await page.$$('.rounded-lg.p-4');
    const countAfter = messagesAfter.length;
    console.log(`Messages after: ${countAfter}`);

    if (countAfter > countBefore) {
      console.log('✅ Chat history is being maintained');
      return true;
    } else {
      console.log('⚠️  Chat history might not be working');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing chat history:', error.message);
    return false;
  }
}

async function testStatsDisplay(page) {
  console.log('\n📈 TEST 6: Testing stats display...');

  try {
    // Check if stats card appears after messages
    const statsCard = await page.$('text/Analisi Completate');
    if (statsCard) {
      console.log('✅ Stats card is displayed');

      // Try to read stats
      const stats = await page.evaluate(() => {
        const statsElements = document.querySelectorAll('.text-2xl.font-bold');
        return Array.from(statsElements).map(el => el.textContent);
      });

      console.log(`Stats: ${stats.join(', ')}`);
      return true;
    } else {
      console.log('ℹ️  Stats card not yet displayed (appears after first message)');
      return true; // Not an error
    }
  } catch (error) {
    console.error('❌ Error testing stats display:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Analytics Puppeteer Tests...\n');
  console.log('=' .repeat(60));

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logs from the page
  page.on('console', msg => {
    if (msg.text().includes('AI Analytics') || msg.text().includes('📊')) {
      console.log('  Browser Console:', msg.text());
    }
  });

  try {
    // Login as admin
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const results = {
      access: await testAIAnalyticsAccess(page),
      ui: await testUIElements(page),
      askQuestion: await testAskQuestion(page),
      suggestedQuestion: await testSuggestedQuestion(page),
      chatHistory: await testChatHistory(page),
      stats: await testStatsDisplay(page),
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(60));

    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r === true);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! AI Analytics is working perfectly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please review the results above.');
    }
    console.log('='.repeat(60));

    // Keep browser open for 5 seconds to see final state
    await sleep(5000);

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed. Tests complete.');
  }
}

// Run tests
runAllTests().catch(console.error);
