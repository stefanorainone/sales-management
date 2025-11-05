import OpenAI from 'openai';
import type { AITask, AIInsight, DailyBriefing, Deal, Client, Activity, AICustomInstructions } from '@/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// DEMO MODE for testing without API key
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Fetch custom instructions for a seller from admin
 */
async function fetchCustomInstructions(userId: string): Promise<string> {
  try {
    // In server-side code, we can call the API directly
    // For now, we'll use a simple check for demo purposes
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/admin/instructions?userId=${userId}`);

    if (!response.ok) {
      return '';
    }

    const instructions: AICustomInstructions[] = await response.json();

    if (instructions.length === 0) {
      return '';
    }

    // Format instructions by priority
    const highPriority = instructions.filter(i => i.priority === 'high').map(i => i.instructions);
    const mediumPriority = instructions.filter(i => i.priority === 'medium').map(i => i.instructions);
    const lowPriority = instructions.filter(i => i.priority === 'low').map(i => i.instructions);

    let formatted = '';
    if (highPriority.length > 0) {
      formatted += '\n🔴 HIGH PRIORITY INSTRUCTIONS FROM ADMIN:\n' + highPriority.map(i => `- ${i}`).join('\n');
    }
    if (mediumPriority.length > 0) {
      formatted += '\n🟡 MEDIUM PRIORITY INSTRUCTIONS FROM ADMIN:\n' + mediumPriority.map(i => `- ${i}`).join('\n');
    }
    if (lowPriority.length > 0) {
      formatted += '\n🔵 LOW PRIORITY INSTRUCTIONS FROM ADMIN:\n' + lowPriority.map(i => `- ${i}`).join('\n');
    }

    return formatted;
  } catch (error) {
    console.error('Error fetching custom instructions:', error);
    return '';
  }
}

interface GenerateTasksParams {
  userId: string;
  userName: string;
  deals: Deal[];
  clients: Client[];
  recentActivities: Activity[];
  completedTasks?: AITask[];
  date: string; // YYYY-MM-DD
}

interface GenerateBriefingParams extends GenerateTasksParams {
  yesterdayTasks?: AITask[];
}

interface AnalyzeNotesParams {
  taskId: string;
  taskType: string;
  clientName: string;
  dealTitle?: string;
  notes: string;
  outcome: 'success' | 'partial' | 'failed' | 'no_answer';
}

interface CoachResponseParams {
  userId: string;
  userName: string;
  question: string;
  context?: {
    currentTask?: AITask;
    recentActivities?: Activity[];
    activePipeline?: Deal[];
  };
}

/**
 * Generate daily tasks for a seller based on their pipeline and activity
 */
export async function generateDailyTasks(
  params: GenerateTasksParams
): Promise<AITask[]> {
  if (DEMO_MODE) {
    return generateMockTasks(params);
  }

  // First, load existing tasks from Firestore
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', params.userId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const existingTasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();

      // Helper function to convert Firestore Timestamps (both client and admin SDK)
      const convertTimestamp = (timestamp: any): string => {
        if (typeof timestamp === 'string') {
          return timestamp;
        }
        // Client SDK Timestamp
        if (timestamp?.toDate) {
          return timestamp.toDate().toISOString();
        }
        // Admin SDK Timestamp format {_seconds, _nanoseconds}
        if (timestamp?._seconds) {
          return new Date(timestamp._seconds * 1000).toISOString();
        }
        return new Date().toISOString();
      };

      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        scheduledAt: convertTimestamp(data.scheduledAt),
      };
    }) as AITask[];

    // Filter for pending and in_progress tasks
    const activeTasks = existingTasks.filter(
      task => task.status === 'pending' || task.status === 'in_progress'
    );

    // If there are active tasks, return them
    if (activeTasks.length > 0) {
      console.log(`Found ${activeTasks.length} existing active tasks for user ${params.userId}`);
      return activeTasks.map(task => ({
        ...task,
        // Ensure all required fields are present
        userId: task.userId || params.userId,
        status: task.status || 'pending',
        type: task.type || 'call',
        priority: task.priority || 'medium',
        title: task.title || 'Task',
        description: task.description || '',
      }));
    }

    console.log(`No existing tasks found for user ${params.userId}, generating new ones...`);
  } catch (error) {
    console.error('Error loading tasks from Firestore:', error);
    // Continue to generate new tasks if loading fails
  }

  // If no existing tasks, generate new ones with AI
  // Fetch custom instructions from admin
  const customInstructions = await fetchCustomInstructions(params.userId);

  const prompt = `You are an AI sales assistant helping a sales representative named ${params.userName}.

Today is ${params.date}.

CURRENT PIPELINE:
${JSON.stringify(params.deals, null, 2)}

CLIENTS:
${JSON.stringify(params.clients, null, 2)}

RECENT ACTIVITIES:
${JSON.stringify(params.recentActivities, null, 2)}

COMPLETED TASKS TODAY:
${JSON.stringify(params.completedTasks || [], null, 2)}
${customInstructions ? `\n${customInstructions}\n` : ''}
Generate 4-8 high-priority tasks for tomorrow that will maximize sales success. For each task, provide:
1. Type (call, email, meeting, demo, follow_up, research, admin)
2. Title (brief, action-oriented)
3. Description (what to do)
4. AI Rationale (why this task is important)
5. Priority (critical, high, medium, low)
6. Scheduled time (suggest optimal time based on task type)
7. estimatedDuration: OPTIMISTIC time estimate in minutes (be aggressive to incentivize speed!)
   - call: 10-15 min
   - email: 5-10 min
   - meeting: 20-30 min
   - demo: 30-40 min
   - follow_up: 10-15 min
   - research: 15-20 min
   - admin: 10-15 min
8. Related client/deal IDs if applicable
9. Script/talking points if it's a call or email (detailed, specific to the client context)
10. Objectives for the task (3-5 clear, measurable objectives)

11. guidelines: GUIDA PASSO-PASSO DETTAGLIATA E APPROFONDITA (7-12 steps) - Ogni step deve essere specifico, concreto e attuabile
   IMPORTANTE: Le guidelines devono essere MOLTO DETTAGLIATE, come se stessi guidando un venditore junior step-by-step
   - Includi preparazione mentale e fisica
   - Dettagli su cosa fare PRIMA, DURANTE e DOPO il task
   - Specifiche tecniche (quali strumenti usare, cosa avere pronto, timing preciso)
   - Cosa dire esattamente nelle situazioni chiave
   - Come gestire diverse reazioni del cliente

   Example per una chiamata:
   ["1. PREPARAZIONE AMBIENTE (5min): Trova stanza tranquilla e silenziosa, chiudi porta, prepara acqua, carica telefono, apri CRM su computer, prepara blocco note e penna per appunti rapidi",
    "2. STUDIO CLIENTE (10min): Rivedi TUTTA la storia cliente nel CRM - ultimo contatto, deal in corso, esigenze espresse, obiezioni passate, budget, decision maker. Leggi le note dei colleghi. Controlla LinkedIn del cliente per aggiornamenti recenti (nuovo ruolo? post interessanti?)",
    "3. PREPARAZIONE MENTALE (2min): Respira profondamente 3 volte, ricorda che stai offrendo VALORE non vendendo. Sorridi prima di chiamare - il tono si sente! Visualizza una conversazione positiva.",
    "4. TIMING PERFETTO: Chiama tra 10:00-11:30 o 14:30-16:00 (evita lunedì mattina e venerdì pomeriggio). Se non risponde, richiama dopo 2-3 ore, mai immediatamente.",
    "5. APERTURA CHIAMATA (primi 30sec): 'Buongiorno [Nome], sono [Tuo Nome] di [Azienda]. Ti disturbo?' - PAUSA e ascolta. Poi: 'Ti chiamo perché [motivo specifico legato a loro esigenza]. Hai 10 minuti ora o preferisci che ti richiami?'",
    "6. DISCOVERY PROFONDA (5-7min): Fai domande aperte. 'Come sta andando [riferimento a problema discusso]?' 'Quali sono le tue priorità principali in questo momento?' 'Cosa ti tiene sveglio la notte riguardo a [area]?'. ASCOLTA PIÙ DEL 70% DEL TEMPO. Annota tutto.",
    "7. GESTIONE OBIEZIONI: Se dice 'costa troppo': 'Capisco, parliamo di investimento. Quanto ti costa OGGI non avere questa soluzione?' Se dice 'devo pensarci': 'Certo, cosa specificamente vuoi valutare? Posso aiutarti con informazioni aggiuntive?'",
    "8. PROPOSTA VALORE PERSONALIZZATA (3min): 'Basandomi su quello che mi hai detto su [ripeti loro problema], la nostra soluzione [beneficio specifico] ti permetterebbe di [risultato misurabile]. Questo risolverebbe [loro pain point]?'",
    "9. CHIUSURA MORBIDA: 'Ha senso? Cosa ne pensi?' NON dire 'Sei interessato?' ma 'Quali sono i prossimi step dalla tua parte?' - li coinvolgi nella decisione",
   "10. DEFINISCI NEXT STEP CONCRETO: Non terminare con 'ci sentiamo'. Ma: 'Ti invio proposta via email oggi pomeriggio, la rivediamo insieme venerdì alle 15:00. Ti va?' Prendi IMPEGNO preciso.",
   "11. RINGRAZIA E CONFERMA: 'Perfetto, ricapitolando: ti invio [X] oggi, tu fai [Y] entro [data], ci sentiamo [giorno] alle [ora]. Corretto?' Aspetta conferma. 'Grazie [Nome], buona giornata!'",
   "12. FOLLOW-UP IMMEDIATO (entro 15min): Mentre è tutto fresco, aggiorna CRM con: riassunto conversazione, esigenze emerse, obiezioni, budget discusso, prossimi step concordati, sentiment del cliente (1-5), probabilità chiusura. Invia email di follow-up con recap e prossimi step."]

12. bestPractices: BEST PRACTICES APPROFONDITE E CONCRETE (6-10 tips) - Ogni tip deve includere il PERCHÉ e un esempio pratico
   IMPORTANTE: Non generiche frasi motivazionali, ma consigli TECNICI e PRATICI con spiegazione del perché funzionano

   Example per una chiamata:
   ["🎭 SORRIDI MENTRE PARLI: Il sorriso cambia il tono della voce - il cliente lo 'sente' anche al telefono e percepisce più positività. Test: registrati mentre parli serio vs sorridente, sentirai la differenza!",
    "👂 REGOLA 70/30: Tu parli max 30%, cliente parla 70%. I migliori venditori ASCOLTANO più di quanto parlano. Il cliente deve sentirsi ASCOLTATO, non 'venduto'. Annota quanto parli tu vs cliente.",
    "🎯 FAI DOMANDE APERTE: Evita domande sì/no. Invece di 'Ti interessa?' chiedi 'Come vedi questa soluzione integrarsi nel tuo processo attuale?' Le domande aperte rivelano VERO interesse e obiezioni nascoste.",
    "📝 PRENDI APPUNTI VISIBILI: Dì 'Sto prendendo appunti perché quello che mi stai dicendo è importante'. Questo comunica: 1) Rispetto, 2) Professionalità, 3) Seguirai quanto detto. Il cliente si sente valorizzato.",
    "🔁 RIPETI E RIASSUMI: Ogni 3-4min ripeti con parole tue quello che ha detto il cliente: 'Quindi se ho capito bene, il tuo problema principale è [X]?'. Questo: 1) Verifica comprensione, 2) Mostra ascolto attivo, 3) Evita fraintendimenti.",
    "⏱️ RISPETTA IL TEMPO: Se hai detto '10 minuti', dopo 9min chiedi 'Ho ancora 5 minuti?' Mostra rispetto del loro tempo. Se servono più tempo, LORO te lo daranno. Mai sforare senza chiedere.",
    "💰 PARLA DI VALORE PRIMA DEL PREZZO: Non menzionare costi finché non hanno CAPITO il valore. Prima costruisci il dolore del problema, poi la soluzione, poi il valore, POI il prezzo. Prezzo senza valore = obiezione garantita.",
    "🎪 USA STORYTELLING: Invece di 'Funziona bene', racconta: 'Un cliente simile a te, [Azienda], aveva [stesso problema]. Dopo 3 mesi con noi, [risultato misurabile: +40% vendite]. Ora usano [feature] ogni giorno.' Le storie vendono più dei dati.",
    "🚫 GESTISCI 'NO' CON CURIOSITÀ: Se dice no, NON insistere. Ma chiedi con genuina curiosità: 'Posso chiederti cosa ti ha fatto decidere di no?' Spesso rivela obiezione gestibile. E mostra che accetti loro decisione = meno pressione.",
    "📧 EMAIL DI FOLLOW-UP ENTRO 1H: Invia recap della chiamata entro 60min mentre è fresco. Include: 1) Grazie per tempo, 2) Punti chiave discussi, 3) Prossimi step con DATE precise, 4) Tua disponibilità. Questo mostra professionalità e mantiene momentum."]

13. commonMistakes: ERRORI COMUNI DA EVITARE - MOLTO DETTAGLIATI (6-10 mistakes) - Spiega perché è un errore e cosa fare invece
   IMPORTANTE: Ogni errore deve includere la CONSEGUENZA negativa e l'ALTERNATIVA corretta

   Example per una chiamata:
   ["❌ ERRORE: Parlare troppo (parlare >50% del tempo) → CONSEGUENZA: Cliente si annoia, perde interesse, sente 'venditore invadente' → ✅ FAI INVECE: Poni domande aperte, ascolta attivamente, parla max 30% del tempo. Usa silenzi strategici - il cliente riempirà il silenzio con info preziose.",
    "❌ ERRORE: Saltare subito al prezzo/demo senza discovery → CONSEGUENZA: Non conosci vere esigenze, proponi soluzione generica, cliente non vede valore personalizzato → ✅ FAI INVECE: Dedica primi 10min solo a CAPIRE loro situazione con domande. Solo dopo proponi soluzione su misura.",
    "❌ ERRORE: Non gestire obiezioni, cambiar subito argomento → CONSEGUENZA: Obiezione resta irrisolta, cliente non convinto, probabilità chiusura crolla → ✅ FAI INVECE: Accogli obiezione 'Capisco la tua preoccupazione', chiedi più info 'Puoi dirmi di più?', poi affronta con empatia.",
    "❌ ERRORE: Terminare chiamata senza prossimo step definito → CONSEGUENZA: Deal si 'raffredda', nessun momentum, devi ripartire da zero alla prossima chiamata → ✅ FAI INVECE: Sempre concordare azione concreta con DATA: 'Ti invio proposta giovedì, la rivediamo insieme lunedì 15:00. Ti va?'",
    "❌ ERRORE: Non aggiornare CRM subito dopo chiamata → CONSEGUENZA: Dimentichi dettagli cruciali, prossima interazione sembra poco preparata, cliente sente mancanza di professionalità → ✅ FAI INVECE: Blocca 15min dopo ogni chiamata per aggiornare CRM dettagliatamente mentre è fresco.",
    "❌ ERRORE: Usare troppo gergo tecnico o acronimi → CONSEGUENZA: Cliente confuso, si sente stupido a chiedere, annuisce ma non ha capito → ✅ FAI INVECE: Parla come parla il CLIENTE. Se usa termini semplici, anche tu fallo. Spiega concetti complessi con analogie semplici.",
    "❌ ERRORE: Non fare recap dei punti chiave prima di chiudere → CONSEGUENZA: Cliente esce confuso, non ricorda next step, non sa cosa deve fare → ✅ FAI INVECE: Ultimi 2min: 'Ricapitoliamo: hai detto [X], io farò [Y] entro [data], tu farai [Z], ci risentiamo [quando]. Tutto chiaro?'",
    "❌ ERRORE: Essere difensivo con obiezioni su prezzo → CONSEGUENZA: Cliente sente che nascondi qualcosa, difensività = insicurezza percepita → ✅ FAI INVECE: 'Capisco, parliamo di investimento. Quanto ti costa oggi NON avere questa soluzione? Qual è il costo dell'inazione?' - sposta focus su costo del problema.",
    "❌ ERRORE: Chiamare senza aver studiato cliente → CONSEGUENZA: Fai domande le cui risposte sono nel CRM, sembri poco preparato, cliente perde fiducia → ✅ FAI INVECE: Dedica 10min PRIMA della chiamata a studiare tutto: storico, deal, note, LinkedIn. Entra preparato = rispetto.",
    "❌ ERRORE: Accettare vago 'ci penso' senza scavare → CONSEGUENZA: È un no mascherato, perdi tempo aspettando risposta che non arriva → ✅ FAI INVECE: 'Certo, cosa specificamente vuoi valutare? C'è qualcosa che ti blocca? Parliamone ora.' Porta obiezioni allo scoperto per gestirle."]
14. expectedOutputFormat: OBBLIGATORIO - Specifica SEMPRE il formato in cui il venditore deve fornire il risultato e caricare documenti
   - type: "text" | "structured_data" | "google_sheet" | "document" | "mixed"
   - description: Istruzioni dettagliate su COSA caricare e in CHE FORMATO (es: "Carica screenshot della conversazione WhatsApp + Google Sheet con i dati raccolti")
   - example: Esempio concreto di cosa caricare
   - fields: Per structured_data/google_sheet, lista i campi da includere
   - documentRequired: true (sempre true - documento OBBLIGATORIO)

   IMPORTANTE: Il venditore DEVE caricare un documento per completare il task. Specifica sempre cosa deve caricare.

   Examples:
   - For calls: { type: "document", description: "Carica screenshot/foto della chiamata (durata, orario) + documento di testo con: riassunto conversazione, obiezioni, budget discusso, prossimi step", example: "Screenshot chiamata di 12min + documento Word con sezioni: Riassunto, Budget, Obiezioni, Next Steps", documentRequired: true }
   - For research: { type: "google_sheet", description: "Carica link a Google Sheet condiviso con colonne: Nome Contatto, Ruolo, Email, Telefono, LinkedIn, Note, Livello Interesse (1-5)", fields: ["Nome Contatto", "Ruolo", "Email", "Telefono", "LinkedIn", "Note", "Livello Interesse"], example: "https://docs.google.com/spreadsheets/d/...", documentRequired: true }
   - For meetings: { type: "mixed", description: "Carica foto/scan del verbale meeting firmato + documento Word con: argomenti discussi, decisioni prese, action items con responsabili e deadline", fields: ["Argomento", "Decisione", "Action Item", "Responsabile", "Deadline"], example: "Scan verbale.pdf + verbale_dettagliato.docx", documentRequired: true }
   - For demo: { type: "document", description: "Carica foto/screenshot della demo in azione + feedback form compilato dal cliente (può essere foto del foglio cartaceo o PDF)", example: "foto_demo_1.jpg, foto_demo_2.jpg, feedback_cliente.pdf", documentRequired: true }

Focus on:
- Following up on stalled deals
- Moving qualified leads to next stage
- Maintaining momentum on active negotiations
- Preventive actions (deals without recent activity)

Return ONLY a valid JSON array of tasks. No additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8000, // Aumentato per supportare guide molto dettagliate
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type from OpenAI');
    }

    const tasks = JSON.parse(content);
    return tasks.map((task: any, index: number) => ({
      ...task,
      id: `task-${Date.now()}-${index}`,
      userId: params.userId,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error generating tasks:', error);
    return generateMockTasks(params);
  }
}

/**
 * Generate productivity coaching based on performance
 */
function generateProductivityCoaching(
  yesterdayCompleted: number,
  yesterdayTotal: number,
  recentActivities: Activity[],
  deals: Deal[]
): { tips: string[]; bottlenecks: string[] } {
  const tips: string[] = [];
  const bottlenecks: string[] = [];

  const completionRate = yesterdayTotal > 0 ? (yesterdayCompleted / yesterdayTotal) * 100 : 0;

  // Analyze completion rate
  if (completionRate < 50) {
    bottlenecks.push('Basso completion rate ieri. Probabilmente troppi task o distrazioni.');
    tips.push('🎯 Focus: Scegli 3 task prioritari al mattino e completali prima di tutto il resto');
    tips.push('📵 Blocca 2-3 ore al giorno senza distrazioni per task critici');
  } else if (completionRate < 80) {
    tips.push('⚡ Velocizza: Prepara script chiamate la sera prima per iniziare subito al mattino');
  } else {
    tips.push('🚀 Ottimo ritmo! Per fare ancora di più: batch simili task (es. 3 chiamate consecutive)');
  }

  // Analyze deal velocity
  const stalledDeals = deals.filter(d => {
    // Check if deal hasn't moved in a while
    const daysSinceUpdate = d.updatedAt ?
      Math.floor((Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    return daysSinceUpdate > 5 && d.stage !== 'active' && d.stage !== 'won' && d.stage !== 'lost';
  });

  if (stalledDeals.length > 2) {
    bottlenecks.push(`${stalledDeals.length} deal fermi da più di 5 giorni. Rallentano la pipeline.`);
    tips.push('⏰ Quick win: Dedica 15 min a inviare follow-up rapidi ai deal fermi');
  }

  // VR business specific tips
  const scuoleDeals = deals.filter(d => d.entityType === 'scuola').length;
  const comuniDeals = deals.filter(d => d.entityType === 'comune').length;
  const hotelDeals = deals.filter(d => d.entityType === 'hotel').length;

  if (hotelDeals > 0 && hotelDeals < 3) {
    tips.push('🏨 Hotel: ciclo più rapido! Dedica 1h oggi a chiamate hotel per quick wins');
  }

  if (scuoleDeals > 3) {
    tips.push('🏫 Scuole: Batch call ai presidi martedì/giovedì mattina (evita lunedì e venerdì)');
  }

  if (comuniDeals > 0) {
    tips.push('🏛️ Comuni: Timing critico! Verifica date Giunte e segui ciclo budget (set-nov)');
  }

  // Time management tips
  tips.push('🔄 Automatizza: Crea template email per follow-up standard (risparmia 20 min/giorno)');

  return { tips, bottlenecks };
}

/**
 * Generate daily briefing with tasks and insights
 */
export async function generateDailyBriefing(
  params: GenerateBriefingParams
): Promise<DailyBriefing> {
  const tasks = await generateDailyTasks(params);
  const insights = await generateInsights(params);

  const yesterdayCompleted = params.yesterdayTasks?.filter(
    (t) => t.status === 'completed'
  ).length || 0;
  const yesterdayTotal = params.yesterdayTasks?.length || 0;

  const priorityBreakdown = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate productivity coaching
  const productivityAnalysis = generateProductivityCoaching(
    yesterdayCompleted,
    yesterdayTotal,
    params.recentActivities,
    params.deals
  );

  return {
    id: `briefing-${Date.now()}`,
    userId: params.userId,
    date: params.date,
    tasksCount: tasks.length,
    priorityBreakdown: priorityBreakdown as Record<AITask['priority'], number>,
    tasks,
    insights,
    yesterdayCompleted,
    yesterdayTotal,
    motivationalMessage: generateMotivationalMessage(
      yesterdayCompleted,
      yesterdayTotal,
      tasks.length
    ),
    focusAreas: extractFocusAreas(tasks),
    productivityTips: productivityAnalysis.tips,
    bottlenecks: productivityAnalysis.bottlenecks,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate insights based on current pipeline state
 */
export async function generateInsights(
  params: GenerateTasksParams
): Promise<AIInsight[]> {
  if (DEMO_MODE) {
    return generateMockInsights(params);
  }

  const prompt = `Analyze this sales pipeline and provide 2-4 actionable insights:

PIPELINE:
${JSON.stringify(params.deals, null, 2)}

RECENT ACTIVITIES:
${JSON.stringify(params.recentActivities, null, 2)}

Identify:
- Deals at risk (no activity in 5+ days)
- High-value opportunities
- Pattern-based suggestions
- Celebrations for wins

Return ONLY a valid JSON array of insights. Each insight should have:
- type: 'warning' | 'opportunity' | 'suggestion' | 'celebration' | 'tip'
- title: brief title
- message: detailed message
- priority: 'critical' | 'high' | 'medium' | 'low'
- actionable: boolean
- suggestedAction: what to do (if actionable)
- relatedClientId/relatedDealId if applicable`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    const insights = JSON.parse(content);
    return insights.map((insight: any, index: number) => ({
      ...insight,
      id: `insight-${Date.now()}-${index}`,
      userId: params.userId,
      dismissed: false,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error generating insights:', error);
    return generateMockInsights(params);
  }
}

/**
 * Analyze seller notes after task completion
 */
export async function analyzeTaskNotes(
  params: AnalyzeNotesParams
): Promise<{
  analysis: string;
  suggestedNextSteps: string[];
  dealUpdates?: Partial<Deal>;
  clientUpdates?: Partial<Client>;
  newTaskSuggestions?: Partial<AITask>[];
}> {
  if (DEMO_MODE) {
    return {
      analysis: 'Demo mode: Task completed successfully',
      suggestedNextSteps: ['Follow up in 2 days', 'Send thank you email'],
      newTaskSuggestions: [],
    };
  }

  const prompt = `A sales rep just completed a ${params.taskType} with ${params.clientName}.

OUTCOME: ${params.outcome}
NOTES: ${params.notes}

Analyze the notes and provide:
1. Brief analysis of what happened
2. 2-3 suggested next steps
3. Any updates needed to the deal (stage, priority, etc)
4. Any new tasks that should be created

Return valid JSON with: { analysis, suggestedNextSteps, dealUpdates, newTaskSuggestions }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing notes:', error);
    return {
      analysis: 'Analysis failed. Task marked as complete.',
      suggestedNextSteps: [],
    };
  }
}

/**
 * AI Coach - answer seller questions
 */
export async function getCoachResponse(
  params: CoachResponseParams
): Promise<string> {
  if (DEMO_MODE) {
    return `Ciao ${params.userName}! In DEMO MODE, l'AI Coach non è ancora attivo. La tua domanda era: "${params.question}". Una volta configurato con una API key valida di OpenAI, riceverai risposte personalizzate basate sul tuo pipeline e performance.`;
  }

  const contextStr = params.context
    ? `
CURRENT CONTEXT:
- Current Task: ${params.context.currentTask?.title || 'None'}
- Recent Activities: ${params.context.recentActivities?.length || 0}
- Active Deals: ${params.context.activePipeline?.length || 0}
`
    : '';

  const prompt = `You are an expert sales coach helping ${params.userName}.

${contextStr}

QUESTION: ${params.question}

Provide actionable, specific advice. Be encouraging but practical.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    return content;
  } catch (error) {
    console.error('Error getting coach response:', error);
    return 'Mi dispiace, al momento non riesco a rispondere. Riprova più tardi.';
  }
}

// ============================================================================
// MOCK DATA GENERATORS (for DEMO MODE)
// ============================================================================

function generateMockTasks(params: GenerateTasksParams): AITask[] {
  const now = new Date(params.date);
  const baseTime = new Date(now.setHours(9, 0, 0, 0));

  // Find VR-specific deals from params
  const scuolaDeal = params.deals.find(d => d.entityType === 'scuola' && d.stage === 'proposal_sent');
  const hotelDeal = params.deals.find(d => d.entityType === 'hotel' && d.stage === 'verbal_agreement');
  const comuneDeal = params.deals.find(d => d.entityType === 'comune' && d.stage === 'under_review');

  return [
    {
      id: 'task-1',
      userId: params.userId,
      type: 'call',
      title: `Follow-up Liceo ${scuolaDeal?.clientName || 'Da Vinci'}`,
      description: 'Chiamata a Preside per status approvazione Collegio Docenti',
      aiRationale:
        'Proposta inviata 7 giorni fa. Collegio Docenti approva fine novembre. Chiamata strategica per mantenere momentum e offrire supporto documentazione.',
      priority: 'high',
      status: 'pending',
      scheduledAt: new Date(baseTime.setHours(10, 0)).toISOString(),
      clientId: params.clients[0]?.id,
      clientName: scuolaDeal?.clientName || 'Prof.ssa Maria Lombardi',
      dealId: scuolaDeal?.id,
      dealTitle: scuolaDeal?.title || 'Evento VR Scientifico - Liceo',
      script: `Buongiorno Prof.ssa Lombardi, sono ${params.userName}.

La contatto per un breve aggiornamento sulla proposta per l'evento VR di marzo.

DOMANDE CHIAVE:
1. Ha avuto modo di condividere la proposta con i colleghi?
2. Il Collegio Docenti quando si riunisce per l'approvazione?
3. Ci sono dubbi o punti da chiarire che posso aiutare a risolvere?
4. Serve documentazione aggiuntiva per il DSGA?

VALORE DA ENFATIZZARE:
- Crediti PCTO validi per studenti
- Innovazione didattica (STEM)
- Esperienza memorabile per 250 studenti
- Case study: altri licei scientifici che hanno fatto evento simile

OBIETTIVO: Confermare che siamo nel loro budget e timeline prevista per marzo.`,
      talkingPoints: [
        'PCTO: ore valide per percorsi competenze trasversali',
        'Case study Liceo Galilei Padova (evento simile, feedback eccellente)',
        'Flessibilità date: marzo/aprile in base al loro calendario',
        'Supporto per presentazione al Collegio se necessario',
      ],
      objectives: [
        'Confermare data Collegio Docenti',
        'Verificare budget approvato',
        'Offrire supporto documentazione',
        'Mantenere entusiasmo e relazione',
      ],
      guidelines: [
        '1. Prepara ambiente: trova stanza tranquilla, apri CRM con scheda cliente',
        '2. Rivedi proposta inviata e note ultime interazioni prima di chiamare',
        '3. Inizia con tono cordiale, ricorda incontro precedente',
        '4. Fai domande aperte per capire stato approvazione e eventuali dubbi',
        '5. Prendi appunti durante chiamata e aggiorna CRM immediatamente dopo',
      ],
      bestPractices: [
        'Sorridi mentre parli - si sente nella voce e trasmette entusiasmo!',
        'Ascolta più del 50% del tempo - lascia che il Preside condivida preoccupazioni',
        'Usa case study di altre scuole per rafforzare credibilità',
        'Offri supporto concreto (es: documentazione extra) invece di solo chiedere aggiornamenti',
        'Conferma sempre prossimo step con data precisa prima di chiudere',
      ],
      commonMistakes: [
        'Non pressare per una risposta immediata - le scuole hanno tempi burocratici',
        'Non ignorare il DSGA - anche se il Preside decide, il DSGA gestisce budget',
        'Non dimenticare di menzionare valore PCTO - è un forte incentivo per licei',
        'Non terminare senza aver concordato un follow-up concreto',
      ],
      clientContext:
        'Preside tech-friendly, DSGA attento a budget ma favorevole. 850 studenti, liceo scientifico prestigioso Firenze.',
      dealContext: scuolaDeal ? `Stage: ${scuolaDeal.stage}. Probabilità ${scuolaDeal.probability}%. Evento previsto marzo 2026 per 250 studenti.` : 'Proposta inviata, alta probabilità',
      estimatedDuration: 12,
      expectedOutputFormat: {
        type: 'document',
        description: 'Carica screenshot/foto della chiamata (durata, orario) + documento di testo con: riassunto conversazione, stato approvazione Collegio Docenti, eventuali dubbi/obiezioni emersi, prossimi step concordati',
        example: 'Screenshot chiamata di 12min + documento Word con sezioni: Riassunto conversazione, Stato approvazione, Obiezioni/Dubbi, Next Steps con date precise',
        documentRequired: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      userId: params.userId,
      type: 'call',
      title: `Preparazione contratto: ${hotelDeal?.clientName || 'Grand Hotel Vesuvio'}`,
      description: 'Call con GM per definire dettagli contratto revenue share',
      aiRationale:
        'Accordo verbale ottenuto! GM vuole installazione pre-Pasqua. Critico preparare contratto questa settimana per firma entro metà novembre.',
      priority: 'critical',
      status: 'pending',
      scheduledAt: new Date(baseTime.setHours(14, 30)).toISOString(),
      clientId: params.clients.find(c => c.entityType === 'hotel')?.id,
      clientName: hotelDeal?.clientName || 'Dott. Andrea Martini',
      dealId: hotelDeal?.id,
      dealTitle: hotelDeal?.title || 'Postazione VR Lobby - Grand Hotel',
      script: `Buongiorno Dott. Martini,

La ringrazio per la fiducia! Sono entusiasta di procedere con la postazione VR nella vostra lobby.

PUNTI DA DEFINIRE:
1. Location esatta in lobby (spazio 2x2 metri)
2. Data installazione ideale (febbraio/marzo per pre-Pasqua)
3. Esperienze VR da includere:
   - Napoli panoramica (Castel dell'Ovo, lungomare)
   - Pompei VR tour
   - Costiera Amalfitana 360°
   - Vesuvio experience
4. Revenue share: 70% hotel / 30% nostra (standard)
5. Durata contratto: 12 mesi rinnovabili

VANTAGGI DA RIBADIRE:
- Zero costi fissi per l'hotel
- Installazione e manutenzione incluse
- Esperienza premium per ospiti luxury
- Differenziazione vs competitors
- Marketing: "Primo hotel a Napoli con VR experience"

OBIETTIVO: Confermare dettagli e inviare contratto entro venerdì.`,
      talkingPoints: [
        'Installazione professionale: 1 giorno, zero impatto operazioni hotel',
        'Formazione staff concierge inclusa',
        'Analytics mensili: numero utilizzi, feedback ospiti',
        'Contenuti aggiornati periodicamente senza costi',
      ],
      objectives: [
        'Confermare location esatta in lobby',
        'Definire data installazione (feb/mar 2026)',
        'Approvare revenue share 70/30',
        'Inviare contratto entro 2 giorni',
      ],
      guidelines: [
        '1. Prepara checklist punti da discutere prima della chiamata',
        '2. Usa linguaggio consulenziale, non venditore - sei partner strategico',
        '3. Prendi nota decisioni su ogni punto in tempo reale',
        '4. Riassumi accordi verbali prima di chiudere per conferma',
        '5. Invia email riepilogativa entro 1 ora con prossimi step',
      ],
      bestPractices: [
        'Enfatizza partnership win-win - zero rischio per hotel',
        'Parla di esperienza premium per ospiti, non di tecnologia',
        'Sii flessibile su dettagli operativi - mostra che capisci hospitality',
        'Offri analytics mensili - i GM adorano dati su ROI',
      ],
      commonMistakes: [
        'Non essere troppo tecnico - focus su benefici business',
        'Non complicare contratto - mantieni semplicità revenue share',
        'Non dimenticare aspetti operativi (manutenzione, formazione staff)',
        'Non tardare invio contratto - capitalizza entusiasmo immediato',
      ],
      clientContext:
        'GM entusiasta, hotel 5 stelle luxury 160 camere. Focus esperienza premium ospiti. Stagione alta aprile-ottobre.',
      dealContext: hotelDeal ? `Stage: ${hotelDeal.stage}. Probabilità ${hotelDeal.probability}%. Accordo verbale ottenuto, GM vuole procedere rapidamente.` : 'Accordo verbale, alta probabilità firma',
      estimatedDuration: 15,
      expectedOutputFormat: {
        type: 'mixed',
        description: 'Carica foto/scan del verbale meeting firmato (se cartaceo) + Google Sheet o documento Word con: per ogni punto discusso specifica Argomento, Decisione presa, Action item, Responsabile, Deadline',
        fields: ['Argomento', 'Decisione', 'Action Item', 'Responsabile', 'Deadline'],
        example: 'Scan verbale_firmato.pdf + verbale_dettagliato.xlsx con tabella: 1) Location lobby | Decisione: angolo destro ingresso | Action: sopralluogo | Responsabile: Staff tecnico | Deadline: 15 nov',
        documentRequired: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      userId: params.userId,
      type: 'follow_up',
      title: `CRITICO: Follow-up Giunta ${comuneDeal?.clientName || 'Comune di Assisi'} - 25 Ottobre`,
      description: 'Chiamata strategica giorno dopo approvazione Giunta comunale',
      aiRationale:
        'TIMING CRITICO: La Giunta comunale approva il 25 ottobre il progetto esperienza 360 Basiliche + postazione InfoPoint (€18.5k). Follow-up il 26 mattina è essenziale per capitalizzare approvazione e procedere con firma entro 10 novembre.',
      priority: 'critical',
      status: 'pending',
      scheduledAt: new Date(baseTime.setHours(9, 0)).toISOString(),
      clientId: params.clients.find(c => c.entityType === 'comune')?.id,
      clientName: comuneDeal?.clientName || 'Dott. Stefano Moretti',
      dealId: comuneDeal?.id,
      dealTitle: comuneDeal?.title || 'Esperienza 360 Basiliche + Postazione - Assisi',
      script: `Buongiorno Assessore Moretti,

Come sta? Volevo sentirla dopo la riunione di Giunta di ieri.

SE APPROVATO:
"Fantastico! Sono davvero entusiasta di lavorare su questo progetto per Assisi. Il patrimonio UNESCO delle Basiliche Francescane merita un'esperienza immersiva all'altezza.

PROSSIMI PASSI:
1. Contratto: posso inviarlo oggi per revisione legale?
2. Sopralluogo: quando possiamo fare shooting 360° delle location?
3. Timeline produzione:
   - Shooting: dicembre/gennaio
   - Post-produzione: febbraio
   - Installazione postazione InfoPoint: marzo
   - Evento inaugurale: aprile (come da vostra preferenza)
4. Meeting tecnico con Ufficio Turismo per definire location esatte?

Posso preparare documentazione per il Sindaco?"

SE NON APPROVATO O RINVIATO:
"Capisco. Posso chiederle cosa ha frenato l'approvazione?
- Budget? Possiamo rivedere le voci
- Timeline? Siamo flessibili
- Aspetti tecnici? Posso fornire chiarimenti

Quando sarà la prossima Giunta?"

VALORE DA ENFATIZZARE:
- Assisi = referenza prestigiosa per noi (5M turisti/anno!)
- Case study San Gimignano: ROI positivo, turisti adorano
- Esperienza unica: nessun altro comune ha 360° Basiliche
- Promozione UNESCO heritage con tecnologia`,
      talkingPoints: [
        'San Gimignano case study: postazione molto utilizzata, feedback eccellente',
        'Shooting 360° professionale: stesso team che ha fatto Uffizi Firenze',
        'Flessibilità massima su timeline per adattarci ai vostri ritmi',
        'Supporto marketing: comunicato stampa, contenuti social',
      ],
      objectives: [
        'Confermare approvazione Giunta',
        'Programmare firma contratto (entro 10 nov)',
        'Schedulare sopralluogo location',
        'Definire prossimi step operativi',
      ],
      clientContext:
        'Assessore Turismo molto favorevole, Sindaco supporta. Comune 28k abitanti, 5M turisti/anno, UNESCO. Budget ciclo anno solare.',
      dealContext: comuneDeal ? `Stage: ${comuneDeal.stage}. Probabilità ${comuneDeal.probability}%. Giunta approva 25 ottobre. Progetto completo: sviluppo esperienza 360° (6 location) + postazione InfoPoint + evento inaugurale.` : 'In valutazione Giunta, decisione imminente',
      estimatedDuration: 12,
      expectedOutputFormat: {
        type: 'document',
        description: 'Carica screenshot/foto della chiamata + documento di testo con: 1) Esito approvazione Giunta (SI/NO/RINVIATO), 2) Eventuali modifiche richieste al progetto, 3) Prossimi step operativi concordati con date, 4) Timeline firma contratto',
        example: 'Screenshot chiamata.jpg + documento Word: APPROVATO! Giunta ha approvato progetto completo €18.5k. Richiesta: aggiungere esperienza Basilica di San Francesco. Prossimi step: contratto entro 10 nov, sopralluogo location 15 nov, shooting dicembre.',
        documentRequired: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      userId: params.userId,
      type: 'call',
      title: 'Primo contatto: Museo Leonardo3 Milano',
      description: 'Prima chiamata a Direttore museo dopo incontro a fiera',
      aiRationale:
        'Lead qualificato da fiera Milano. Museo tech-oriented, già innovativo. Ottima opportunità per postazione complementare alle loro esposizioni. Meeting fissato per 25 ottobre.',
      priority: 'high',
      status: 'pending',
      scheduledAt: new Date(baseTime.setHours(11, 30)).toISOString(),
      clientId: params.clients.find(c => c.entityType === 'museo_privato')?.id,
      clientName: params.clients.find(c => c.entityType === 'museo_privato')?.name || 'Dott.ssa Chiara Rizzo',
      dealId: params.deals.find(d => d.entityType === 'museo_privato')?.id,
      dealTitle: 'Postazione VR Interattiva - Museo Leonardo3',
      script: `Buongiorno Dott.ssa Rizzo,

Sono ${params.userName}. È stato un piacere conoscerla alla fiera di Milano la settimana scorsa.

Come le accennavo, lavoriamo con musei privati per installare postazioni VR interattive che arricchiscono l'esperienza dei visitatori.

VALORE PER LEONARDO3:
- Postazione complementare alle vostre esposizioni interattive
- Esperienze VR su invenzioni di Leonardo:
  • Macchine volanti in azione VR
  • Anatomia umana immersiva 3D
  • Città ideale rinascimentale
  • Ultima Cena experience 360°
- Zero costi fissi: revenue share 70% museo / 30% nostra
- Installazione professionale, manutenzione inclusa

DOMANDE:
1. Quale area del museo sarebbe ideale per postazione VR?
2. I vostri 85.000 visitatori annui sono principalmente famiglie/scuole/turisti?
3. Avete già pensato a contenuti VR da offrire?
4. Quando potremmo fare sopralluogo per valutare spazio?

OBIETTIVO: Schedulare sopralluogo questa settimana e mostrare demo delle esperienze.`,
      talkingPoints: [
        'Museo già tech-forward: VR è evoluzione naturale',
        'Monetizzazione visitatori: esperienza premium opzionale',
        'Case study Museo Scienza Milano: ottimi risultati con VR',
        'Contenuti aggiornabili: sempre nuove esperienze',
      ],
      objectives: [
        'Schedulare sopralluogo museo questa settimana',
        'Capire interesse specifico su contenuti Leonardo',
        'Identificare altri decision makers se necessario',
        'Confermare budget disponibile (revenue share OK?)',
      ],
      clientContext:
        'Direttore museo tech-oriented, 85k visitatori/anno. Museo già innovativo con esposizioni interattive. Conosciuto a fiera, molto interessato.',
      dealContext: params.deals.find(d => d.entityType === 'museo_privato') ?
        `Stage: meeting_scheduled. Probabilità 70%. Meeting fissato per 25 ottobre. Interesse a postazione VR complementare.` :
        'Lead da fiera, alta qualità, meeting schedulato',
      estimatedDuration: 10,
      expectedOutputFormat: {
        type: 'google_sheet',
        description: 'Carica link a Google Sheet condiviso con colonne: Nome Museo, Contatto Principale, Ruolo, Email, Telefono, Area Museo Ideale, Contenuti VR Interesse, Budget Indicativo, Livello Interesse (1-5), Note, Next Step. Se non hai account Google, carica Excel/CSV.',
        fields: ['Nome Museo', 'Contatto Principale', 'Ruolo', 'Email', 'Telefono', 'Area Museo Ideale', 'Contenuti VR Interesse', 'Budget Indicativo', 'Livello Interesse', 'Note', 'Next Step'],
        example: 'https://docs.google.com/spreadsheets/d/... oppure museo_leonardo3_info.xlsx con riga: Museo Leonardo3 | Dott.ssa Chiara Rizzo | Direttore | c.rizzo@leonardo3.net | 02-xxx | Sala macchine | Leonardo VR | Revenue share | 4/5 | Molto interessata | Sopralluogo settimana prossima',
        documentRequired: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function generateMockInsights(params: GenerateTasksParams): AIInsight[] {
  const comuneDeal = params.deals.find(d => d.entityType === 'comune' && d.stage === 'under_review');
  const hotelDeal = params.deals.find(d => d.entityType === 'hotel' && d.stage === 'verbal_agreement');
  const scuolaDeal = params.deals.find(d => d.entityType === 'scuola' && d.stage === 'proposal_sent');

  return [
    {
      id: 'insight-1',
      userId: params.userId,
      type: 'warning',
      title: `🔴 CRITICO: Giunta Comune approva domani (25 ottobre)`,
      message:
        `Il Comune di ${comuneDeal?.clientName || 'Assisi'} ha Giunta decisionale DOMANI 25 ottobre per approvare il progetto esperienza 360° (€18.5k). Follow-up il 26 mattina è ESSENZIALE per capitalizzare approvazione e non perdere momentum. Probabilità attuale: ${comuneDeal?.probability || 80}%.`,
      priority: 'critical',
      actionable: true,
      suggestedAction: 'Prepara chiamata per 26 ottobre ore 9:00. Script già pronto nei task.',
      relatedDealId: comuneDeal?.id,
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-2',
      userId: params.userId,
      type: 'opportunity',
      title: `🎉 Alta probabilità chiusura: ${hotelDeal?.clientName || 'Grand Hotel Vesuvio'}`,
      message:
        `Accordo verbale ottenuto! GM vuole installazione pre-Pasqua 2026. Probabilità ${hotelDeal?.probability || 90}%. Questa settimana: preparare e inviare contratto revenue share. Zero costi per hotel = facile decisione. Deal ad alto impatto.`,
      priority: 'high',
      actionable: true,
      suggestedAction: 'Call con GM oggi per definire dettagli contratto. Invio contratto entro venerdì.',
      relatedDealId: hotelDeal?.id,
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-3',
      userId: params.userId,
      type: 'suggestion',
      title: `📚 Liceo: Enfatizza valore PCTO`,
      message:
        `Il deal con ${scuolaDeal?.clientName || 'Liceo Da Vinci'} è in attesa approvazione Collegio Docenti (fine novembre). Strategia: enfatizzare crediti PCTO validi per studenti + innovazione didattica STEM. Preside tech-friendly, DSGA attento budget ma favorevole. Probabilità ${scuolaDeal?.probability || 85}%.`,
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Follow-up settimanale con Preside. Offrire supporto per presentazione al Collegio.',
      relatedDealId: scuolaDeal?.id,
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-4',
      userId: params.userId,
      type: 'tip',
      title: '💡 Pattern stagionalità identificato',
      message:
        'Analisi pipeline: Hotel decidono più rapidamente in inverno (pre-stagione). Comuni hanno ciclo budget annuale (approvazioni set-nov). Scuole: contatta set-dic, evita periodo esami (mag-giu). Usa questi timing per prioritizzare outreach.',
      priority: 'low',
      actionable: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function generateMotivationalMessage(
  yesterdayCompleted: number,
  yesterdayTotal: number,
  todayTasks: number
): string {
  if (yesterdayCompleted === 0) {
    return `Buongiorno! Oggi è un nuovo giorno. Hai ${todayTasks} task strategici che ti porteranno più vicino ai tuoi obiettivi. Let's go! 🚀`;
  }

  const completionRate =
    yesterdayTotal > 0 ? (yesterdayCompleted / yesterdayTotal) * 100 : 0;

  if (completionRate >= 80) {
    return `Ottimo lavoro ieri! ${yesterdayCompleted}/${yesterdayTotal} task completati. Oggi hai ${todayTasks} opportunità per continuare questo momentum! 💪`;
  } else if (completionRate >= 50) {
    return `Buongiorno! Ieri ${yesterdayCompleted}/${yesterdayTotal} task completati. Oggi ${todayTasks} task focalizzati per massimizzare l'impatto. 🎯`;
  } else {
    return `Nuovo giorno, nuove opportunità! ${todayTasks} task strategici ti aspettano. Focus su una task alla volta. 🌟`;
  }
}

function extractFocusAreas(tasks: AITask[]): string[] {
  const areas: string[] = [];

  const criticalCount = tasks.filter((t) => t.priority === 'critical').length;
  if (criticalCount > 0) {
    areas.push(`${criticalCount} task critici - massima priorità`);
  }

  const callsCount = tasks.filter((t) => t.type === 'call').length;
  if (callsCount > 0) {
    areas.push(`${callsCount} chiamate da effettuare`);
  }

  const stalledDeals = tasks.filter((t) =>
    t.aiRationale?.toLowerCase().includes('stall')
  ).length;
  if (stalledDeals > 0) {
    areas.push(`Recupera ${stalledDeals} deal in stallo`);
  }

  return areas.length > 0
    ? areas
    : ['Mantieni momentum su deal attivi', 'Qualifica nuovi lead'];
}
