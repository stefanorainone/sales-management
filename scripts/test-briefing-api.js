const https = require('https');

const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';
const STEFANO_ID = 'Kz7cWVJS8mZTLkFyQbdaKndX8yH2';

async function testBriefingAPI() {
  console.log('\n🚀 Testing Briefing API for Stefano...\n');

  // Simulate what the /today page does
  const today = new Date().toISOString().split('T')[0];

  const postData = JSON.stringify({
    userId: STEFANO_ID,
    userName: 'Stefano Rainone',
    deals: [], // Empty deals for now
    clients: [], // Empty clients for now
    recentActivities: [],
    date: today
  });

  const options = {
    hostname: 'sales-crm-412055180465.europe-west1.run.app',
    port: 443,
    path: '/api/ai/briefing',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`\nResponse:\n`);

        try {
          const response = JSON.parse(data);
          console.log(JSON.stringify(response, null, 2));

          console.log('\n' + '='.repeat(60));
          console.log('ANALYSIS');
          console.log('='.repeat(60));
          console.log(`Tasks returned: ${response.tasks?.length || 0}`);

          if (response.tasks && response.tasks.length > 0) {
            console.log('\n✅ Tasks found in API response:');
            response.tasks.forEach((task, i) => {
              console.log(`\n${i + 1}. ${task.title}`);
              console.log(`   Type: ${task.type}`);
              console.log(`   Status: ${task.status}`);
              console.log(`   Priority: ${task.priority}`);
              console.log(`   Scheduled: ${task.scheduledAt}`);
              console.log(`   Created: ${task.createdAt}`);
            });
          } else {
            console.log('\n❌ No tasks found in API response!');
            console.log('This means the AI service is not loading tasks from Firestore correctly.');
          }

          console.log('\n' + '='.repeat(60) + '\n');

          resolve(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testBriefingAPI().catch(console.error);
