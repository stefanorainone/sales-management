const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function deleteAllRelationships() {
  try {
    console.log('🗑️  Deleting all relationships from Firestore...\n');

    const snapshot = await db.collection('relationships').get();

    if (snapshot.empty) {
      console.log('✅ No relationships to delete');
      return;
    }

    console.log(`Found ${snapshot.size} relationships to delete\n`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      console.log(`Queued for deletion: ${doc.data().name} (${doc.id})`);
    });

    await batch.commit();

    console.log(`\n✅ Successfully deleted ${count} relationships`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteAllRelationships();
