import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { relationships } = await request.json();

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        suggestions: { main: [], bonus: [] }
      });
    }

    // Prepara il prompt per Claude
    const relationshipsContext = relationships.map((r: any, idx: number) =>
      `${idx + 1}. ${r.name} (${r.role} @ ${r.company})
   - Forza: ${r.strength}
   - Importanza: ${r.importance}
   - Categoria: ${r.category}
   - Bilancio valore: ${r.valueBalance}
   - Ultimo contatto: ${r.lastContact}
   - Prossima azione: ${r.nextAction || 'Non definita'}
   - Azioni completate: ${r.actionsHistory}
   - Note: ${r.noteCount}`
    ).join('\n\n');

    const prompt = `Analizza queste relazioni professionali e genera suggerimenti intelligenti di task da fare:

${relationshipsContext}

Genera esattamente 3 task prioritari (alta priorità) e 5 task bonus (media/bassa priorità).

Per ogni task specifica:
- relazione: nome della persona
- relazioneId: usa l'id dalla lista (se disponibile, altrimenti usa il nome)
- task: descrizione concisa del task (max 80 caratteri)
- motivo: spiegazione del perché questo task è importante (max 150 caratteri)
- priorita: 'alta', 'media' o 'bassa'

Criteri per task prioritari (alta):
- Relazioni critiche non contattate da molto tempo
- Squilibri di valore da correggere
- Opportunità urgenti
- Azioni mancanti per relazioni importanti

Criteri per task bonus (media/bassa):
- Mantenimento relazioni
- Approfondimenti strategici
- Networking
- Follow-up periodici

Rispondi SOLO con JSON valido in questo formato:
{
  "main": [
    { "relazione": "Nome", "relazioneId": "id", "task": "...", "motivo": "...", "priorita": "alta" }
  ],
  "bonus": [
    { "relazione": "Nome", "relazioneId": "id", "task": "...", "motivo": "...", "priorita": "media" }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Add IDs to suggestions
    suggestions.main = suggestions.main.map((s: any, idx: number) => ({
      ...s,
      id: `main-${idx}`,
      relazioneId: s.relazioneId || s.relazione
    }));

    suggestions.bonus = suggestions.bonus.map((s: any, idx: number) => ({
      ...s,
      id: `bonus-${idx}`,
      relazioneId: s.relazioneId || s.relazione
    }));

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);

    // Fallback to manual suggestions on error
    return NextResponse.json({
      suggestions: {
        main: [],
        bonus: []
      },
      error: 'AI generation failed, using manual suggestions'
    }, { status: 200 }); // Still return 200 to let frontend handle fallback
  }
}
