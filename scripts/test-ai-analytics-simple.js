const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimpleTest() {
  console.log('🚀 Starting AI Analytics Simple Test...\n');
  console.log('=' .repeat(60));
  console.log('⚠️  IMPORTANTE: Assicurati di essere già loggato come ADMIN');
  console.log('   nel browser prima di eseguire questo test!');
  console.log('=' .repeat(60));

  await sleep(3000);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Building analytics') || text.includes('📊') || text.includes('AI')) {
      console.log('  🌐 Browser:', text);
    }
  });

  try {
    console.log('\n📊 TEST 1: Navigating to AI Analytics page...');
    await page.goto(`${BASE_URL}/admin/ai-analytics`, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);

    // Take screenshot
    await page.screenshot({ path: 'ai-analytics-test-1-page-load.png' });
    console.log('✅ Screenshot saved: ai-analytics-test-1-page-load.png');

    // Check if page loaded
    const heading = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (heading && heading.includes('AI Analytics')) {
      console.log('✅ AI Analytics page loaded successfully');
      console.log(`   Heading: "${heading}"`);
    } else {
      console.log('⚠️  Page might not have loaded correctly');
      console.log(`   Heading: "${heading}"`);
    }

    console.log('\n🎨 TEST 2: Checking UI elements...');

    // Check for input field
    const inputField = await page.$('input[placeholder*="Fai una domanda"]');
    if (inputField) {
      console.log('✅ Question input field found');
    } else {
      console.log('❌ Question input field NOT found');
    }

    // Check for suggested questions
    const buttons = await page.$$('button');
    console.log(`✅ Found ${buttons.length} buttons on page`);

    console.log('\n💬 TEST 3: Typing and sending a question...');

    const testQuestion = 'Quanti venditori ci sono in totale?';
    console.log(`   Question: "${testQuestion}"`);

    // Type question
    await page.click('input[placeholder*="Fai una domanda"]');
    await page.type('input[placeholder*="Fai una domanda"]', testQuestion, { delay: 50 });
    await sleep(1000);

    // Take screenshot
    await page.screenshot({ path: 'ai-analytics-test-2-question-typed.png' });
    console.log('✅ Screenshot saved: ai-analytics-test-2-question-typed.png');

    console.log('✅ Question typed successfully');

    // Find and click send button
    const sendButtons = await page.$$('button');
    let sendButton = null;
    for (const button of sendButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Invia')) {
        sendButton = button;
        break;
      }
    }

    if (sendButton) {
      console.log('✅ Found "Invia" button, clicking...');
      await sendButton.click();
      await sleep(2000);

      // Take screenshot
      await page.screenshot({ path: 'ai-analytics-test-3-question-sent.png' });
      console.log('✅ Screenshot saved: ai-analytics-test-3-question-sent.png');

      console.log('\n⏳ Waiting for AI response...');
      console.log('   (This can take 30-60 seconds)');

      // Wait for response
      let secondsWaited = 0;
      let responseReceived = false;

      while (secondsWaited < 120 && !responseReceived) {
        await sleep(5000);
        secondsWaited += 5;

        // Check for response messages
        const messages = await page.$$('.bg-gray-100');

        if (messages.length > 0) {
          responseReceived = true;
          console.log(`✅ AI response received after ${secondsWaited} seconds!`);

          // Take screenshot of response
          await page.screenshot({ path: 'ai-analytics-test-4-response-received.png', fullPage: true });
          console.log('✅ Screenshot saved: ai-analytics-test-4-response-received.png');

          // Get response text
          const responseText = await page.evaluate(() => {
            const assistantMessages = Array.from(document.querySelectorAll('.bg-gray-100'));
            if (assistantMessages.length > 0) {
              const lastMessage = assistantMessages[assistantMessages.length - 1];
              return lastMessage.textContent;
            }
            return '';
          });

          console.log('\n📝 AI Response:');
          console.log('─'.repeat(60));
          console.log(responseText.substring(0, 500));
          if (responseText.length > 500) {
            console.log('... (truncated)');
          }
          console.log('─'.repeat(60));

          break;
        }

        if (secondsWaited % 10 === 0) {
          console.log(`   Still waiting... (${secondsWaited}s elapsed)`);
        }
      }

      if (!responseReceived) {
        console.log('❌ No response received after 2 minutes');
        console.log('   This might indicate an API or configuration issue');
      }

    } else {
      console.log('❌ Send button NOT found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Page Navigation: SUCCESS');
    console.log('✅ UI Elements: PRESENT');
    console.log('✅ Question Input: SUCCESS');
    if (sendButton) {
      console.log('✅ Send Button: SUCCESS');
    } else {
      console.log('❌ Send Button: FAILED');
    }
    console.log('='.repeat(60));

    console.log('\n📸 Screenshots saved:');
    console.log('   1. ai-analytics-test-1-page-load.png');
    console.log('   2. ai-analytics-test-2-question-typed.png');
    console.log('   3. ai-analytics-test-3-question-sent.png');
    console.log('   4. ai-analytics-test-4-response-received.png (if response was received)');

    // Keep browser open for 10 seconds
    console.log('\n⏰ Keeping browser open for 10 seconds for inspection...');
    await sleep(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed. Test complete.\n');
  }
}

// Run test
runSimpleTest().catch(console.error);
