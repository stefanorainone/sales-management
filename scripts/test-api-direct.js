const https = require('https');

const PROD_URL = 'https://sales-crm-412055180465.europe-west1.run.app';

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
  }
];

async function testApiDirect() {
  console.log('🔍 Testing API /api/ai/relationship-suggestions directly\n');
  console.log(`📍 URL: ${PROD_URL}/api/ai/relationship-suggestions\n`);

  const postData = JSON.stringify({
    relationships: mockRelationships
  });

  const url = new URL(`${PROD_URL}/api/ai/relationship-suggestions`);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📤 Sending request to API...\n');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`📥 Response status: ${res.statusCode}\n`);

          if (res.statusCode !== 200) {
            console.log(`❌ API returned error status: ${res.statusCode}`);
            console.log(`Response: ${data}\n`);
            reject(new Error(`API returned ${res.statusCode}`));
            return;
          }

          const response = JSON.parse(data);

          console.log('✅ Response received!\n');

          if (response.error) {
            console.log(`⚠️  API returned error: ${response.error}\n`);
          }

          if (!response.suggestions) {
            console.log('❌ No suggestions in response\n');
            resolve();
            return;
          }

          const { existingRelations, newProspects } = response.suggestions;

          // Test New Prospects
          console.log('🎯 NEW PROSPECTS:\n');
          if (!newProspects || newProspects.length === 0) {
            console.log('   ⚠️  No new prospects\n');
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
                  prospect.fonte.includes('startupitalia') ||
                  prospect.fonte.includes('forbes')
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

            console.log(`📊 Reality Analysis: ${realProspectsCount}/${newProspects.length} prospects appear to be REAL\n`);

            if (realProspectsCount === newProspects.length) {
              console.log('🎉 SUCCESS! All prospects from API are real-world individuals/companies!\n');
            } else if (realProspectsCount > 0) {
              console.log('⚠️  PARTIAL SUCCESS: Some prospects are real, others are generic examples.\n');
            } else {
              console.log('❌ FAILURE: API is returning generic placeholder data.\n');
              console.log('💡 This means either:\n');
              console.log('   1. OpenAI is ignoring our prompt\n');
              console.log('   2. The API key is not working\n');
              console.log('   3. The prompt needs to be more explicit\n');
            }
          }

          resolve();
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testApiDirect().catch(console.error);
