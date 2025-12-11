const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"], input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function testTaskClickFix() {
  console.log('🔍 Testing Task Click Fix\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('⏳ Waiting for AI suggestions to generate...\n');
    await new Promise(r => setTimeout(r, 8000));

    // Check if AI widget exists
    const widgetExists = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      return !!widget;
    });

    if (!widgetExists) {
      console.log('❌ AI Widget not found');
      await browser.close();
      return;
    }

    console.log('✅ AI Widget found\n');

    // Get task cards info with relazioneId
    const tasksInfo = await page.evaluate(() => {
      const results = [];
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) return results;

      // Find "Rafforza Relazioni Esistenti" section
      const headers = Array.from(widget.querySelectorAll('h4'));
      const taskHeader = headers.find(h =>
        h.textContent?.includes('Rafforza Relazioni Esistenti') ||
        h.textContent?.includes('🤝')
      );

      if (!taskHeader) return results;

      // Get cards in this section
      let currentNode = taskHeader.nextElementSibling;
      while (currentNode && currentNode.tagName !== 'H4') {
        if (currentNode.classList && currentNode.classList.toString().includes('space-y')) {
          const cards = Array.from(currentNode.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'));

          cards.forEach((card, idx) => {
            const titleEl = card.querySelector('.font-semibold, .font-medium, .font-bold');
            const relationEl = Array.from(card.querySelectorAll('div')).find(el =>
              el.textContent?.trim().startsWith('Per:')
            );

            const hasCursor = window.getComputedStyle(card).cursor === 'pointer';

            results.push({
              index: idx,
              title: titleEl?.textContent?.trim() || 'N/A',
              relation: relationEl?.textContent?.replace('Per:', '').trim() || 'N/A',
              isClickable: hasCursor
            });
          });
        }
        currentNode = currentNode.nextElementSibling;
      }

      return results;
    });

    console.log('📋 Task Cards Found:\n');
    if (tasksInfo.length === 0) {
      console.log('   ⚠️  No task cards found\n');
      await browser.close();
      return;
    }

    tasksInfo.forEach(task => {
      console.log(`${task.index + 1}. ${task.title}`);
      console.log(`   Relazione: ${task.relation}`);
      console.log(`   Clickable: ${task.isClickable ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Test clicking on first clickable task
    const firstClickable = tasksInfo.find(t => t.isClickable);
    if (!firstClickable) {
      console.log('⚠️  No clickable tasks found\n');
      await browser.close();
      return;
    }

    console.log(`🖱️  Testing click on task "${firstClickable.title}"...\n`);

    // Get URL before click
    const urlBefore = page.url();
    console.log(`URL before click: ${urlBefore}`);

    // Click on the first clickable task
    await page.evaluate((index) => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      if (!widget) return;

      const headers = Array.from(widget.querySelectorAll('h4'));
      const taskHeader = headers.find(h =>
        h.textContent?.includes('Rafforza Relazioni Esistenti') ||
        h.textContent?.includes('🤝')
      );

      if (!taskHeader) return;

      let currentNode = taskHeader.nextElementSibling;
      while (currentNode && currentNode.tagName !== 'H4') {
        if (currentNode.classList && currentNode.classList.toString().includes('space-y')) {
          const cards = Array.from(currentNode.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'));
          if (cards[index]) {
            cards[index].click();
          }
        }
        currentNode = currentNode.nextElementSibling;
      }
    }, firstClickable.index);

    // Wait for potential modal or action
    await new Promise(r => setTimeout(r, 1500));

    // Check if modal opened
    const modalInfo = await page.evaluate(() => {
      // Look for modal by checking for fixed positioned elements
      const allFixedElements = Array.from(document.querySelectorAll('[class*="fixed"]'));
      const modal = allFixedElements.find(el => {
        const rect = el.getBoundingClientRect();
        const zIndex = window.getComputedStyle(el).zIndex;
        return rect.width > 300 && rect.height > 200 && parseInt(zIndex) > 10;
      });

      if (!modal) return { opened: false };

      // Try to extract modal title/content
      const titleEl = modal.querySelector('h2, h3, [class*="font-bold"], [class*="font-semibold"]');

      return {
        opened: true,
        title: titleEl?.textContent?.substring(0, 100) || 'Modal opened',
        hasContent: modal.textContent && modal.textContent.length > 50
      };
    });

    console.log(`URL after click: ${page.url()}\n`);

    if (modalInfo.opened) {
      console.log('✅ Modal/Action triggered successfully!');
      console.log(`   Title: "${modalInfo.title}"`);
      console.log(`   Has content: ${modalInfo.hasContent ? 'Yes' : 'No'}\n`);
      console.log('🎉 SUCCESS: Task click is working!\n');
    } else {
      console.log('❌ No modal or action detected');
      console.log('⚠️  Task click may not be working correctly\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testTaskClickFix().catch(console.error);
