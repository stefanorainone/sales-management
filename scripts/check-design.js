const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'Pipeline', url: 'http://localhost:3000/pipeline' },
  { name: 'Clients', url: 'http://localhost:3000/clients' },
  { name: 'Activities', url: 'http://localhost:3000/activities' },
  { name: 'AI-Tasks', url: 'http://localhost:3000/ai-tasks' },
  { name: 'Training', url: 'http://localhost:3000/training' },
  { name: 'Analytics', url: 'http://localhost:3000/analytics' },
  { name: 'Admin-Dashboard', url: 'http://localhost:3000/admin/dashboard' },
  { name: 'Admin-AI-Config', url: 'http://localhost:3000/admin/ai-config' },
];

(async () => {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('🎨 Starting design check...\n');

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing: ${pageInfo.name}...`);

      await page.goto(pageInfo.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a bit for any animations
      await new Promise(resolve => setTimeout(resolve, 500));

      const screenshotPath = path.join(screenshotsDir, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Check for common layout issues
      const layoutChecks = await page.evaluate(() => {
        const issues = [];

        // Check if sidebar exists
        const sidebar = document.querySelector('.min-h-screen.fixed');
        if (!sidebar) {
          issues.push('⚠️ Sidebar not found');
        }

        // Check for overlapping content
        const mainContent = document.querySelector('main');
        if (mainContent) {
          const rect = mainContent.getBoundingClientRect();
          if (rect.left < 256) { // 256px = sidebar width
            issues.push('⚠️ Content might be overlapping with sidebar');
          }
        }

        // Check for horizontal scroll
        if (document.body.scrollWidth > window.innerWidth) {
          issues.push('⚠️ Horizontal scroll detected');
        }

        // Check if page has visible content
        const bodyText = document.body.innerText.trim();
        if (bodyText.length < 100) {
          issues.push('⚠️ Very little content on page');
        }

        return {
          issues,
          hasContent: bodyText.length > 0,
          scrollHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
        };
      });

      console.log(`   ✅ Screenshot saved: ${screenshotPath}`);
      console.log(`   📏 Height: ${layoutChecks.scrollHeight}px`);

      if (layoutChecks.issues.length > 0) {
        console.log(`   Issues found:`);
        layoutChecks.issues.forEach(issue => console.log(`      ${issue}`));
      } else {
        console.log(`   ✨ No layout issues detected`);
      }
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error capturing ${pageInfo.name}: ${error.message}\n`);
    }
  }

  await browser.close();
  console.log('✅ Design check complete!');
  console.log(`📁 Screenshots saved in: ${screenshotsDir}`);
})();
