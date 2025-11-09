const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function deleteRelationshipsForUser(userEmail) {
  try {
    console.log(`🔍 Finding user: ${userEmail}...`);

    // Get user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', userEmail)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found');
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    console.log(`✅ Found user with ID: ${userId}\n`);

    console.log('🔍 Finding relationships...');
    const relationshipsSnapshot = await db.collection('relationships')
      .where('userId', '==', userId)
      .get();

    if (relationshipsSnapshot.empty) {
      console.log('✅ No relationships found for this user (already clean)\n');
      return;
    }

    console.log(`📊 Found ${relationshipsSnapshot.size} relationship(s):\n`);

    relationshipsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.name} - ${data.company} (${doc.id})`);
    });

    console.log('\n🗑️  Deleting relationships...');

    const batch = db.batch();
    relationshipsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${relationshipsSnapshot.size} relationship(s)\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run for the user
const userEmail = process.argv[2] || 'stefanorainone@gmail.com';
deleteRelationshipsForUser(userEmail).then(() => {
  process.exit(0);
});
