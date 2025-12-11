require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Use environment variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in environment variables');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

const db = admin.firestore();

async function checkUserTasks() {
  try {
    console.log('\n=== Checking Users ===');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`\nTotal users: ${usersSnapshot.size}`);

    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.displayName,
        email: data.email,
        role: data.role
      });
      console.log(`\nUser: ${data.displayName} (${data.email})`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Role: ${data.role}`);
    });

    console.log('\n\n=== Checking Tasks ===');

    // Get all tasks
    const tasksSnapshot = await db.collection('tasks').get();
    console.log(`\nTotal tasks: ${tasksSnapshot.size}`);

    if (tasksSnapshot.size === 0) {
      console.log('\n⚠️  NO TASKS FOUND IN DATABASE!');
      return;
    }

    // Group tasks by userId
    const tasksByUser = {};
    tasksSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;

      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }

      tasksByUser[userId].push({
        id: doc.id,
        title: data.title,
        status: data.status,
        type: data.type,
        createdAt: data.createdAt,
        scheduledAt: data.scheduledAt
      });
    });

    // Show tasks per user
    console.log('\n\n=== Tasks Per User ===');
    for (const userId in tasksByUser) {
      const user = users.find(u => u.id === userId);
      const userName = user ? `${user.name} (${user.email})` : 'Unknown User';

      console.log(`\n${userName}`);
      console.log(`  User ID: ${userId}`);
      console.log(`  Tasks: ${tasksByUser[userId].length}`);

      tasksByUser[userId].forEach((task, i) => {
        console.log(`\n  Task ${i + 1}:`);
        console.log(`    ID: ${task.id}`);
        console.log(`    Title: ${task.title}`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Type: ${task.type}`);
        console.log(`    CreatedAt: ${task.createdAt}`);
        console.log(`    ScheduledAt: ${task.scheduledAt}`);
      });
    }

    // Find Stefano Rainone
    console.log('\n\n=== Stefano Rainone Specific Check ===');
    const stefano = users.find(u =>
      u.name?.toLowerCase().includes('stefano') ||
      u.email?.toLowerCase().includes('stefano')
    );

    if (stefano) {
      console.log(`\nFound Stefano:`);
      console.log(`  ID: ${stefano.id}`);
      console.log(`  Name: ${stefano.name}`);
      console.log(`  Email: ${stefano.email}`);
      console.log(`  Role: ${stefano.role}`);

      const stefanoTasks = tasksByUser[stefano.id] || [];
      console.log(`\n  Tasks for Stefano: ${stefanoTasks.length}`);

      if (stefanoTasks.length === 0) {
        console.log('\n  ⚠️  NO TASKS FOUND FOR STEFANO!');
      }
    } else {
      console.log('\n  ⚠️  STEFANO RAINONE NOT FOUND IN DATABASE!');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkUserTasks();
