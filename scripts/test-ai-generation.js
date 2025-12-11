require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function testAIGeneration() {
  console.log('🧪 Testing AI Task Generation\n');

  try {
    // 1. Find a seller user
    console.log('📋 Step 1: Finding seller user...');
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No seller users found. Creating a test seller...');
      const sellerRef = db.collection('users').doc();
      await sellerRef.set({
        email: 'test-seller@example.com',
        displayName: 'Test Seller',
        role: 'seller',
        createdAt: new Date(),
      });
      console.log('✅ Test seller created:', sellerRef.id);

      // Use this new seller
      const sellerId = sellerRef.id;

      // Call API to generate tasks
      console.log('\n📋 Step 2: Calling AI task generation API...');
      const response = await fetch('http://localhost:3001/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('❌ API Error:', data.error);
        console.log('Full response:', JSON.stringify(data, null, 2));
        process.exit(1);
      }

      console.log('✅ Tasks generated successfully!');
      console.log(`   - Tasks count: ${data.tasksGenerated}`);
      console.log(`   - Tasks:`, JSON.stringify(data.tasks.map(t => ({ title: t.title, type: t.type, priority: t.priority })), null, 2));

      process.exit(0);
    }

    const sellerDoc = usersSnapshot.docs[0];
    const sellerId = sellerDoc.id;
    const seller = sellerDoc.data();

    console.log(`✅ Found seller: ${seller.displayName || seller.email} (ID: ${sellerId})`);

    // 2. Check existing tasks
    console.log('\n📋 Step 2: Checking existing tasks...');
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', sellerId)
      .get();

    console.log(`   Found ${tasksSnapshot.size} existing tasks`);

    // 3. Call API to generate new tasks
    console.log('\n📋 Step 3: Calling AI task generation API...');
    const response = await fetch('http://localhost:3001/api/ai/generate-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API Error:', data.error);
      console.log('Full response:', JSON.stringify(data, null, 2));

      // Check if it's an OpenAI API key error
      if (data.error && data.error.toLowerCase().includes('api key')) {
        console.log('\n🔑 PROBLEMA: API Key OpenAI non valida o scaduta!');
        console.log('   Verifica che OPENAI_API_KEY in .env.local sia corretta e valida.');
        console.log('   Puoi ottenere una nuova API key da: https://platform.openai.com/api-keys');
      }

      process.exit(1);
    }

    console.log('✅ Tasks generated successfully!');
    console.log(`   - Tasks count: ${data.tasksGenerated}`);
    console.log(`   - Success: ${data.success}`);

    if (data.tasks && data.tasks.length > 0) {
      console.log('\n📝 Generated tasks:');
      data.tasks.forEach((task, i) => {
        console.log(`   ${i + 1}. [${task.priority}] ${task.title} (${task.type})`);
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('   La generazione AI funziona correttamente.');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);

    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Il server dev non è in esecuzione. Avvialo con: npm run dev');
    }

    process.exit(1);
  }

  process.exit(0);
}

testAIGeneration();
