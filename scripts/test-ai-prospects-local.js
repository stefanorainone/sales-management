const puppeteer = require('puppeteer');

const LOCAL_URL = 'http://localhost:3001';

async function login(page) {
  await page.goto(`${LOCAL_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  await page.type('input[type="email"], input[name="email"]', 'stefanorainone@gmail.com');
  await page.type('input[type="password"], input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
}

async function testAIProspectsLocal() {
  console.log('🔍 Testing AI Prospects on LOCALHOST\n');
  console.log(`📍 URL: ${LOCAL_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log('🔐 Logging in...\n');
    await login(page);

    console.log('📄 Navigating to /relazioni...\n');
    await page.goto(`${LOCAL_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for AI widget to load and generate suggestions
    console.log('⏳ Waiting for AI suggestions to generate (10 seconds)...\n');
    await new Promise(r => setTimeout(r, 10000));

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

    // Extract prospects data
    const prospectsData = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      if (!widget) return null;

      const results = {
        prospects: [],
        sectionTitle: ''
      };

      // Find "Persone che dovresti conoscere" section
      const headers = Array.from(widget.querySelectorAll('h4'));
      const prospectHeader = headers.find(h =>
        h.textContent?.includes('Persone che dovresti conoscere') ||
        h.textContent?.includes('🎯')
      );

      if (prospectHeader) {
        results.sectionTitle = prospectHeader.textContent?.trim() || '';

        // Get cards in this section
        let currentNode = prospectHeader.nextElementSibling;
        while (currentNode && currentNode.tagName !== 'H4') {
          if (currentNode.classList && currentNode.classList.toString().includes('space-y')) {
            const cards = Array.from(currentNode.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'));

            cards.forEach(card => {
              const nomeEl = card.querySelector('.font-semibold, .font-bold');
              const ruoloEl = Array.from(card.querySelectorAll('div')).find(el =>
                el.textContent?.includes('@')
              );
              const settoreEl = Array.from(card.querySelectorAll('div')).find(el =>
                el.textContent?.trim().startsWith('Settore:')
              );
              const motivoEl = Array.from(card.querySelectorAll('div')).find(el =>
                el.textContent?.includes('Perché contattare:')
              );
              const fonteEl = card.querySelector('a[href]');

              const ruoloText = ruoloEl?.textContent?.trim() || '';
              const parts = ruoloText.split('@');

              results.prospects.push({
                nome: nomeEl?.textContent?.trim() || '',
                ruolo: parts[0]?.trim() || '',
                azienda: parts[1]?.trim() || '',
                settore: settoreEl?.textContent?.replace('Settore:', '').trim() || '',
                motivo: motivoEl?.textContent?.replace('Perché contattare:', '').trim() || '',
                fonte: fonteEl?.href || ''
              });
            });
          }
          currentNode = currentNode.nextElementSibling;
        }
      }

      return results;
    });

    if (!prospectsData || !prospectsData.prospects.length) {
      console.log('❌ No prospects found in widget');
      await browser.close();
      return;
    }

    console.log(`📋 Section Title: "${prospectsData.sectionTitle}"\n`);
    console.log(`🎯 PROSPECTS FOUND: ${prospectsData.prospects.length}\n`);

    // Common fake Italian names to check against
    const commonFakeNames = [
      'marco rossi', 'laura bianchi', 'giuseppe verdi', 'mario rossi',
      'anna russo', 'luca ferrari', 'francesca romano', 'giovanni esposito',
      'maria ricci', 'paolo bruno', 'sara gallo', 'andrea costa',
      'elena gatti', 'stefano colombo', 'chiara moretti'
    ];

    const fakeCompanies = [
      'tech solutions italia', 'innovazione digitale', 'digital innovation',
      'manifattura avanzata', 'esempio', 'example', 'test', 'demo'
    ];

    const fakeSources = [
      'esempio.com', 'example.com', 'test.com', 'sample.com', 'demo.com'
    ];

    let realProspectsCount = 0;
    let fakeProspectsCount = 0;

    prospectsData.prospects.forEach((prospect, idx) => {
      console.log(`${idx + 1}. ${prospect.nome}`);
      console.log(`   Ruolo: ${prospect.ruolo}`);
      console.log(`   Azienda: ${prospect.azienda}`);
      console.log(`   Settore: ${prospect.settore}`);
      console.log(`   Motivo: ${prospect.motivo.substring(0, 100)}${prospect.motivo.length > 100 ? '...' : ''}`);
      console.log(`   Fonte: ${prospect.fonte}`);

      // Reality checks
      const nameLower = prospect.nome.toLowerCase();
      const companyLower = prospect.azienda.toLowerCase();
      const sourceLower = prospect.fonte.toLowerCase();

      const checks = {
        hasCommonFakeName: commonFakeNames.some(fakeName => nameLower.includes(fakeName)),
        hasFakeCompany: fakeCompanies.some(fake => companyLower.includes(fake)),
        hasFakeSource: fakeSources.some(fake => sourceLower.includes(fake)),
        hasRealSource: sourceLower.includes('linkedin.com') ||
                       sourceLower.includes('ilsole24ore') ||
                       sourceLower.includes('repubblica.it') ||
                       sourceLower.includes('corriere.it') ||
                       sourceLower.includes('startupitalia') ||
                       sourceLower.includes('forbes'),
        hasFullName: prospect.nome.split(' ').length >= 2,
        hasCompany: prospect.azienda && prospect.azienda.length > 0,
        hasSource: prospect.fonte && prospect.fonte.length > 10
      };

      // Determine if it's likely real or fake
      const suspiciousFlags = [
        checks.hasCommonFakeName,
        checks.hasFakeCompany,
        checks.hasFakeSource
      ].filter(Boolean).length;

      const positiveFlags = [
        checks.hasRealSource,
        checks.hasFullName,
        checks.hasCompany,
        checks.hasSource
      ].filter(Boolean).length;

      const looksReal = positiveFlags >= 3 && suspiciousFlags === 0;

      if (looksReal) {
        realProspectsCount++;
      } else {
        fakeProspectsCount++;
      }

      console.log(`   Reality Check:`);
      console.log(`      ${checks.hasCommonFakeName ? '❌' : '✅'} ${checks.hasCommonFakeName ? 'Common fake name detected' : 'Name looks unique'}`);
      console.log(`      ${checks.hasFakeCompany ? '❌' : '✅'} ${checks.hasFakeCompany ? 'Generic company name' : 'Company name looks specific'}`);
      console.log(`      ${checks.hasFakeSource ? '❌' : '✅'} ${checks.hasFakeSource ? 'Fake source URL' : 'Source URL looks real'}`);
      console.log(`      ${checks.hasRealSource ? '✅' : '⚠️'} ${checks.hasRealSource ? 'Recognized news source' : 'Unknown news source'}`);
      console.log(`   Overall: ${looksReal ? '✅ LOOKS REAL' : '❌ LOOKS FAKE'}`);
      console.log('');
    });

    // Overall analysis
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 REALITY ANALYSIS:\n');
    console.log(`   Real prospects: ${realProspectsCount}/${prospectsData.prospects.length}`);
    console.log(`   Fake prospects: ${fakeProspectsCount}/${prospectsData.prospects.length}`);

    const percentage = Math.round((realProspectsCount / prospectsData.prospects.length) * 100);
    console.log(`   Reality score: ${percentage}%\n`);

    if (realProspectsCount === prospectsData.prospects.length) {
      console.log('🎉 SUCCESS! All prospects appear to be REAL people!\n');
    } else if (realProspectsCount > 0) {
      console.log('⚠️  MIXED RESULTS: Some prospects are real, others appear generic.\n');
    } else {
      console.log('❌ FAILURE: All prospects appear to be generic placeholders.\n');
    }

    console.log('✅ Test completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testAIProspectsLocal().catch(console.error);
