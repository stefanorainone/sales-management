/**
 * Script per creare il primo utente amministratore
 * Esegui con: node scripts/create-admin-user.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

async function createAdminUser() {
  try {
    console.log('🔧 Inizializzazione Firebase Admin SDK...');

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase Admin SDK inizializzato\n');

    // Admin user details
    const adminEmail = 'admin@vr.com';
    const adminPassword = 'Admin123!';
    const adminName = 'Amministratore VR';

    console.log('👤 Creazione utente admin...');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Nome: ${adminName}\n`);

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('⚠️  Utente già esistente in Authentication');
      console.log(`   UID: ${userRecord.uid}\n`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user in Firebase Auth
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: adminName,
          emailVerified: true,
        });
        console.log('✅ Utente creato in Firebase Authentication');
        console.log(`   UID: ${userRecord.uid}\n`);
      } else {
        throw error;
      }
    }

    // Create/Update user document in Firestore
    const userDoc = {
      email: adminEmail,
      displayName: adminName,
      role: 'admin',
      team: 'Management',
      createdAt: new Date(),
      createdBy: 'bootstrap_script',
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('✅ Documento utente creato/aggiornato in Firestore\n');

    console.log('🎉 UTENTE ADMIN CREATO CON SUCCESSO!\n');
    console.log('📋 Credenziali per il login:');
    console.log('   Email: ' + adminEmail);
    console.log('   Password: ' + adminPassword);
    console.log('\n🔗 Accedi all\'app: https://sales-management-pzxuyg66lq-ew.a.run.app/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la creazione dell\'utente admin:', error);
    process.exit(1);
  }
}

createAdminUser();
