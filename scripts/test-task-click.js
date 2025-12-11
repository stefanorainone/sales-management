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

async function testTaskClick() {
  console.log('🔍 Testing Task Click Functionality\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

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

    // Get task cards info
    const tasksInfo = await page.evaluate(() => {
      const results = [];
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      if (!widget) return results;

      // Find all task cards
      const taskCards = Array.from(widget.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'))
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('Per:') && (text.includes('ALTA') || text.includes('MEDIA') || text.includes('BASSA'));
        });

      taskCards.forEach((card, idx) => {
        const titleEl = card.querySelector('.font-semibold, .font-medium');
        const relationEl = Array.from(card.querySelectorAll('div')).find(el =>
          el.textContent?.trim().startsWith('Per:')
        );

        const hasCursor = window.getComputedStyle(card).cursor === 'pointer';

        results.push({
          index: idx + 1,
          title: titleEl?.textContent?.trim() || 'N/A',
          relation: relationEl?.textContent?.replace('Per:', '').trim() || 'N/A',
          isClickable: hasCursor
        });
      });

      return results;
    });

    console.log('📋 Task Cards Found:\n');
    tasksInfo.forEach(task => {
      console.log(`${task.index}. ${task.title}`);
      console.log(`   Relazione: ${task.relation}`);
      console.log(`   Clickable: ${task.isClickable ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Test clicking on first clickable task
    const firstClickable = tasksInfo.find(t => t.isClickable);
    if (!firstClickable) {
      console.log('⚠️  No clickable tasks found');
      await browser.close();
      return;
    }

    console.log(`\n🖱️  Testing click on task: "${firstClickable.title}"\n`);

    // Click on the first clickable task
    await page.evaluate((index) => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      if (!widget) return;

      const taskCards = Array.from(widget.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'))
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('Per:') && (text.includes('ALTA') || text.includes('MEDIA') || text.includes('BASSA'));
        });

      if (taskCards[index - 1]) {
        taskCards[index - 1].click();
      }
    }, firstClickable.index);

    // Wait for modal to appear
    await new Promise(r => setTimeout(r, 1000));

    // Check if modal opened
    const modalInfo = await page.evaluate(() => {
      // Look for modal indicators
      const modalBackdrop = document.querySelector('[class*="fixed"][class*="inset-0"]');
      const modalContent = document.querySelector('[class*="modal"]') ||
                          Array.from(document.querySelectorAll('div')).find(el => {
                            const classes = el.className || '';
                            return classes.includes('fixed') && classes.includes('z-50');
                          });

      if (!modalBackdrop && !modalContent) {
        return { opened: false };
      }

      // Try to find modal content
      const allModals = Array.from(document.querySelectorAll('[class*="fixed"]'));
      const modal = allModals.find(m => {
        const rect = m.getBoundingClientRect();
        return rect.width > 300 && rect.height > 200;
      });

      if (!modal) {
        return { opened: false };
      }

      return {
        opened: true,
        content: modal.textContent?.substring(0, 200) || 'Modal content found'
      };
    });

    if (modalInfo.opened) {
      console.log('✅ Modal opened successfully!');
      console.log(`📝 Modal preview: "${modalInfo.content.substring(0, 100)}..."\n`);
    } else {
      console.log('❌ Modal did not open');
    }

    // Test hover effect
    console.log('🎨 Testing hover effects...\n');
    const hoverTest = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      if (!widget) return { success: false };

      const taskCards = Array.from(widget.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'))
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('Per:') && (text.includes('ALTA') || text.includes('MEDIA') || text.includes('BASSA'));
        });

      if (taskCards.length === 0) return { success: false };

      const firstCard = taskCards[0];
      const classes = firstCard.className || '';

      return {
        success: true,
        hasCursorPointer: classes.includes('cursor-pointer'),
        hasHoverEffect: classes.includes('hover:border-purple-400') || classes.includes('hover:border-blue-300')
      };
    });

    if (hoverTest.success) {
      console.log(`Cursor Pointer: ${hoverTest.hasCursorPointer ? '✅' : '❌'}`);
      console.log(`Hover Border Effect: ${hoverTest.hasHoverEffect ? '✅' : '❌'}`);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testTaskClick().catch(console.error);
