const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function migrateRelationshipActionsToActivities() {
  console.log('\n📊 Migration: Azioni Relazioni → Activities\n');

  try {
    // 1. Conta activities esistenti
    console.log('1️⃣ Verifica activities esistenti...');
    const activitiesSnapshot = await db.collection('activities').get();
    console.log(`📊 Activities esistenti: ${activitiesSnapshot.size}`);

    // 2. Trova tutte le relazioni con azioni nello storico
    console.log('\n2️⃣ Analisi relazioni con azioni...');
    const relationshipsSnapshot = await db.collection('relationships').get();
    console.log(`📊 Relazioni totali: ${relationshipsSnapshot.size}`);

    let totalActions = 0;
    let relationsWithActions = 0;
    const relationshipsWithActions = [];

    relationshipsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.actionsHistory && data.actionsHistory.length > 0) {
        relationsWithActions++;
        totalActions += data.actionsHistory.length;
        relationshipsWithActions.push({
          id: doc.id,
          name: data.name,
          company: data.company,
          userId: data.userId,
          actionsHistory: data.actionsHistory,
        });
      }
    });

    console.log(`✅ Relazioni con azioni: ${relationsWithActions}`);
    console.log(`📋 Azioni totali nello storico: ${totalActions}`);

    if (totalActions === 0) {
      console.log('\n✅ Nessuna azione da migrare.');
      return;
    }

    // 3. Chiedi conferma
    console.log('\n3️⃣ Migrazione azioni...');
    console.log(`⚠️  Questo creerà ${totalActions} activities dalla storico delle relazioni.`);

    let createdCount = 0;
    let errorCount = 0;

    // 4. Per ogni relazione con azioni, crea activities
    for (const relation of relationshipsWithActions) {
      console.log(`\n📦 Migrazione azioni per ${relation.name} (${relation.company})...`);

      for (const action of relation.actionsHistory) {
        try {
          // Verifica se l'azione ha già un'activity (per evitare duplicati)
          // Usiamo l'ID dell'azione come riferimento
          const existingActivity = await db.collection('activities')
            .where('userId', '==', relation.userId)
            .where('relationshipId', '==', relation.id)
            .where('title', '==', `${action.action} - ${relation.name}`)
            .limit(1)
            .get();

          if (!existingActivity.empty) {
            console.log(`   ⏭️  Saltata: "${action.action}" (già esistente)`);
            continue;
          }

          // Determina il tipo di azione (se non specificato, usa 'call' come default)
          const actionType = action.type || 'call';

          // Converti la data da ISO string a Timestamp
          const completedAt = action.completedAt
            ? admin.firestore.Timestamp.fromDate(new Date(action.completedAt))
            : admin.firestore.Timestamp.now();

          // Crea l'activity
          await db.collection('activities').add({
            userId: relation.userId,
            type: actionType,
            title: `${action.action} - ${relation.name}`,
            description: action.notes || `${action.action} con ${relation.name} (${relation.company})`,
            status: 'completed',
            relationshipId: relation.id,
            relationshipName: relation.name,
            relationshipCompany: relation.company,
            scheduledAt: completedAt,
            completedAt: completedAt,
            createdAt: completedAt,
            updatedAt: completedAt,
            // Metadata per tracking
            migratedFrom: 'relationship-actions-history',
            originalActionId: action.id,
          });

          createdCount++;
          console.log(`   ✅ Creata: "${action.action}" (tipo: ${actionType})`);

        } catch (error) {
          errorCount++;
          console.error(`   ❌ Errore: "${action.action}"`, error.message);
        }
      }
    }

    // 5. Report finale
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORT FINALE');
    console.log('='.repeat(60));
    console.log(`✅ Activities create: ${createdCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    console.log(`📊 Activities totali ora: ${activitiesSnapshot.size + createdCount}`);
    console.log('='.repeat(60) + '\n');

    // 6. Mostra distribuzione per tipo
    console.log('📊 Distribuzione per tipo di attività:');
    const newActivitiesSnapshot = await db.collection('activities').get();
    const typeCounts = {};
    newActivitiesSnapshot.forEach(doc => {
      const type = doc.data().type || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  } catch (error) {
    console.error('\n❌ ERRORE durante la migrazione:', error);
    throw error;
  }
}

// Esegui la migrazione
migrateRelationshipActionsToActivities()
  .then(() => {
    console.log('\n✅ Migrazione completata con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migrazione fallita:', error);
    process.exit(1);
  });
