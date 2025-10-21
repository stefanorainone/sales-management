const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:3001/pipeline...');
  await page.goto('http://localhost:3001/pipeline', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Wait a bit for any animations
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Taking screenshot...');
  await page.screenshot({
    path: 'pipeline-screenshot.png',
    fullPage: true
  });

  console.log('Screenshot saved as pipeline-screenshot.png');

  await browser.close();
})();
