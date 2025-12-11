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

async function testAISuggestionsNew() {
  console.log('🔍 Testing New AI Suggestions Structure\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/relazioni`, { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for AI widget to load
    await new Promise(r => setTimeout(r, 3000));

    console.log('📊 Testing AI Suggestions Widget Structure...\n');

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

    // Extract widget data
    const widgetData = await page.evaluate(() => {
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');
      if (!widget) return null;

      const result = {
        title: '',
        sections: [],
        existingRelations: [],
        newProspects: []
      };

      // Get widget title
      const titleEl = widget.querySelector('h3');
      result.title = titleEl?.textContent?.trim() || '';

      // Find sections by their headers
      const headers = Array.from(widget.querySelectorAll('h4'));

      headers.forEach(header => {
        const headerText = header.textContent?.trim() || '';
        result.sections.push(headerText);

        // Get cards in this section
        let currentNode = header.nextElementSibling;
        while (currentNode && currentNode.tagName !== 'H4') {
          if (currentNode.classList && currentNode.classList.toString().includes('space-y')) {
            // This is the container with cards
            const cards = Array.from(currentNode.querySelectorAll('[class*="bg-white"][class*="rounded-lg"]'));

            if (headerText.includes('Rafforza Relazioni Esistenti') || headerText.includes('🤝')) {
              cards.forEach(card => {
                const taskEl = card.querySelector('.font-semibold, .font-bold');
                const relationEl = Array.from(card.querySelectorAll('div')).find(el =>
                  el.textContent?.trim().startsWith('Per:')
                );
                const motivoEl = Array.from(card.querySelectorAll('div')).find(el =>
                  el.textContent?.includes('Motivo:')
                );

                result.existingRelations.push({
                  task: taskEl?.textContent?.trim() || '',
                  relazione: relationEl?.textContent?.replace('Per:', '').trim() || '',
                  motivo: motivoEl?.textContent?.replace('Motivo:', '').trim() || '',
                  hasPriority: card.textContent?.includes('ALTA') || card.textContent?.includes('MEDIA') || card.textContent?.includes('BASSA')
                });
              });
            } else if (headerText.includes('Nuovi Prospect') || headerText.includes('🎯')) {
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

                result.newProspects.push({
                  nome: nomeEl?.textContent?.trim() || '',
                  ruolo: parts[0]?.trim() || '',
                  azienda: parts[1]?.trim() || '',
                  settore: settoreEl?.textContent?.replace('Settore:', '').trim() || '',
                  motivo: motivoEl?.textContent?.replace('Perché contattare:', '').trim() || '',
                  hasFonte: !!fonteEl,
                  fonteUrl: fonteEl?.href || ''
                });
              });
            }
          }
          currentNode = currentNode.nextElementSibling;
        }
      });

      return result;
    });

    if (!widgetData) {
      console.log('❌ Could not extract widget data');
      await browser.close();
      return;
    }

    console.log(`📝 Widget Title: "${widgetData.title}"\n`);

    console.log('📋 Sections Found:');
    widgetData.sections.forEach((section, idx) => {
      console.log(`   ${idx + 1}. ${section}`);
    });
    console.log('');

    // Check for old priority system (should NOT exist)
    const hasPriorityBadges = widgetData.existingRelations.some(t => t.hasPriority);
    if (hasPriorityBadges) {
      console.log('⚠️  WARNING: Found old priority badges (ALTA/MEDIA/BASSA) - should be removed!\n');
    } else {
      console.log('✅ No priority badges found (correct - priority system removed)\n');
    }

    // Test Existing Relations section
    console.log('🤝 RAFFORZA RELAZIONI ESISTENTI:\n');
    if (widgetData.existingRelations.length === 0) {
      console.log('   ⚠️  No existing relations tasks found');
    } else {
      console.log(`   Found: ${widgetData.existingRelations.length} tasks\n`);
      widgetData.existingRelations.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.task}`);
        console.log(`      Per: ${task.relazione}`);
        console.log(`      Motivo: ${task.motivo.substring(0, 80)}${task.motivo.length > 80 ? '...' : ''}`);
        console.log('');
      });
    }

    // Test New Prospects section
    console.log('🎯 NUOVI PROSPECT DA CONTATTARE:\n');
    if (widgetData.newProspects.length === 0) {
      console.log('   ⚠️  No new prospects found');
    } else {
      console.log(`   Found: ${widgetData.newProspects.length} prospects\n`);
      widgetData.newProspects.forEach((prospect, idx) => {
        console.log(`   ${idx + 1}. ${prospect.nome}`);
        console.log(`      Ruolo: ${prospect.ruolo}`);
        console.log(`      Azienda: ${prospect.azienda}`);
        console.log(`      Settore: ${prospect.settore}`);
        console.log(`      Motivo: ${prospect.motivo.substring(0, 80)}${prospect.motivo.length > 80 ? '...' : ''}`);
        console.log(`      Fonte: ${prospect.hasFonte ? '✅ Present' : '❌ Missing'} ${prospect.fonteUrl ? `(${prospect.fonteUrl.substring(0, 40)}...)` : ''}`);
        console.log('');
      });
    }

    // Validation summary
    console.log('📊 VALIDATION SUMMARY:\n');

    const checks = [
      {
        name: 'Widget exists',
        passed: widgetExists,
      },
      {
        name: 'Has "Rafforza Relazioni Esistenti" section',
        passed: widgetData.sections.some(s => s.includes('Rafforza Relazioni Esistenti') || s.includes('🤝')),
      },
      {
        name: 'Has "Nuovi Prospect" section',
        passed: widgetData.sections.some(s => s.includes('Nuovi Prospect') || s.includes('🎯')),
      },
      {
        name: 'No old priority badges (ALTA/MEDIA/BASSA)',
        passed: !hasPriorityBadges,
      },
      {
        name: 'Has existing relations tasks',
        passed: widgetData.existingRelations.length > 0,
      },
      {
        name: 'Has 3 existing relations tasks',
        passed: widgetData.existingRelations.length === 3,
      },
      {
        name: 'Has new prospects',
        passed: widgetData.newProspects.length > 0,
      },
      {
        name: 'Has 3 new prospects',
        passed: widgetData.newProspects.length === 3,
      },
      {
        name: 'All prospects have nome',
        passed: widgetData.newProspects.every(p => p.nome.length > 0),
      },
      {
        name: 'All prospects have ruolo',
        passed: widgetData.newProspects.every(p => p.ruolo.length > 0),
      },
      {
        name: 'All prospects have azienda',
        passed: widgetData.newProspects.every(p => p.azienda.length > 0),
      },
      {
        name: 'All prospects have settore',
        passed: widgetData.newProspects.every(p => p.settore.length > 0),
      },
      {
        name: 'All prospects have motivo',
        passed: widgetData.newProspects.every(p => p.motivo.length > 0),
      },
      {
        name: 'All prospects have fonte link',
        passed: widgetData.newProspects.every(p => p.hasFonte),
      },
    ];

    checks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const passedCount = checks.filter(c => c.passed).length;
    const totalCount = checks.length;
    const passPercentage = Math.round((passedCount / totalCount) * 100);

    console.log(`\n   Score: ${passedCount}/${totalCount} (${passPercentage}%)\n`);

    if (passPercentage === 100) {
      console.log('🎉 All tests passed! New AI Suggestions structure is working perfectly!\n');
    } else if (passPercentage >= 80) {
      console.log('✅ Most tests passed! Minor issues to fix.\n');
    } else {
      console.log('⚠️  Several tests failed. Please review the implementation.\n');
    }

    // Test mobile responsiveness
    console.log('📱 Testing Mobile Responsiveness...\n');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 1000));

    const mobileOverflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const widget = document.querySelector('[class*="from-purple-50"]') ||
                     document.querySelector('[class*="to-blue-50"]');

      return {
        bodyWidth: body.scrollWidth,
        viewportWidth: window.innerWidth,
        hasOverflow: body.scrollWidth > window.innerWidth,
        widgetWidth: widget ? widget.scrollWidth : 0,
      };
    });

    console.log(`   Viewport: ${mobileOverflow.viewportWidth}px`);
    console.log(`   Body width: ${mobileOverflow.bodyWidth}px`);
    console.log(`   Widget width: ${mobileOverflow.widgetWidth}px`);
    console.log(`   Overflow: ${mobileOverflow.hasOverflow ? '❌ YES' : '✅ NO'}\n`);

    if (!mobileOverflow.hasOverflow) {
      console.log('✅ Mobile responsive: No horizontal overflow!\n');
    } else {
      console.log('⚠️  Mobile responsive: Horizontal overflow detected!\n');
    }

    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testAISuggestionsNew().catch(console.error);
