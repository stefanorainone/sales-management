require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

(async () => {
  console.log('🔍 Checking ALL activities in database (both formats)...\n');

  // Get all activities without ordering
  const snapshot = await db.collection('activities').get();

  console.log(`📊 Total activities found: ${snapshot.size}\n`);

  if (snapshot.empty) {
    console.log('❌ No activities in database!');
    process.exit(0);
  }

  const oldFormat = [];
  const newFormat = [];
  const unknown = [];

  snapshot.docs.forEach((doc) => {
    const d = doc.data();

    // New format has action + timestamp
    if (d.action && d.timestamp) {
      newFormat.push({ id: doc.id, ...d });
    }
    // Old format has type + createdAt
    else if (d.type && d.createdAt) {
      oldFormat.push({ id: doc.id, ...d });
    }
    // Unknown format
    else {
      unknown.push({ id: doc.id, ...d });
    }
  });

  console.log(`📈 Format breakdown:`);
  console.log(`   ✨ New format (action/timestamp): ${newFormat.length}`);
  console.log(`   📦 Old format (type/createdAt): ${oldFormat.length}`);
  console.log(`   ❓ Unknown format: ${unknown.length}\n`);

  if (newFormat.length > 0) {
    console.log('✨ NEW FORMAT SAMPLES (first 3):');
    newFormat.slice(0, 3).forEach((a, i) => {
      const timestamp = a.timestamp?.toDate?.() || a.timestamp;
      console.log(`   ${i+1}. [${a.action}] ${a.entityType} - ${a.userName} - ${timestamp}`);
    });
    console.log('');
  }

  if (oldFormat.length > 0) {
    console.log('📦 OLD FORMAT SAMPLES (first 5):');
    oldFormat.slice(0, 5).forEach((a, i) => {
      const timestamp = a.createdAt?.toDate?.() || a.createdAt;
      console.log(`   ${i+1}. [${a.type}] "${a.title}" - User: ${a.userId} - ${timestamp}`);
      if (a.description) console.log(`      Description: ${a.description.substring(0, 60)}...`);
    });
    console.log('');
  }

  if (unknown.length > 0) {
    console.log('❓ UNKNOWN FORMAT SAMPLES:');
    unknown.slice(0, 3).forEach((a, i) => {
      console.log(`   ${i+1}. ID: ${a.id}, Fields: ${Object.keys(a).join(', ')}`);
    });
    console.log('');
  }

  // Show type distribution for old format
  if (oldFormat.length > 0) {
    const typeCount = {};
    oldFormat.forEach(a => {
      typeCount[a.type] = (typeCount[a.type] || 0) + 1;
    });

    console.log('📊 Old format activity types:');
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
  }

  process.exit(0);
})();
