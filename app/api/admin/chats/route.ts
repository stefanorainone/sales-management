import { NextRequest, NextResponse } from 'next/server';
import type { AICoachSession, AICoachMessage } from '@/types';

// Mock storage - in production, use database
let mockChatSessions: AICoachSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    messages: [
      {
        id: 'msg-1',
        userId: 'user-1',
        role: 'user',
        content: 'Come posso convincere il preside del Liceo Da Vinci ad approvare la proposta?',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: 'msg-2',
        userId: 'user-1',
        role: 'assistant',
        content: `Ottima domanda! Per convincere il Preside del Liceo Da Vinci, ti consiglio di:

1. **Enfatizzare i crediti PCTO**: I licei scientifici danno molto valore ai percorsi per le competenze trasversali. L'evento VR può essere certificato come PCTO valido.

2. **Focus sull'innovazione didattica**: Il preside è tech-friendly secondo le tue note. Sottolinea come VR supporta l'apprendimento STEM in modo innovativo.

3. **Case study concreti**: Menziona il Liceo Galilei di Padova che ha fatto un evento simile con feedback eccellente da studenti e docenti.

4. **Supporto documentazione**: Offri di preparare materiale per il Collegio Docenti che si riunisce a fine novembre.

5. **Flessibilità**: Mostra disponibilità ad adattare date (marzo/aprile) in base al calendario scolastico.

Il DSGA è attento al budget ma favorevole, quindi assicurati che la proposta economica sia chiara e trasparente.`,
        timestamp: new Date(Date.now() - 7100000).toISOString(),
      },
      {
        id: 'msg-3',
        userId: 'user-1',
        role: 'user',
        content: 'Perfetto! E per il budget, quanto dovrei chiedere per 250 studenti?',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 'msg-4',
        userId: 'user-1',
        role: 'assistant',
        content: `Per un evento VR con 250 studenti, ecco la struttura di pricing consigliata:

**Pacchetto Standard (consigliato):**
- 250 studenti
- 4 ore di evento
- 3-4 esperienze VR diverse
- 6 postazioni VR simultanee
- Assistenza tecnica on-site
- **Prezzo: €3.500 - €4.500**

**Cosa includere nella proposta:**
- Costo per studente: €14-18/studente
- Setup e assistenza tecnica inclusi
- Esperienze VR: Sistema Solare, Corpo Umano, Molecole 3D
- Crediti PCTO certificati
- Report finale con feedback studenti

**Strategia di pricing per scuole:**
- Sottolinea il valore per studente (€15-18 è molto accessibile)
- Evidenzia che non ci sono costi nascosti
- Possibilità di pagamento in 2 rate (acconto + saldo post-evento)

Per il Liceo Da Vinci, considerando che sono 850 studenti totali e è un liceo scientifico prestigioso, punta su €4.200 con possibilità di scendere a €3.800 se serve per chiudere.`,
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    lastMessageAt: new Date(Date.now() - 3500000).toISOString(),
    topic: 'objection handling',
  },
  {
    id: 'session-2',
    userId: 'user-2',
    messages: [
      {
        id: 'msg-5',
        userId: 'user-2',
        role: 'user',
        content: 'Il GM dell\'Hotel Roma Palace mi ha chiesto maggiori dettagli sul revenue share. Come glielo spiego?',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      },
      {
        id: 'msg-6',
        userId: 'user-2',
        role: 'assistant',
        content: `Ottimo, il GM è interessato! Ecco come presentare il revenue share in modo chiaro:

**Modello Revenue Share 70/30:**
- 70% Hotel
- 30% VR Company
- **Zero costi fissi per l'hotel**

**Come spiegarlo al GM:**
"Dott. [Nome], il nostro modello è pensato per essere win-win senza rischi:

1. **Installazione e manutenzione incluse** - nessun costo iniziale
2. **L'hotel guadagna il 70%** di ogni utilizzo VR da parte degli ospiti
3. **Noi guadagniamo solo se funziona** - incentivo ad avere esperienze di qualità
4. **Esperienza premium** per gli ospiti luxury senza investimento

**Esempio concreto:**
- Prezzo esperienza VR: €15/ospite
- Su 100 utilizzi/mese = €1.500
- L'hotel riceve: €1.050 (70%)
- Noi riceviamo: €450 (30%)

**Vantaggi per l'hotel:**
- Nuovo revenue stream
- Differenziazione vs concorrenti
- Marketing: 'Primo hotel 5 stelle a Roma con VR experience'
- Analytics mensili per ottimizzare"

Sottolinea che altri hotel 5 stelle stanno già usando questo modello con successo.`,
        timestamp: new Date(Date.now() - 1700000).toISOString(),
      },
    ],
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    lastMessageAt: new Date(Date.now() - 1700000).toISOString(),
    topic: 'demo prep',
  },
  {
    id: 'session-3',
    userId: 'user-3',
    messages: [
      {
        id: 'msg-7',
        userId: 'user-3',
        role: 'user',
        content: 'Non so come approcciare un comune. È molto diverso da hotel?',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      },
      {
        id: 'msg-8',
        userId: 'user-3',
        role: 'assistant',
        content: `Sì, i comuni sono MOLTO diversi dagli hotel. Ecco le differenze chiave:

**Ciclo di vendita:**
- Hotel: 2-4 settimane
- Comuni: 3-6 MESI (molto più lungo!)

**Decision maker:**
- Hotel: GM decide
- Comuni: Giunta comunale + Sindaco (decisione collegiale)

**Budget:**
- Hotel: Revenue share (no budget upfront)
- Comuni: Budget annuale fisso, approvazioni in Giunta

**Timing critico per comuni:**
- Set-Nov: Approvazioni budget anno successivo
- Dic-Feb: Programmazione
- Mar-Giu: Esecuzione progetti approvati
- **Evita:** Lug-Ago (ferie), periodo elettorale

**Come approcciare:**
1. **Contatta Assessore Turismo/Cultura** (non Sindaco subito)
2. **Enfatizza ROI turistico**: più visitatori, promozione patrimonio
3. **Case study comuni simili**: San Gimignano, Assisi
4. **Patrimonio UNESCO**: se applicabile, è un forte argomento
5. **Co-marketing**: offriti di supportare comunicazione

**Documenti necessari:**
- Preventivo dettagliato
- Portfolio esperienze realizzate
- Case study con metriche
- Proposta valore per territorio

I comuni vogliono vedere "investimento nel territorio", non solo "servizio". Parla di valorizzazione patrimonio, attrattività turistica, innovazione.`,
        timestamp: new Date(Date.now() - 800000).toISOString(),
      },
    ],
    startedAt: new Date(Date.now() - 900000).toISOString(),
    lastMessageAt: new Date(Date.now() - 800000).toISOString(),
    topic: 'strategy',
  },
];

// GET - Fetch chat sessions for a specific user or all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const userSessions = mockChatSessions.filter((session) => session.userId === userId);
      return NextResponse.json(userSessions);
    }

    // Return all sessions
    return NextResponse.json(mockChatSessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 });
  }
}

// POST - Admin intervention in a chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, adminMessage, adminId } = body;

    if (!sessionId || !adminMessage) {
      return NextResponse.json(
        { error: 'sessionId and adminMessage are required' },
        { status: 400 }
      );
    }

    const sessionIndex = mockChatSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = mockChatSessions[sessionIndex];

    // Add admin message to the session
    const adminMessageObj: AICoachMessage = {
      id: `msg-admin-${Date.now()}`,
      userId: session.userId,
      role: 'assistant', // Admin message appears as assistant
      content: `📢 **Messaggio dall'Admin:**\n\n${adminMessage}`,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(adminMessageObj);
    session.lastMessageAt = new Date().toISOString();

    return NextResponse.json({ success: true, message: adminMessageObj });
  } catch (error) {
    console.error('Error posting admin intervention:', error);
    return NextResponse.json({ error: 'Failed to post admin intervention' }, { status: 500 });
  }
}
