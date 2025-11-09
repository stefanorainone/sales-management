const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function checkRelationships() {
  try {
    console.log('🔍 Checking relationships in Firestore...\n');

    const snapshot = await db.collection('relationships').get();

    if (snapshot.empty) {
      console.log('✅ No relationships found in database (clean state)');
      return;
    }

    console.log(`📊 Found ${snapshot.size} relationships:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  User: ${data.userId}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Company: ${data.company}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  Created: ${data.createdAt?.toDate?.()}`);
      console.log('---');
    });

    console.log('\n💡 To delete all relationships, run: node scripts/delete-all-relationships.js');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRelationships();
