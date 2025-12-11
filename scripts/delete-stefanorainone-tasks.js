const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteAllTasksForUser(userId) {
  try {
    console.log(`Looking for tasks for user: ${userId}...`);

    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.where('userId', '==', userId).get();

    if (snapshot.empty) {
      console.log(`No tasks found for user ${userId}`);
      return;
    }

    console.log(`Found ${snapshot.size} tasks for user ${userId}`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      console.log(`  - Deleting task: ${doc.id} - "${doc.data().title}"`);
      batch.delete(doc.ref);
      count++;

      // Firestore batch limit is 500, commit and create new batch if needed
      if (count % 450 === 0) {
        batch.commit();
        batch = db.batch();
      }
    });

    // Commit remaining deletes
    if (count % 450 !== 0) {
      await batch.commit();
    }

    console.log(`\n✅ Successfully deleted ${count} tasks for user ${userId}`);

  } catch (error) {
    console.error('Error deleting tasks:', error);
    throw error;
  }
}

// Run the deletion
deleteAllTasksForUser('stefanorainone')
  .then(() => {
    console.log('\n✅ Deletion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
