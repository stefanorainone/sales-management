const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function deleteAllTasksForStefano() {
  const stefanoUserId = '0FkVMHP21keT6yzQWV3H1Ei4lbt2';

  console.log(`Looking for tasks for Stefano Rainone (userId: ${stefanoUserId})...`);

  try {
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.where('userId', '==', stefanoUserId).get();

    if (snapshot.empty) {
      console.log('No tasks found for Stefano Rainone');
      return;
    }

    console.log(`Found ${snapshot.size} tasks to delete:`);

    // List all tasks before deletion
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.title} (${data.status})`);
    });

    // Delete all tasks in batch
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`\n✅ Successfully deleted ${snapshot.size} tasks for Stefano Rainone!`);
  } catch (error) {
    console.error('Error deleting tasks:', error);
    process.exit(1);
  }
}

deleteAllTasksForStefano()
  .then(() => {
    console.log('\n✅ Deletion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
