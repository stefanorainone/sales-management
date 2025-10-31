/**
 * Script per verificare gli utenti nel database Firestore
 * Esegui con: node scripts/check-users.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.production' });

async function checkUsers() {
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

    // Get all users from Firestore
    console.log('👥 Recupero utenti da Firestore...\n');
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('⚠️  Nessun utente trovato in Firestore');
      process.exit(0);
    }

    console.log(`📋 Trovati ${usersSnapshot.size} utenti:\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID: ${userDoc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Nome: ${userData.displayName}`);
      console.log(`Ruolo: ${userData.role}`);
      console.log(`Team: ${userData.team || 'N/A'}`);
      console.log(`Creato: ${userData.createdAt?.toDate?.() || userData.createdAt || 'N/A'}`);

      // Check Firebase Auth
      try {
        const authUser = await auth.getUser(userDoc.id);
        console.log(`Auth displayName: ${authUser.displayName || 'N/A'}`);
      } catch (e) {
        console.log('Auth: Non trovato');
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la verifica degli utenti:', error);
    process.exit(1);
  }
}

checkUsers();
