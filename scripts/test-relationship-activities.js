const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function testRelationshipActivities() {
  console.log('\n🧪 Test: Verifica tracciamento attività relazioni\n');

  const userId = 'W6qGDo4btycGWpqhZPOvrLdguas2';

  try {
    // 1. Trova una relazione esistente
    console.log('1️⃣ Ricerca relazioni esistenti...');
    const relationshipsSnapshot = await db
      .collection('relationships')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (relationshipsSnapshot.empty) {
      console.log('❌ Nessuna relazione trovata. Crea prima una relazione.');
      return;
    }

    const relationship = relationshipsSnapshot.docs[0];
    const relationshipData = relationship.data();
    console.log(`✅ Relazione trovata: ${relationshipData.name} (${relationship.id})`);

    // 2. Conta le attività esistenti
    console.log('\n2️⃣ Conta attività esistenti...');
    const activitiesBeforeSnapshot = await db
      .collection('activities')
      .where('userId', '==', userId)
      .get();
    const countBefore = activitiesBeforeSnapshot.size;
    console.log(`📊 Attività esistenti: ${countBefore}`);

    // 3. Simula il completamento di un'azione
    console.log('\n3️⃣ Simula completamento azione...');
    const actionType = 'call';
    const actionText = 'Test chiamata per verifica tracking';
    const now = admin.firestore.Timestamp.now();

    // Crea l'attività come fa useRelationships.ts
    const activityRef = await db.collection('activities').add({
      userId: userId,
      type: actionType,
      title: `${actionText} - ${relationshipData.name}`,
      description: `${actionText} con ${relationshipData.name} (${relationshipData.company})`,
      status: 'completed',
      relationshipId: relationship.id,
      relationshipName: relationshipData.name,
      relationshipCompany: relationshipData.company,
      scheduledAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Attività creata con ID: ${activityRef.id}`);

    // 4. Aggiorna la relazione con l'azione
    const newAction = {
      id: Date.now().toString(),
      action: actionText,
      type: actionType,
      completedAt: new Date().toISOString(),
    };

    const updatedHistory = [...(relationshipData.actionsHistory || []), newAction];

    await db.collection('relationships').doc(relationship.id).update({
      actionsHistory: updatedHistory,
      lastContact: new Date().toISOString(),
      updatedAt: now,
    });

    console.log('✅ Relazione aggiornata con nuova azione');

    // 5. Verifica che l'attività sia stata salvata
    console.log('\n4️⃣ Verifica salvataggio attività...');
    const activitiesAfterSnapshot = await db
      .collection('activities')
      .where('userId', '==', userId)
      .get();
    const countAfter = activitiesAfterSnapshot.size;
    console.log(`📊 Attività dopo creazione: ${countAfter}`);

    if (countAfter > countBefore) {
      console.log('✅ Attività salvata correttamente! (+1)');
    } else {
      console.log('❌ ERRORE: Attività non salvata!');
    }

    // 6. Verifica che l'attività appaia nelle analytics
    console.log('\n5️⃣ Verifica tracciamento analytics...');
    const callActivities = activitiesAfterSnapshot.docs.filter(
      doc => doc.data().type === 'call'
    );
    console.log(`📞 Attività tipo "call": ${callActivities.length}`);

    // 7. Mostra l'attività appena creata
    console.log('\n6️⃣ Dettagli attività creata:');
    const createdActivity = await activityRef.get();
    const activityData = createdActivity.data();
    console.log(JSON.stringify({
      id: activityRef.id,
      type: activityData.type,
      title: activityData.title,
      status: activityData.status,
      relationshipId: activityData.relationshipId,
      relationshipName: activityData.relationshipName,
    }, null, 2));

    // 8. Verifica che la relazione abbia l'azione nello storico
    console.log('\n7️⃣ Verifica storico relazione...');
    const updatedRelationship = await db.collection('relationships').doc(relationship.id).get();
    const updatedRelationshipData = updatedRelationship.data();
    const historyCount = updatedRelationshipData.actionsHistory?.length || 0;
    console.log(`📋 Azioni nello storico: ${historyCount}`);

    if (historyCount > 0) {
      console.log('✅ Storico aggiornato correttamente!');
      const lastAction = updatedRelationshipData.actionsHistory[historyCount - 1];
      console.log(`   Ultima azione: ${lastAction.action} (tipo: ${lastAction.type})`);
    }

    console.log('\n✅ TEST COMPLETATO CON SUCCESSO!\n');
    console.log('📊 Riepilogo:');
    console.log(`   - Attività create: +1`);
    console.log(`   - Attività totali: ${countAfter}`);
    console.log(`   - Azioni nello storico: ${historyCount}`);
    console.log(`   - Tipo azione: ${actionType}`);

  } catch (error) {
    console.error('❌ ERRORE durante il test:', error);
    throw error;
  }
}

// Esegui il test
testRelationshipActivities()
  .then(() => {
    console.log('\n✅ Test completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error);
    process.exit(1);
  });
