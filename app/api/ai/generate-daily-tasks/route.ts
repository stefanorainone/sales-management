import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getOpenAI } from '@/lib/ai/openai';

/**
 * POST /api/ai/generate-daily-tasks
 * Genera automaticamente task giornalieri per tutti i venditori
 * Analizza tutto il database: deals, clients, activities, note
 * Crea task personalizzati per ogni venditore per oggi e domani
 */
export async function POST(req: NextRequest) {
  try {
    // Verifica autenticazione admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verifica che sia admin
    const userDoc = await adminDb!.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // 1. Raccogliere TUTTI i dati dal database
    console.log('📊 Collecting all database data...');

    // Ottieni tutti gli utenti venditori
    const usersSnapshot = await adminDb!
      .collection('users')
      .where('role', 'in', ['seller', 'team_leader'])
      .get();

    const sellers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    console.log(`👥 Found ${sellers.length} sellers`);

    // Ottieni tutti i deals
    const dealsSnapshot = await adminDb!.collection('deals').get();
    const allDeals = dealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    console.log(`💼 Found ${allDeals.length} deals`);

    // Ottieni tutti i clienti
    const clientsSnapshot = await adminDb!.collection('clients').get();
    const allClients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    console.log(`👤 Found ${allClients.length} clients`);

    // Ottieni tutte le attività recenti (ultimi 30 giorni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activitiesSnapshot = await adminDb!
      .collection('activities')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const allActivities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    console.log(`✅ Found ${allActivities.length} recent activities`);

    // Ottieni tutti i task esistenti (per non duplicare)
    const existingTasksSnapshot = await adminDb!.collection('tasks').get();
    const existingTasks = existingTasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    console.log(`📋 Found ${existingTasks.length} existing tasks`);

    // 2. Per ogni venditore, genera task personalizzati
    const generatedTasks = [];

    for (const seller of sellers) {
      console.log(`\n🎯 Generating tasks for ${seller.displayName || seller.email}...`);

      // Filtra i dati relativi a questo venditore
      const sellerDeals = allDeals.filter(d => d.userId === seller.id);
      const sellerClients = allClients.filter(c => c.userId === seller.id);
      const sellerActivities = allActivities.filter(a => a.userId === seller.id);
      const sellerTasks = existingTasks.filter(t => t.userId === seller.id && t.status !== 'completed');

      // Costruisci il prompt per l'AI
      const aiPrompt = `Sei un AI Sales Coach esperto. Analizza i dati del venditore e genera task strategici per oggi e domani.

**VENDITORE**
Nome: ${seller.displayName || seller.email}
Email: ${seller.email}

**DEALS ATTIVI** (${sellerDeals.length} totali)
${sellerDeals.slice(0, 20).map(deal => `
- [${deal.stage}] ${deal.title}
  Cliente: ${deal.clientName}
  Priorità: ${deal.priority} | Probabilità: ${deal.probability}%
  Note: ${deal.notes || 'N/A'}
  Last Update: ${new Date(deal.updatedAt).toLocaleDateString('it-IT')}
`).join('\n')}

**CLIENTI** (${sellerClients.length} totali)
${sellerClients.slice(0, 10).map(client => `
- ${client.name} (${client.entityType})
  Contatti: ${client.contacts?.length || 0}
  Note: ${client.notes || 'N/A'}
`).join('\n')}

**ATTIVITÀ RECENTI** (ultimi 30 giorni: ${sellerActivities.length})
${sellerActivities.slice(0, 15).map(activity => `
- [${activity.type}] ${activity.title}
  Deal: ${activity.dealTitle || 'N/A'}
  Outcome: ${activity.outcome || 'N/A'}
  Data: ${new Date(activity.createdAt).toLocaleDateString('it-IT')}
`).join('\n')}

**TASK GIÀ PROGRAMMATI** (${sellerTasks.length})
${sellerTasks.map(task => `
- ${task.title} - ${task.type} (${task.status})
  Scheduled: ${new Date(task.scheduledAt).toLocaleDateString('it-IT')}
`).join('\n')}

---

**ISTRUZIONI**
Genera 3-5 task specifici per OGGI e 2-3 task per DOMANI.

**PRIORITÀ**:
1. Follow-up su deals HOT in stage avanzato (proposal_sent, under_review, verbal_agreement)
2. Chiamate/email per deals con alta probabilità
3. Meeting preparation per meeting schedulati
4. Follow-up su attività recenti senza outcome chiaro
5. Ricerca nuovi prospect nel settore target

**REGOLE**:
- NON duplicare task già esistenti
- Ogni task deve avere un OBIETTIVO CHIARO e MISURABILE
- Includi SEMPRE il nome del cliente/deal nel titolo
- Spiega il "perché" nel rationale
- Assegna priority: critical (deals >80% prob), high (60-80%), medium (<60%)
- Tipo appropriato: call, email, meeting, demo, follow_up, research

**OUTPUT FORMAT**: JSON array di task
\`\`\`json
[
  {
    "type": "call|email|meeting|demo|follow_up|research",
    "title": "Titolo specifico con nome cliente",
    "description": "Descrizione dettagliata dell'azione",
    "aiRationale": "Perché questo task è importante ora",
    "priority": "critical|high|medium|low",
    "scheduledAt": "2025-10-17T10:00:00.000Z", // oggi o domani
    "objectives": ["Obiettivo 1", "Obiettivo 2"],
    "confidence": 75, // probabilità di successo 0-100
    "impactScore": 85, // impatto sul revenue 0-100
    "relatedEntity": {
      "type": "deal|client",
      "id": "deal-id-from-above",
      "name": "Nome cliente/deal"
    }
  }
]
\`\`\`

Genera task SMART e actionable. Rispondi SOLO con il JSON array.`;

      // Chiamata all'AI
      console.log(`🤖 Generating AI tasks for ${seller.displayName}...`);

      const openai = getOpenAI();

      // Check if OpenAI is properly configured
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'sk-placeholder') {
        throw new Error('OPENAI_API_KEY not configured. Please set a valid API key in environment variables.');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
      });

      // Parse la risposta
      const responseText = response.choices[0]?.message?.content || '';

      // Estrai JSON dalla risposta
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error(`❌ No valid JSON found for seller ${seller.id}`);
        continue;
      }

      const tasks = JSON.parse(jsonMatch[0]);

      // 3. Salva i task nel database
      for (const task of tasks) {
        const taskDoc = {
          userId: seller.id,
          type: task.type,
          title: task.title,
          description: task.description,
          aiRationale: task.aiRationale,
          priority: task.priority,
          status: 'pending',
          scheduledAt: task.scheduledAt,
          objectives: task.objectives || [],
          confidence: task.confidence || 70,
          impactScore: task.impactScore || 70,
          relatedEntity: task.relatedEntity,
          clientName: task.relatedEntity?.name || '',
          dealTitle: task.relatedEntity?.type === 'deal' ? task.relatedEntity.name : '',
          createdAt: new Date(),
          createdBy: 'ai_daily_generation',
        };

        const docRef = await adminDb!.collection('tasks').add(taskDoc);
        generatedTasks.push({ id: docRef.id, ...taskDoc });
      }

      console.log(`✅ Generated ${tasks.length} tasks for ${seller.displayName}`);
    }

    // 4. Return summary
    return NextResponse.json({
      success: true,
      summary: {
        sellersProcessed: sellers.length,
        tasksGenerated: generatedTasks.length,
        timestamp: new Date().toISOString(),
      },
      tasks: generatedTasks,
    });

  } catch (error: any) {
    console.error('Error generating daily tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
