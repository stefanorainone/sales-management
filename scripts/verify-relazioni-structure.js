const puppeteer = require('puppeteer');

async function verifyRelazioniStructure() {
  console.log('🔍 Verifying Relazioni page structure...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to relazioni page
    console.log('📄 Loading https://sales-crm-412055180465.europe-west1.run.app/relazioni...');
    await page.goto('https://sales-crm-412055180465.europe-west1.run.app/relazioni', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for the page to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the page structure
    const structure = await page.evaluate(() => {
      const mainContainer = document.querySelector('main');
      if (!mainContainer) return { error: 'Main container not found' };

      const firstDiv = mainContainer.querySelector('div.space-y-4, div.space-y-6');
      if (!firstDiv) return { error: 'First div not found' };

      const children = Array.from(firstDiv.children);

      return {
        totalChildren: children.length,
        firstChild: {
          classes: children[0]?.className || 'N/A',
          text: children[0]?.innerText?.substring(0, 200) || 'N/A',
          isAIWidget: children[0]?.querySelector('[class*="purple"]') !== null ||
                      children[0]?.innerText?.includes('Suggerimenti AI') || false,
          hasCollapse: children[0]?.querySelector('button') !== null
        },
        secondChild: {
          classes: children[1]?.className || 'N/A',
          text: children[1]?.innerText?.substring(0, 200) || 'N/A',
          isHeader: children[1]?.querySelector('h1') !== null
        },
        thirdChild: {
          classes: children[2]?.className || 'N/A',
          text: children[2]?.innerText?.substring(0, 100) || 'N/A'
        },
        allChildren: children.map((child, idx) => ({
          index: idx,
          tagName: child.tagName,
          classes: child.className?.substring(0, 50) || 'N/A',
          hasAIText: child.innerText?.includes('Suggerimenti AI') || false,
          hasHeader: child.querySelector('h1') !== null,
          preview: child.innerText?.substring(0, 80) || 'N/A'
        }))
      };
    });

    console.log('\n📊 Page Structure Analysis:\n');
    console.log('Total children:', structure.totalChildren);
    console.log('\n1️⃣ First Child (should be AI Widget):');
    console.log('  - Classes:', structure.firstChild.classes);
    console.log('  - Is AI Widget:', structure.firstChild.isAIWidget ? '✅' : '❌');
    console.log('  - Has Collapse Button:', structure.firstChild.hasCollapse ? '✅' : '❌');
    console.log('  - Text preview:', structure.firstChild.text);

    console.log('\n2️⃣ Second Child (should be Header):');
    console.log('  - Classes:', structure.secondChild.classes);
    console.log('  - Is Header:', structure.secondChild.isHeader ? '✅' : '❌');
    console.log('  - Text preview:', structure.secondChild.text);

    console.log('\n3️⃣ Third Child (should be Stats):');
    console.log('  - Classes:', structure.thirdChild.classes);
    console.log('  - Text preview:', structure.thirdChild.text);

    console.log('\n📋 All Children Summary:');
    structure.allChildren.forEach(child => {
      console.log(`\n  [${child.index}] ${child.tagName}`);
      console.log(`      Classes: ${child.classes}`);
      console.log(`      AI Widget: ${child.hasAIText ? '✅' : '❌'}`);
      console.log(`      Header: ${child.hasHeader ? '✅' : '❌'}`);
      console.log(`      Preview: ${child.preview}`);
    });

    // Check if AI widget is collapsed by default
    const isCollapsed = await page.evaluate(() => {
      const aiWidget = document.querySelector('[class*="purple"]');
      if (!aiWidget) return null;

      const content = aiWidget.querySelector('[class*="space-y"]');
      return content ? window.getComputedStyle(content).display === 'none' : null;
    });

    console.log('\n🔽 AI Widget Collapsed State:', isCollapsed !== null ? (isCollapsed ? '✅ Closed' : '❌ Open') : '❓ Not found');

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/relazioni-structure-verification.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved: screenshots/relazioni-structure-verification.png');

    // Final verification
    console.log('\n✨ Final Verification:');
    if (structure.firstChild.isAIWidget) {
      console.log('✅ AI Widget is FIRST element');
    } else {
      console.log('❌ AI Widget is NOT first element');
    }

    if (structure.secondChild.isHeader) {
      console.log('✅ Header is SECOND element');
    } else {
      console.log('❌ Header is NOT second element');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyRelazioniStructure()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
