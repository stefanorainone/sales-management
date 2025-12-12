import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getOpenAI } from '@/lib/ai/openai';

/**
 * GET/POST /api/cron/daily-automation
 *
 * Esegue le operazioni automatizzate giornaliere:
 * 1. Genera task per tutti i venditori
 * 2. Ricerca nuovi prospect (opzionale, basato su configurazione)
 *
 * Questo endpoint può essere chiamato da:
 * - Google Cloud Scheduler (produzione)
 * - External cron service (cron-job.org, etc.)
 * - GitHub Actions
 *
 * Sicurezza: Richiede un segreto CRON_SECRET nell'header
 */
export async function GET(req: NextRequest) {
  return handleCronJob(req);
}

export async function POST(req: NextRequest) {
  return handleCronJob(req);
}

async function handleCronJob(req: NextRequest) {
  try {
    // Verifica che la richiesta provenga da una fonte autorizzata
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verifica il segreto
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Starting daily automation...');

    // 1. GENERA TASK GIORNALIERI PER TUTTI I VENDITORI
    console.log('\n📋 Step 1: Generating daily tasks for all sellers...');

    const usersSnapshot = await adminDb!
      .collection('users')
      .where('role', 'in', ['seller', 'team_leader'])
      .get();

    const sellers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Raccogli dati dal database
    const dealsSnapshot = await adminDb!.collection('deals').get();
    const allDeals = dealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const clientsSnapshot = await adminDb!.collection('clients').get();
    const allClients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activitiesSnapshot = await adminDb!
      .collection('activities')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const allActivities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const existingTasksSnapshot = await adminDb!.collection('tasks').get();
    const existingTasks = existingTasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const generatedTasks = [];

    // Genera task per ogni venditore
    for (const seller of sellers) {
      const sellerDeals = allDeals.filter(d => d.userId === seller.id);
      const sellerClients = allClients.filter(c => c.userId === seller.id);
      const sellerActivities = allActivities.filter(a => a.userId === seller.id);
      const sellerTasks = existingTasks.filter(t => t.userId === seller.id && t.status !== 'completed');

      const aiPrompt = `Sei un AI Sales Coach esperto. Analizza i dati del venditore e genera task strategici per oggi e domani.

**VENDITORE**: ${seller.displayName || seller.email}

**DEALS ATTIVI** (${sellerDeals.length} totali)
${sellerDeals.slice(0, 15).map(deal => `
- [${deal.stage}] ${deal.title}
  Cliente: ${deal.clientName}
  Probabilità: ${deal.probability}%
  Note: ${deal.notes || 'N/A'}
`).join('\n')}

**ATTIVITÀ RECENTI** (ultimi 30 giorni: ${sellerActivities.length})
${sellerActivities.slice(0, 10).map(activity => `
- [${activity.type}] ${activity.title}
  Outcome: ${activity.outcome || 'N/A'}
`).join('\n')}

**TASK GIÀ PROGRAMMATI**: ${sellerTasks.length}

Genera 3-5 task specifici per OGGI e 2-3 task per DOMANI. Priorità a deals HOT e follow-up urgenti.
Rispondi SOLO con JSON array:
[{"type": "call|email|meeting|demo|follow_up|research", "title": "...", "description": "...", "aiRationale": "...", "priority": "critical|high|medium|low", "scheduledAt": "ISO date", "objectives": ["..."], "confidence": 75, "impactScore": 85, "relatedEntity": {"type": "deal|client", "id": "...", "name": "..."}}]`;

      try {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 3000,
          temperature: 0.7,
          messages: [{ role: 'user', content: aiPrompt }],
        });

        const responseText = response.choices[0]?.message?.content || '';
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);

        let tasks: any[] = [];
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        }

        if (tasks.length > 0) {

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
              createdBy: 'ai_cron_daily',
            };

            const docRef = await adminDb!.collection('tasks').add(taskDoc);
            generatedTasks.push({ id: docRef.id, ...taskDoc });
          }

          console.log(`✅ Generated ${tasks.length} tasks for ${seller.displayName}`);
        }
      } catch (error) {
        console.error(`❌ Error generating tasks for ${seller.id}:`, error);
      }
    }

    // 2. RICERCA PROSPECT (eseguito solo alcuni giorni della settimana)
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    let prospectsCreated = 0;

    // Esegui ricerca prospect solo lunedì (1) e giovedì (4)
    if (today === 1 || today === 4) {
      console.log('\n🔍 Step 2: Researching new prospects...');

      try {
        const aiPrompt = `Genera 3 prospect REALISTICI per azienda VR/XR italiana.

Settori: scuola, hotel, museo_privato, comune
Regioni: Toscana, Lazio, Campania, Lombardia

OUTPUT: JSON array di 3 prospect con: name, entityType, city, region, serviceInterest, estimatedValue, priorityScore, aiRationale, suggestedApproach, keyDecisionMaker, contacts[]`;

        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 2000,
          temperature: 0.8,
          messages: [{ role: 'user', content: aiPrompt }],
        });

        const responseText = response.choices[0]?.message?.content || '';
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);

        let prospects: any[] = [];
        if (jsonMatch) {
          prospects = JSON.parse(jsonMatch[0]);
        }

        if (prospects.length > 0) {

          for (let i = 0; i < prospects.length; i++) {
            const prospect = prospects[i];
            const assignedSeller = sellers[i % sellers.length];

            // Salva prospect come cliente
            const clientDoc = {
              userId: assignedSeller.id,
              name: prospect.name,
              entityType: prospect.entityType,
              city: prospect.city,
              region: prospect.region,
              status: 'prospect',
              source: 'ai_cron_research',
              priorityScore: prospect.priorityScore || 70,
              estimatedValue: prospect.estimatedValue || 0,
              aiRationale: prospect.aiRationale,
              createdAt: new Date(),
              createdBy: 'ai_cron_research',
            };

            const clientRef = await adminDb!.collection('clients').add(clientDoc);

            // Crea deal
            const dealDoc = {
              userId: assignedSeller.id,
              clientId: clientRef.id,
              clientName: prospect.name,
              entityType: prospect.entityType,
              title: `${prospect.serviceInterest} - ${prospect.name}`,
              stage: 'prospect',
              priority: prospect.priorityScore > 80 ? 'hot' : 'warm',
              source: 'ai_research',
              serviceType: prospect.serviceInterest,
              probability: 30,
              notes: prospect.aiRationale,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await adminDb!.collection('deals').add(dealDoc);
            prospectsCreated++;
          }

          console.log(`✅ Created ${prospects.length} new prospects`);
        }
      } catch (error) {
        console.error('❌ Error researching prospects:', error);
      }
    } else {
      console.log('\n⏭️ Step 2: Skipping prospect research (not scheduled for today)');
    }

    // 3. RETURN SUMMARY
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      sellersProcessed: sellers.length,
      tasksGenerated: generatedTasks.length,
      prospectsCreated,
      nextRun: 'Tomorrow at same time',
    };

    console.log('\n✅ Daily automation completed:');
    console.log(`   - Sellers processed: ${summary.sellersProcessed}`);
    console.log(`   - Tasks generated: ${summary.tasksGenerated}`);
    console.log(`   - Prospects created: ${summary.prospectsCreated}`);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
