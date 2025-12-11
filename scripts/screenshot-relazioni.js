const puppeteer = require('puppeteer');

async function screenshot() {
  console.log('📸 Taking screenshot of relazioni page...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📄 Loading page...');
    await page.goto('https://sales-crm-412055180465.europe-west1.run.app/relazioni', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check what we got
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasLogin: document.querySelector('input[type="email"]') !== null,
        hasMain: document.querySelector('main') !== null,
        bodyText: document.body?.innerText?.substring(0, 300)
      };
    });

    console.log('📊 Page Info:');
    console.log('  Title:', pageInfo.title);
    console.log('  URL:', pageInfo.url);
    console.log('  Has Login Form:', pageInfo.hasLogin ? '✅' : '❌');
    console.log('  Has Main Content:', pageInfo.hasMain ? '✅' : '❌');
    console.log('  Body text preview:', pageInfo.bodyText);

    await page.screenshot({
      path: 'screenshots/relazioni-current.png',
      fullPage: true
    });

    console.log('\n📸 Screenshot saved: screenshots/relazioni-current.png');

    if (pageInfo.hasLogin) {
      console.log('\n⚠️  Page requires authentication - showing login page');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

screenshot()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
