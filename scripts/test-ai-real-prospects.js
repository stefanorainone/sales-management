const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Mock relationships data
const mockRelationships = [
  {
    id: '1',
    name: 'Marco Bianchi',
    role: 'CTO',
    company: 'TechStart Italia',
    strength: 'strong',
    importance: 'high',
    category: 'decision_maker',
    valueBalance: 'balanced',
    lastContact: '2025-01-15',
    nextAction: 'Follow-up su progetto',
    actionsHistory: 5,
    noteCount: 3
  },
  {
    id: '2',
    name: 'Laura Rossi',
    role: 'CEO',
    company: 'Digital Innovation SRL',
    strength: 'developing',
    importance: 'medium',
    category: 'connector',
    valueBalance: 'do_give_more',
    lastContact: '2024-12-20',
    nextAction: null,
    actionsHistory: 2,
    noteCount: 1
  },
  {
    id: '3',
    name: 'Giuseppe Verdi',
    role: 'Direttore Commerciale',
    company: 'Manifattura Avanzata',
    strength: 'weak',
    importance: 'high',
    category: 'decision_maker',
    valueBalance: 'balanced',
    lastContact: '2024-11-10',
    nextAction: 'Incontrare per presentazione',
    actionsHistory: 1,
    noteCount: 0
  }
];

async function testAIRealProspects() {
  console.log('🔍 Testing AI with Real Prospects Generation\n');

  try {
    console.log('📤 Sending request to API with mock relationships...\n');

    const response = await fetch(`${BASE_URL}/api/ai/relationship-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        relationships: mockRelationships
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📥 Response received!\n');

    // Analyze response
    if (!data.suggestions) {
      console.log('❌ No suggestions in response');
      return;
    }

    const { existingRelations, newProspects } = data.suggestions;

    // Test Existing Relations
    console.log('🤝 EXISTING RELATIONS TASKS:\n');
    if (!existingRelations || existingRelations.length === 0) {
      console.log('   ⚠️  No existing relations tasks');
    } else {
      console.log(`   Found: ${existingRelations.length} tasks\n`);
      existingRelations.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.task}`);
        console.log(`      Per: ${task.relazione} (ID: ${task.relazioneId})`);
        console.log(`      Motivo: ${task.motivo}`);
        console.log('');
      });
    }

    // Test New Prospects
    console.log('🎯 NEW PROSPECTS (with Web/News Research):\n');
    if (!newProspects || newProspects.length === 0) {
      console.log('   ⚠️  No new prospects');
    } else {
      console.log(`   Found: ${newProspects.length} prospects\n`);
      newProspects.forEach((prospect, idx) => {
        console.log(`   ${idx + 1}. ${prospect.nome}`);
        console.log(`      Ruolo: ${prospect.ruolo}`);
        console.log(`      Azienda: ${prospect.azienda}`);
        console.log(`      Settore: ${prospect.settore}`);
        console.log(`      Motivo: ${prospect.motivo}`);
        console.log(`      Fonte: ${prospect.fonte}`);

        // Check if it looks like a real prospect
        const looksReal = {
          hasRealName: prospect.nome && !prospect.nome.includes('Esempio') && prospect.nome.split(' ').length >= 2,
          hasRealCompany: prospect.azienda && !prospect.azienda.includes('Esempio') && !prospect.azienda.includes('Example'),
          hasRealSource: prospect.fonte && !prospect.fonte.includes('esempio.com') && (
            prospect.fonte.includes('linkedin.com') ||
            prospect.fonte.includes('ilsole24ore') ||
            prospect.fonte.includes('repubblica.it') ||
            prospect.fonte.includes('corriere.it') ||
            prospect.fonte.includes('techcrunch') ||
            prospect.fonte.includes('startupitalia') ||
            prospect.fonte.includes('forbes') ||
            prospect.fonte.includes('.it') ||
            prospect.fonte.includes('.com')
          )
        };

        const realityScore = Object.values(looksReal).filter(Boolean).length;
        console.log(`      Reality Check: ${looksReal.hasRealName ? '✅' : '❌'} Name, ${looksReal.hasRealCompany ? '✅' : '❌'} Company, ${looksReal.hasRealSource ? '✅' : '❌'} Source (${realityScore}/3)`);
        console.log('');
      });

      // Overall analysis
      const realProspectsCount = newProspects.filter(p => {
        return p.nome && !p.nome.includes('Esempio') &&
               p.azienda && !p.azienda.includes('Esempio') &&
               p.fonte && !p.fonte.includes('esempio.com');
      }).length;

      console.log(`📊 Reality Analysis: ${realProspectsCount}/${newProspects.length} prospects appear to be REAL (not generic examples)\n`);

      if (realProspectsCount === newProspects.length) {
        console.log('🎉 SUCCESS! All prospects are real-world individuals/companies!\n');
      } else if (realProspectsCount > 0) {
        console.log('⚠️  PARTIAL SUCCESS: Some prospects are real, others are generic examples.\n');
      } else {
        console.log('❌ IMPROVEMENT NEEDED: All prospects are generic examples, not real people/companies.\n');
      }
    }

    // Validation
    console.log('📋 VALIDATION:\n');
    const checks = [
      { name: 'Has existing relations tasks', passed: existingRelations && existingRelations.length > 0 },
      { name: 'Has exactly 3 existing relations tasks', passed: existingRelations && existingRelations.length === 3 },
      { name: 'Has new prospects', passed: newProspects && newProspects.length > 0 },
      { name: 'Has exactly 3 new prospects', passed: newProspects && newProspects.length === 3 },
      { name: 'All prospects have required fields', passed: newProspects && newProspects.every(p =>
        p.nome && p.ruolo && p.azienda && p.settore && p.motivo && p.fonte
      ) },
    ];

    checks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const passedCount = checks.filter(c => c.passed).length;
    console.log(`\n   Score: ${passedCount}/${checks.length}\n`);

    console.log('✅ Test completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAIRealProspects();
