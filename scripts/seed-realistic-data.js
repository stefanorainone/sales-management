/**
 * Script per popolare il database con dati realistici
 * Scenario: Azienda italiana specializzata in soluzioni VR/XR per musei, scuole e hotel
 * Esegui con: node scripts/seed-realistic-data.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

const SELLERS_DATA = [
  { name: 'Marco Bianchi', email: 'marco.bianchi@vr.com', password: 'Seller123!', team: 'Nord Italia' },
  { name: 'Sofia Romano', email: 'sofia.romano@vr.com', password: 'Seller123!', team: 'Centro Italia' },
  { name: 'Luca Ferretti', email: 'luca.ferretti@vr.com', password: 'Seller123!', team: 'Sud Italia' },
];

const CLIENTS_DATA = [
  // Musei
  { name: 'Museo Archeologico Nazionale', type: 'museo_pubblico', city: 'Napoli', region: 'Campania', status: 'lead', phone: '+39 081 1234567', email: 'info@mann.it', interest: 'Tour virtuali archeologici' },
  { name: 'Galleria degli Uffizi', type: 'museo_pubblico', city: 'Firenze', region: 'Toscana', status: 'prospect', phone: '+39 055 9876543', email: 'digital@uffizi.it', interest: 'Esperienza VR opere d\'arte' },
  { name: 'Museo Egizio', type: 'museo_pubblico', city: 'Torino', region: 'Piemonte', status: 'customer', phone: '+39 011 5551234', email: 'tech@museoegizio.it', interest: 'Ricostruzione VR tombe egizie' },
  { name: 'MAXXI - Museo Nazionale', type: 'museo_pubblico', city: 'Roma', region: 'Lazio', status: 'lead', phone: '+39 06 3210987', email: 'innovazione@maxxi.art', interest: 'Installazioni AR interattive' },

  // Scuole e Università
  { name: 'Liceo Scientifico Leonardo da Vinci', type: 'scuola', city: 'Milano', region: 'Lombardia', status: 'prospect', phone: '+39 02 4567890', email: 'dirigenza@liceomilano.it', interest: 'Lab VR Scienze e Fisica' },
  { name: 'Università degli Studi di Bologna', type: 'universita', city: 'Bologna', region: 'Emilia-Romagna', status: 'lead', phone: '+39 051 2345678', email: 'innovation@unibo.it', interest: 'Simulazioni mediche VR' },
  { name: 'Istituto Tecnico Industriale Galilei', type: 'scuola', city: 'Roma', region: 'Lazio', status: 'customer', phone: '+39 06 7654321', email: 'lab@itigalilei.it', interest: 'Training sicurezza cantieri VR' },
  { name: 'Politecnico di Torino', type: 'universita', city: 'Torino', region: 'Piemonte', status: 'prospect', phone: '+39 011 0907654', email: 'ricerca@polito.it', interest: 'Design industriale VR/AR' },

  // Hotel e Turismo
  { name: 'Grand Hotel Excelsior', type: 'hotel_lusso', city: 'Venezia', region: 'Veneto', status: 'customer', phone: '+39 041 5267890', email: 'gm@excelsiorvenezia.it', interest: 'Tour VR camere per booking' },
  { name: 'Hotel Roma Imperiale', type: 'hotel_4stelle', city: 'Roma', region: 'Lazio', status: 'lead', phone: '+39 06 4789012', email: 'marketing@romaimperiale.it', interest: 'Esperienza VR attrazioni romane' },
  { name: 'Palazzo Medici Hotel', type: 'hotel_boutique', city: 'Firenze', region: 'Toscana', status: 'prospect', phone: '+39 055 2134567', email: 'direttore@palazzomedici.it', interest: 'Virtual concierge AR' },
  { name: 'Relais Castello di Montecarlo', type: 'hotel_lusso', city: 'Lucca', region: 'Toscana', status: 'customer', phone: '+39 0583 123456', email: 'reservations@castellomontecarlo.it', interest: 'Tour VR castello storico' },

  // Comuni e PA
  { name: 'Comune di Verona', type: 'comune', city: 'Verona', region: 'Veneto', status: 'prospect', phone: '+39 045 8077111', email: 'cultura@comune.verona.it', interest: 'Tour VR Arena e centri storici' },
  { name: 'Regione Toscana - Assessorato Turismo', type: 'regione', city: 'Firenze', region: 'Toscana', status: 'lead', phone: '+39 055 4382111', email: 'turismo@regione.toscana.it', interest: 'Promozione turistica VR' },
  { name: 'Comune di Pompei', type: 'comune', city: 'Pompei', region: 'Campania', status: 'customer', phone: '+39 081 8575347', email: 'scavi@comune.pompei.it', interest: 'Ricostruzione VR Pompei antica' },
];

const SERVICES = {
  'Tour VR': { basePrice: 15000, duration: '2-3 mesi' },
  'Installazione AR': { basePrice: 25000, duration: '3-4 mesi' },
  'Training VR': { basePrice: 20000, duration: '1-2 mesi' },
  'Simulazione 3D': { basePrice: 30000, duration: '4-5 mesi' },
  'App Mobile AR': { basePrice: 18000, duration: '2-3 mesi' },
  'Virtual Showroom': { basePrice: 22000, duration: '2-3 mesi' },
};

async function seedDatabase() {
  try {
    console.log('🚀 Avvio seeding database con dati realistici...\n');

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

    // 1. CREATE SELLERS
    console.log('👤 Creazione venditori...');
    const sellers = [];

    for (const sellerData of SELLERS_DATA) {
      try {
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(sellerData.email);
          console.log(`   ⚠️  ${sellerData.name} già esistente`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email: sellerData.email,
              password: sellerData.password,
              displayName: sellerData.name,
              emailVerified: true,
            });
            console.log(`   ✅ ${sellerData.name} creato`);
          }
        }

        const userDoc = {
          email: sellerData.email,
          displayName: sellerData.name,
          role: 'seller',
          team: sellerData.team,
          createdAt: new Date(),
          goals: { revenue: 150000, deals: 15, activities: 80 },
        };

        await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
        sellers.push({ id: userRecord.uid, ...userDoc });
      } catch (error) {
        console.error(`   ❌ Errore creazione ${sellerData.name}:`, error.message);
      }
    }

    console.log(`\n✅ ${sellers.length} venditori pronti\n`);

    // 2. CREATE CLIENTS & DEALS
    console.log('🏢 Creazione clienti e deals...');
    let clientsCount = 0;
    let dealsCount = 0;

    for (const clientData of CLIENTS_DATA) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];

      const client = {
        userId: seller.id,
        name: clientData.name,
        entityType: clientData.type,
        city: clientData.city,
        region: clientData.region,
        status: clientData.status,
        phone: clientData.phone,
        email: clientData.email,
        source: 'outbound',
        notes: `Interessato a: ${clientData.interest}`,
        lastContactedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        createdBy: seller.id,
      };

      const clientRef = await db.collection('clients').add(client);
      clientsCount++;

      // Create deal if customer or prospect
      if (clientData.status === 'customer' || clientData.status === 'prospect') {
        const serviceKeys = Object.keys(SERVICES);
        const service = serviceKeys[Math.floor(Math.random() * serviceKeys.length)];
        const serviceInfo = SERVICES[service];

        const stages = ['prospect', 'qualification', 'proposal', 'negotiation', 'won'];
        const stage = clientData.status === 'customer'
          ? stages[Math.floor(Math.random() * 3) + 2] // proposal, negotiation, won
          : stages[Math.floor(Math.random() * 2)]; // prospect, qualification

        const deal = {
          userId: seller.id,
          clientId: clientRef.id,
          clientName: clientData.name,
          entityType: clientData.type,
          title: `${service} - ${clientData.name}`,
          stage: stage,
          priority: Math.random() > 0.5 ? 'hot' : 'warm',
          source: 'outbound',
          serviceType: service,
          value: serviceInfo.basePrice + Math.floor(Math.random() * 10000),
          probability: stage === 'won' ? 100 : (stages.indexOf(stage) + 1) * 20,
          expectedCloseDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
          notes: `Progetto: ${clientData.interest}. Durata stimata: ${serviceInfo.duration}`,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };

        await db.collection('deals').add(deal);
        dealsCount++;
      }
    }

    console.log(`   ✅ ${clientsCount} clienti creati`);
    console.log(`   ✅ ${dealsCount} deals creati\n`);

    // 3. CREATE ACTIVITIES
    console.log('📞 Creazione attività recenti...');
    const activities = [];
    const activityTypes = ['call', 'email', 'meeting', 'demo'];
    const outcomes = ['positive', 'neutral', 'follow_up_needed'];

    for (let i = 0; i < 50; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      const activity = {
        userId: seller.id,
        type: activityType,
        title: `${activityType === 'call' ? 'Chiamata' : activityType === 'email' ? 'Email' : activityType === 'meeting' ? 'Incontro' : 'Demo'} con prospect`,
        description: 'Discussione su progetto VR',
        outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
        duration: Math.floor(Math.random() * 60) + 15,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      };

      await db.collection('activities').add(activity);
    }

    console.log(`   ✅ 50 attività create\n`);

    // 4. CREATE TASKS
    console.log('✅ Creazione task...');
    const taskTypes = ['call', 'email', 'meeting', 'demo', 'follow_up'];
    const priorities = ['high', 'medium', 'low'];

    for (const seller of sellers) {
      for (let i = 0; i < 5; i++) {
        const task = {
          userId: seller.id,
          type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          title: `Follow-up con cliente ${Math.floor(Math.random() * 10) + 1}`,
          description: 'Richiamare per aggiornamento su proposta',
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: Math.random() > 0.3 ? 'pending' : 'completed',
          scheduledAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          createdBy: seller.id,
        };

        await db.collection('tasks').add(task);
      }
    }

    console.log(`   ✅ ${sellers.length * 5} task creati\n`);

    console.log('🎉 SEEDING COMPLETATO CON SUCCESSO!\n');
    console.log('📊 Riepilogo:');
    console.log(`   - Venditori: ${sellers.length}`);
    console.log(`   - Clienti: ${clientsCount}`);
    console.log(`   - Deals: ${dealsCount}`);
    console.log(`   - Attività: 50`);
    console.log(`   - Task: ${sellers.length * 5}\n`);

    console.log('🔑 Credenziali venditori:');
    SELLERS_DATA.forEach(s => {
      console.log(`   - ${s.email} / ${s.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
