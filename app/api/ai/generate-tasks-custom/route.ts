import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getOpenAI } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const { sellerId, customPrompt } = await request.json();

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    if (!customPrompt) {
      return NextResponse.json(
        { error: 'customPrompt is required' },
        { status: 400 }
      );
    }

    // Fetch seller data from Firestore
    const sellerDoc = await adminDb!.collection('users').doc(sellerId).get();
    if (!sellerDoc.exists) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const seller = sellerDoc.data();

    // Fetch recent activities
    const activitiesSnapshot = await adminDb!
      .collection('activities')
      .where('userId', '==', sellerId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const activities = activitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    // Fetch active deals
    const dealsSnapshot = await adminDb!
      .collection('deals')
      .where('userId', '==', sellerId)
      .get();

    const deals = dealsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost');

    // Fetch clients
    const clientsSnapshot = await adminDb!
      .collection('clients')
      .where('userId', '==', sellerId)
      .get();

    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch existing tasks
    const existingTasksSnapshot = await adminDb!
      .collection('tasks')
      .where('userId', '==', sellerId)
      .where('status', '!=', 'completed')
      .get();

    const existingTasks = existingTasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Build AI prompt with context
    const aiPrompt = `Sei un AI Sales Coach esperto. Genera task strategici per il venditore basandoti sul contesto fornito e sulla richiesta specifica dell'admin.

**VENDITORE**
Nome: ${seller?.displayName || seller?.email}
Email: ${seller?.email}

**CONTESTO DEL VENDITORE**

Deals Attivi: ${activeDeals.length}
${activeDeals.slice(0, 10).map((deal: any) => `
- [${deal.stage}] ${deal.title}
  Cliente: ${deal.clientName || 'N/A'}
  Probabilità: ${deal.probability}% | Priorità: ${deal.priority}
`).join('\n')}

Clienti: ${clients.length}
${clients.slice(0, 10).map((client: any) => `
- ${client.name} (${client.entityType}) - Priorità: ${client.priority || 'N/A'}
`).join('\n')}

Attività Recenti: ${activities.length}
${activities.slice(0, 10).map((activity: any) => `
- [${activity.type}] ${activity.title} - ${new Date(activity.createdAt).toLocaleDateString('it-IT')}
`).join('\n')}

Task Già Programmati: ${existingTasks.length}
${existingTasks.slice(0, 10).map((task: any) => `
- ${task.title} (${task.status})
`).join('\n')}

---

**RICHIESTA DELL'ADMIN**
${customPrompt}

---

**ISTRUZIONI**
Genera 3-7 task specifici basandoti sulla richiesta dell'admin e sul contesto del venditore.

**REGOLE**:
- NON duplicare task già esistenti
- Ogni task deve avere un OBIETTIVO CHIARO e MISURABILE
- Includi SEMPRE dettagli specifici (nomi cliente/deal)
- Spiega il "perché" nel rationale
- Assegna priority: critical, high, medium, low
- Tipo appropriato: call, email, meeting, demo, follow_up, research, note

**OUTPUT FORMAT**: JSON array di task
\`\`\`json
[
  {
    "type": "call|email|meeting|demo|follow_up|research|note",
    "title": "Titolo specifico con nome cliente",
    "description": "Descrizione dettagliata dell'azione",
    "aiRationale": "Perché questo task è importante ora (basato sulla richiesta admin)",
    "priority": "critical|high|medium|low",
    "scheduledAt": "2025-11-01T10:00:00.000Z",
    "objectives": ["Obiettivo 1", "Obiettivo 2"],
    "confidence": 75,
    "impactScore": 85,
    "relatedEntity": {
      "type": "deal|client",
      "id": "entity-id",
      "name": "Nome"
    }
  }
]
\`\`\`

Genera task SMART e actionable. Rispondi SOLO con il JSON array.`;

    // Call OpenAI
    const openai = getOpenAI();
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

    const responseText = response.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const tasks = JSON.parse(jsonMatch[0]);

    // Return tasks without saving (admin will confirm first)
    return NextResponse.json({
      success: true,
      tasksGenerated: tasks.length,
      tasks,
      sellerId,
      sellerName: seller?.displayName || seller?.email,
    });

  } catch (error: any) {
    console.error('Error generating custom AI tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
