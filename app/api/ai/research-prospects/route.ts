import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getOpenAI } from '@/lib/ai/openai';

/**
 * POST /api/ai/research-prospects
 * L'AI ricerca nuovi potenziali clienti e li aggiunge al database
 * Crea anche task per i venditori per contattarli
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

    const body = await req.json();
    const {
      targetSectors = ['scuola', 'hotel', 'museo_privato', 'comune'],
      targetRegions = ['Toscana', 'Lazio', 'Campania', 'Lombardia'],
      numberOfProspects = 5,
      assignToSellerId = null // Se null, distribuisce tra tutti i sellers
    } = body;

    console.log('🔍 Starting prospect research...');

    // 1. Raccogliere dati esistenti per analisi pattern
    const clientsSnapshot = await adminDb!.collection('clients').get();
    const existingClients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const dealsSnapshot = await adminDb!.collection('deals').get();
    const existingDeals = dealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // 2. Ottieni sellers disponibili per assegnazione
    const sellersSnapshot = await adminDb!
      .collection('users')
      .where('role', 'in', ['seller', 'team_leader'])
      .get();

    const sellers = sellersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (sellers.length === 0) {
      return NextResponse.json({ error: 'No sellers found' }, { status: 400 });
    }

    // 3. Genera prompt per l'AI
    const aiPrompt = `Sei un AI Sales Intelligence che ricerca nuovi potenziali clienti per un'azienda VR/XR italiana.

**BUSINESS MODEL**
Forniamo esperienze VR/AR a 4 settori:
1. SCUOLE: Eventi VR educativi (Sistema Solare, Storia, Corpo Umano)
2. HOTEL: Postazioni VR in lobby per intrattenimento ospiti
3. MUSEI PRIVATI: Postazioni VR interattive per visitatori
4. COMUNI: Esperienze 360° custom + postazioni InfoPoint turistico

**CLIENTI ESISTENTI** (per capire il pattern)
${existingClients.slice(0, 10).map(client => `
- ${client.name} (${client.entityType}) - ${client.city || 'N/A'}, ${client.region || 'N/A'}
`).join('\n')}

**DEALS DI SUCCESSO**
${existingDeals.filter(d => ['won', 'active', 'verbal_agreement'].includes(d.stage)).slice(0, 5).map(deal => `
- ${deal.clientName} (${deal.entityType}) - ${deal.serviceType}
  Stage: ${deal.stage} | Value: €${deal.contractValue || 'N/A'}
`).join('\n')}

**TARGET**
Settori: ${targetSectors.join(', ')}
Regioni: ${targetRegions.join(', ')}
Numero prospects da generare: ${numberOfProspects}

**ISTRUZIONI**
Genera ${numberOfProspects} prospect REALISTICI e di ALTA QUALITÀ basati su:
1. Analisi dei clienti esistenti (pattern di successo)
2. Ricerca di istituzioni/aziende reali in Italia
3. Priorità a target con alto potenziale (città turistiche, scuole grandi, hotel 4-5 stelle)

Per ogni prospect:
- Nome REALISTICO dell'istituzione (basato su nomi reali italiani)
- Città e regione target
- Motivazione chiara del perché è un buon prospect
- Score di priorità (0-100) basato su potenziale revenue e fit

**OUTPUT FORMAT**: JSON array
\`\`\`json
[
  {
    "name": "Nome Istituzione",
    "entityType": "scuola|hotel|museo_privato|comune",
    "city": "Città",
    "region": "Regione",
    "address": "Indirizzo approssimativo",
    "serviceInterest": "evento_scuola|postazione_hotel|postazione_museo|esperienza_comune",
    "estimatedValue": 5000,
    "priorityScore": 85,
    "aiRationale": "Perché questo prospect è interessante e come approcciarli",
    "suggestedApproach": "Strategia di primo contatto",
    "keyDecisionMaker": "Ruolo del decision maker (es: Preside, GM Hotel, Sindaco)",
    "contacts": [
      {
        "type": "email",
        "value": "email@stimata.it",
        "isPrimary": true
      },
      {
        "type": "phone",
        "value": "+39 XXX XXXXXXX",
        "isPrimary": false
      }
    ]
  }
]
\`\`\`

Genera prospect REALI e actionable. Rispondi SOLO con il JSON array.`;

    // 4. Chiamata all'AI
    console.log('🤖 Calling AI for prospect research...');

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      temperature: 0.8, // Più creatività per generare prospect diversi
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
      console.error('❌ No valid JSON found in AI response');
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const prospects = JSON.parse(jsonMatch[0]);

    // 5. Salva prospects nel database
    const savedProspects = [];
    const createdTasks = [];

    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];

      // Assegna a un venditore (round-robin o specifico)
      const assignedSeller = assignToSellerId
        ? sellers.find(s => s.id === assignToSellerId)
        : sellers[i % sellers.length];

      if (!assignedSeller) continue;

      // Salva prospect come nuovo cliente (status: prospect)
      const clientDoc = {
        userId: assignedSeller.id,
        name: prospect.name,
        entityType: prospect.entityType,
        city: prospect.city,
        region: prospect.region,
        address: prospect.address,
        contacts: prospect.contacts || [],
        status: 'prospect',
        source: 'ai_research',
        priorityScore: prospect.priorityScore || 70,
        estimatedValue: prospect.estimatedValue || 0,
        aiRationale: prospect.aiRationale,
        suggestedApproach: prospect.suggestedApproach,
        keyDecisionMaker: prospect.keyDecisionMaker,
        createdAt: new Date(),
        createdBy: 'ai_prospect_research',
        tags: ['ai_generated', 'high_potential'],
      };

      const clientRef = await adminDb!.collection('clients').add(clientDoc);
      savedProspects.push({ id: clientRef.id, ...clientDoc });

      // Crea un deal prospect per questo cliente
      const dealDoc = {
        userId: assignedSeller.id,
        clientId: clientRef.id,
        clientName: prospect.name,
        entityType: prospect.entityType,
        title: `${prospect.serviceInterest} - ${prospect.name}`,
        stage: 'prospect',
        priority: prospect.priorityScore > 80 ? 'hot' : prospect.priorityScore > 60 ? 'warm' : 'cold',
        source: 'ai_research',
        serviceType: prospect.serviceInterest,
        probability: 30, // Start conservativo per prospect
        notes: prospect.aiRationale,
        followUpStrategy: prospect.suggestedApproach,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dealRef = await adminDb!.collection('deals').add(dealDoc);

      // Crea task per il venditore per contattare il prospect
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const taskDoc = {
        userId: assignedSeller.id,
        type: 'call',
        title: `Primo Contatto - ${prospect.name}`,
        description: `Contattare ${prospect.keyDecisionMaker} di ${prospect.name} per presentare i nostri servizi VR.\n\nApproccio suggerito:\n${prospect.suggestedApproach}`,
        aiRationale: prospect.aiRationale,
        priority: prospect.priorityScore > 80 ? 'high' : 'medium',
        status: 'pending',
        scheduledAt: tomorrow.toISOString(),
        objectives: [
          `Presentare servizio ${prospect.serviceInterest}`,
          'Capire interesse e budget',
          'Fissare meeting/demo se interessato'
        ],
        confidence: 50,
        impactScore: prospect.priorityScore,
        relatedEntity: {
          type: 'deal',
          id: dealRef.id,
          name: prospect.name
        },
        clientName: prospect.name,
        dealTitle: dealDoc.title,
        createdAt: new Date(),
        createdBy: 'ai_prospect_research',
      };

      const taskRef = await adminDb!.collection('tasks').add(taskDoc);
      createdTasks.push({ id: taskRef.id, ...taskDoc });

      console.log(`✅ Created prospect ${prospect.name} → assigned to ${assignedSeller.displayName}`);
    }

    // 6. Return summary
    return NextResponse.json({
      success: true,
      summary: {
        prospectsCreated: savedProspects.length,
        tasksCreated: createdTasks.length,
        timestamp: new Date().toISOString(),
      },
      prospects: savedProspects,
      tasks: createdTasks,
    });

  } catch (error: any) {
    console.error('Error researching prospects:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
