import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Function to search for real Italian prospects using Tavily
async function searchRealProspects(sectors: string[], roles: string[]) {
  try {
    // Skip if no Tavily API key
    if (!process.env.TAVILY_API_KEY) {
      console.log('Tavily API key not configured, skipping real prospect search');
      return [];
    }

    // Lazy import and initialize Tavily only when needed
    const { tavily } = await import('@tavily/core');
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    // Build search queries focused on culture, tourism, education, museums, VR
    const searchQueries = [
      `direttore CEO museo italia cultura turismo 2024 2025`,
      `innovazione digitale musei VR realtà virtuale italia cultura`,
      `educazione scuole progetti culturali turismo esperienziale italia`,
      `istituzioni culturali innovazione turismo sostenibile italia 2024`
    ];

    const allResults: any[] = [];

    // Execute searches
    for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries to save API calls
      try {
        const response = await tvly.search(query, {
          maxResults: 3,
          searchDepth: 'basic',
          includeAnswer: false,
          includeRawContent: false
        });

        if (response?.results) {
          allResults.push(...response.results);
        }
      } catch (error) {
        console.error('Tavily search error:', error);
      }
    }

    return allResults;
  } catch (error) {
    console.error('Error in searchRealProspects:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { relationships, userId, forceRegenerate } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        suggestions: { existingRelations: [], newProspects: [] }
      });
    }

    // Check if suggestions were already generated today (unless forceRegenerate is true)
    if (!forceRegenerate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingSessionsSnapshot = await db
        .collection('aiSuggestionsSessions')
        .where('userId', '==', userId)
        .where('generatedAt', '>=', Timestamp.fromDate(today))
        .orderBy('generatedAt', 'desc')
        .limit(1)
        .get();

      if (!existingSessionsSnapshot.empty) {
        // Return existing session suggestions
        const session = existingSessionsSnapshot.docs[0].data();

        // Get saved prospects from this session
        const prospectsSnapshot = await db
          .collection('aiProspectSuggestions')
          .where('userId', '==', userId)
          .where('generatedAt', '>=', Timestamp.fromDate(today))
          .orderBy('generatedAt', 'desc')
          .get();

        const savedProspects = prospectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return NextResponse.json({
          suggestions: {
            existingRelations: session.existingRelations || [],
            newProspects: savedProspects.map((p: any, idx: number) => ({
              id: `prospect-${idx}`,
              nome: p.nome,
              ruolo: p.ruolo,
              azienda: p.azienda,
              settore: p.settore,
              motivo: p.motivo,
              fonte: p.fonte,
            })),
          },
          cached: true,
          generatedAt: session.generatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }
    }

    // Analizza settori e ruoli dalle relazioni esistenti
    const sectors = [...new Set(relationships.map((r: any) => {
      const company = r.company || '';
      // Estrai informazioni sul settore dal nome azienda o ruolo
      return company;
    }).filter(Boolean))];

    const roles = [...new Set(relationships.map((r: any) => r.role).filter(Boolean))] as string[];

    // Crea contesto per ricerca prospect (focus su cultura, turismo, educazione)
    const sectorsContext = sectors.length > 0 ? sectors.slice(0, 5).join(', ') : 'cultura, turismo, musei, educazione, VR';
    const rolesContext = roles.length > 0 ? roles.slice(0, 5).join(', ') : 'Direttore Museo, Assessore, Responsabile Cultura';

    // Search for real prospects using Tavily
    const searchResults = await searchRealProspects(sectors as string[], roles);

    // Format search results for the prompt
    const searchResultsContext = searchResults.length > 0
      ? searchResults.slice(0, 5).map((result, idx) =>
          `${idx + 1}. ${result.title}\n   URL: ${result.url}\n   Snippet: ${result.content?.substring(0, 200) || 'N/A'}`
        ).join('\n\n')
      : 'Nessun risultato di ricerca disponibile - usa la tua conoscenza generale.';

    // Prepara il prompt per Claude
    const relationshipsContext = relationships.map((r: any, idx: number) =>
      `${idx + 1}. ${r.name} (${r.role} @ ${r.company}) [ID: ${r.id}]
   - Forza: ${r.strength}
   - Importanza: ${r.importance}
   - Categoria: ${r.category}
   - Bilancio valore: ${r.valueBalance}
   - Ultimo contatto: ${r.lastContact}
   - Prossima azione: ${r.nextAction || 'Non definita'}
   - Azioni completate: ${r.actionsHistory}
   - Note: ${r.noteCount}`
    ).join('\n\n');

    const prompt = `Analizza queste relazioni professionali e genera suggerimenti intelligenti con PERSONE REALI E VERIFICABILI:

${relationshipsContext}

SETTORI RILEVANTI: ${sectorsContext}
RUOLI CHIAVE: ${rolesContext}

RISULTATI DI RICERCA WEB RECENTI (USA SOLO QUESTI):
${searchResultsContext}

⚠️ IMPORTANTE: Per "Persone che dovresti conoscere", usa ESCLUSIVAMENTE le informazioni dai risultati di ricerca sopra.
NON inventare nomi o aziende. Se i risultati di ricerca non sono sufficienti, restituisci meno prospect o array vuoto.

GENERA DUE TIPI DI SUGGERIMENTI:

1. ESISTENTI: 3 task per rafforzare relazioni esistenti

2. PERSONE CHE DOVRESTI CONOSCERE: 3 professionisti REALI E VERIFICABILI
   CRITICO: Devi fornire SOLO persone che esistono veramente e possono essere trovate online.

   ESEMPI DI PERSONE REALI (NON usare questi, trova altri simili):
   - Riccardo Donadon (Founder H-FARM)
   - Alessandro Rimassa (CEO Jakala)
   - Marco Hannappel (CEO Philip Morris Italia)
   - Cristina Scocchia (CEO Illycaffè)
   - Diego Piacentini (Ex VP Amazon, Advisor)

ISTRUZIONI PER I TASK SU RELAZIONI ESISTENTI:
- relazione: nome della persona dalla lista
- relazioneId: usa l'ID mostrato tra parentesi quadre [ID: xyz] nella lista delle relazioni
- task: azione concreta (max 80 caratteri)
- motivo: perché rafforza la relazione (max 150 caratteri)

ISTRUZIONI CRITICHE PER "PERSONE CHE DOVRESTI CONOSCERE":

⚠️ OBBLIGATORIO - Ogni persona DEVE essere:
1. Estratta ESCLUSIVAMENTE dai "RISULTATI DI RICERCA WEB RECENTI" sopra
2. Nome e cognome COMPLETI presi dall'articolo
3. CEO, Founder, o C-level executive menzionato nell'articolo
4. Azienda italiana o operante in Italia menzionata nell'articolo

FORMATO RICHIESTO:
- nome: Nome Cognome ESATTO dall'articolo (NON inventare)
- ruolo: Ruolo menzionato nell'articolo
- azienda: Nome ESATTO dell'azienda dall'articolo
- settore: Settore dell'azienda dall'articolo
- motivo: Riassunto del perché è rilevante dall'articolo (funding, crescita, etc.) max 150 caratteri
- fonte: URL ESATTO dal risultato di ricerca (quello fornito nei risultati sopra)

SETTORI PRIORITARI PER PROSPECT:
- Cultura & Patrimonio (musei, fondazioni, enti culturali)
- Turismo & Hospitality (turismo esperienziale, destination marketing)
- Educazione & Scuole (progetti educativi, didattica innovativa)
- Innovazione Culturale (VR/AR, digital heritage, gamification)
- Istituzioni Pubbliche (comuni, regioni, soprintendenze)
- Edutainment & Experience Design

FONTI ACCETTABILI:
✅ linkedin.com/in/[nome-persona]
✅ ilsole24ore.com
✅ repubblica.it (cultura, turismo)
✅ ansa.it (cultura, turismo)
✅ artribune.com
✅ beniculturali.it
✅ turismo.it
✅ agendadigitale.eu (cultura digitale)
✅ corriere.it/cultura
✅ Riviste specializzate (Archeomatica, MuseumNext, etc.)

❌ NON usare: esempio.com, sample.com, test.com, URL inventati

CRITERI DI SELEZIONE:
- Preferisci direttori di musei, responsabili cultura, assessori al turismo
- Preferisci decisori in istituzioni culturali, scuole, enti pubblici
- Focalizzati su progetti innovativi: VR/AR nei musei, turismo esperienziale, didattica digitale
- Preferisci persone coinvolte in bandi culturali, finanziamenti PNRR, progetti europei
- Cerca responsabili marketing turistico, destination manager, operatori culturali

Rispondi SOLO con JSON valido in questo formato:
{
  "existingRelations": [
    { "relazione": "Nome", "relazioneId": "id", "task": "...", "motivo": "..." }
  ],
  "newProspects": [
    { "nome": "Nome Cognome REALE", "ruolo": "...", "azienda": "Azienda REALE", "settore": "...", "motivo": "...", "fonte": "https://URL-REALE.com/articolo" }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{
        role: 'system',
        content: 'You are an AI assistant that helps sales professionals identify relationship-building tasks and new prospects. Always respond with valid JSON.'
      }, {
        role: 'user',
        content: prompt
      }]
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response (OpenAI guarantees valid JSON with response_format)
    if (!responseText) {
      throw new Error('Empty AI response');
    }

    const suggestions = JSON.parse(responseText);

    // Add IDs to suggestions
    suggestions.existingRelations = (suggestions.existingRelations || []).map((s: any, idx: number) => ({
      ...s,
      id: `existing-${idx}`,
      relazioneId: s.relazioneId || s.relazione
    }));

    suggestions.newProspects = (suggestions.newProspects || []).map((s: any, idx: number) => ({
      ...s,
      id: `prospect-${idx}`
    }));

    // Save suggestions to database
    try {
      const now = Timestamp.now();

      // Save session
      await db.collection('aiSuggestionsSessions').add({
        userId,
        generatedAt: now,
        existingRelations: suggestions.existingRelations || [],
        newProspectsCount: (suggestions.newProspects || []).length,
        createdAt: now,
        updatedAt: now,
      });

      // Save each prospect suggestion
      const batch = db.batch();
      for (const prospect of (suggestions.newProspects || [])) {
        const prospectRef = db.collection('aiProspectSuggestions').doc();
        batch.set(prospectRef, {
          userId,
          nome: prospect.nome,
          ruolo: prospect.ruolo,
          azienda: prospect.azienda,
          settore: prospect.settore,
          motivo: prospect.motivo,
          fonte: prospect.fonte,
          generatedAt: now,
          contacted: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      await batch.commit();

      console.log(`✅ Saved ${(suggestions.newProspects || []).length} AI prospect suggestions for user ${userId}`);
    } catch (saveError) {
      console.error('Error saving suggestions to database:', saveError);
      // Continue anyway, we can still return the suggestions
    }

    return NextResponse.json({
      suggestions,
      cached: false,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);

    // Fallback to manual suggestions on error
    return NextResponse.json({
      suggestions: {
        existingRelations: [],
        newProspects: []
      },
      error: 'AI generation failed, using manual suggestions'
    }, { status: 200 }); // Still return 200 to let frontend handle fallback
  }
}
