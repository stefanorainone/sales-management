const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase client SDK (not admin)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllTasks() {
  console.log('🗑️  Starting task deletion process...\n');

  try {
    // Get all tasks
    const tasksCollection = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollection);
    const totalTasks = tasksSnapshot.size;

    if (totalTasks === 0) {
      console.log('✅ No tasks found in the database. Database is already clean!');
      process.exit(0);
    }

    console.log(`📊 Found ${totalTasks} tasks in the database`);
    console.log('⚠️  WARNING: This will delete ALL tasks permanently!\n');

    // Give user 5 seconds to cancel
    console.log('⏳ Starting deletion in 5 seconds... (Press Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔥 Deleting tasks...\n');

    let deletedCount = 0;

    // Delete each document
    for (const docSnapshot of tasksSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
      deletedCount++;

      if (deletedCount % 10 === 0) {
        console.log(`   Deleted ${deletedCount}/${totalTasks} tasks...`);
      }
    }

    console.log('\n✅ SUCCESS! All tasks have been deleted from the database.');
    console.log(`📊 Total tasks deleted: ${deletedCount}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
clearAllTasks();
