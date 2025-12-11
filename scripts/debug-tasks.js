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

async function debugTasks() {
  console.log('🔍 Debug Tasks Script\n');

  // 1. Get all users
  console.log('📋 Step 1: Fetching all users...');
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    email: doc.data().email,
    displayName: doc.data().displayName,
    role: doc.data().role,
  }));

  console.log(`\nFound ${users.length} users:`);
  users.forEach(user => {
    console.log(`  - ${user.displayName || 'No name'} (${user.email}) - ID: ${user.id} - Role: ${user.role}`);
  });

  // 2. Find Flavio's user ID
  const flavio = users.find(u =>
    u.email?.toLowerCase().includes('flavio') ||
    u.displayName?.toLowerCase().includes('flavio')
  );

  if (!flavio) {
    console.log('\n❌ User "flavio" not found!');
    console.log('Available users:');
    users.forEach(user => console.log(`  - ${user.email} (${user.displayName})`));
    process.exit(1);
  }

  console.log(`\n✅ Found Flavio: ${flavio.email} (ID: ${flavio.id})`);

  // 3. Get all tasks for Flavio
  console.log(`\n📋 Step 2: Fetching ALL tasks for Flavio (${flavio.id})...`);
  const allTasksSnapshot = await db.collection('tasks')
    .where('userId', '==', flavio.id)
    .get();

  console.log(`\nFound ${allTasksSnapshot.size} total tasks for Flavio:`);

  if (allTasksSnapshot.empty) {
    console.log('❌ No tasks found for this user!');
    console.log('\nLet\'s check if there are tasks with a different userId...\n');

    // Check all tasks
    const allTasksGlobal = await db.collection('tasks').get();
    console.log(`Total tasks in database: ${allTasksGlobal.size}`);

    const tasksByUser = {};
    allTasksGlobal.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }
      tasksByUser[userId].push({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status,
      });
    });

    console.log('\nTasks by userId:');
    Object.entries(tasksByUser).forEach(([userId, tasks]) => {
      const user = users.find(u => u.id === userId);
      console.log(`\n  userId: ${userId}`);
      console.log(`  User: ${user?.displayName || user?.email || 'Unknown'}`);
      console.log(`  Tasks count: ${tasks.length}`);
      tasks.forEach(task => {
        console.log(`    - [${task.status}] ${task.title} (${task.id})`);
      });
    });

    process.exit(0);
  }

  allTasksSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const scheduledDate = data.scheduledAt?.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt);
    console.log(`\n  Task ID: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Priority: ${data.priority}`);
    console.log(`  Scheduled: ${scheduledDate.toISOString()}`);
    console.log(`  Created by: ${data.createdBy || 'unknown'}`);
  });

  // 4. Get pending tasks only
  console.log(`\n📋 Step 3: Fetching PENDING tasks for Flavio...`);
  const pendingTasksSnapshot = await db.collection('tasks')
    .where('userId', '==', flavio.id)
    .where('status', '==', 'pending')
    .get();

  console.log(`\nFound ${pendingTasksSnapshot.size} pending tasks`);

  if (pendingTasksSnapshot.size === 0) {
    console.log('⚠️ No pending tasks! This is why they don\'t show up in /today page.');
    console.log('The /today page only shows tasks with status="pending"');
  }

  console.log('\n✅ Debug complete!');
  process.exit(0);
}

debugTasks().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
