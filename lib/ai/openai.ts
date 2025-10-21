import OpenAI from 'openai';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const API_KEY = process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

// Initialize client only if not in demo mode and API key is valid
if (!DEMO_MODE && API_KEY && API_KEY !== 'sk-placeholder') {
  try {
    client = new OpenAI({
      apiKey: API_KEY,
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI client:', error);
  }
}

/**
 * Get OpenAI client instance
 * Returns mock client in DEMO_MODE or when API is unavailable
 */
export function getOpenAI(): OpenAI {
  if (DEMO_MODE || !client) {
    return createMockClient();
  }
  return client;
}

/**
 * Create a mock OpenAI client for demo/development
 */
function createMockClient(): any {
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

          const userMessage = params.messages?.find((m: any) => m.role === 'user')?.content || '';
          const systemMessage = params.messages?.find((m: any) => m.role === 'system')?.content || '';

          // Generate mock response based on context
          const content = generateMockResponse(userMessage, systemMessage);

          return {
            id: `chatcmpl_demo_${Date.now()}`,
            object: 'chat.completion',
            created: Date.now(),
            model: params.model || 'gpt-4o',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: content
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: Math.floor((userMessage + systemMessage).length / 4),
              completion_tokens: Math.floor(content.length / 4),
              total_tokens: Math.floor((userMessage + systemMessage + content).length / 4)
            }
          };
        }
      }
    }
  };
}

/**
 * Generate intelligent mock responses based on context
 */
function generateMockResponse(userMessage: string, systemMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  const lowerSystem = systemMessage.toLowerCase();

  // Task generation
  if (lowerSystem.includes('task') || lowerMessage.includes('genera') && lowerMessage.includes('task')) {
    return JSON.stringify([
      {
        title: 'Follow-up Cliente Museo Arte Moderna',
        description: 'Chiamata di follow-up per discutere proposta VR tour. Cliente ha mostrato forte interesse.',
        context: 'Ultimo contatto 3 giorni fa. Budget €35k confermato. Decisore: Dr. Rossi.',
        urgencyScore: 85,
        priority: 'high',
        suggestedTime: '10:00-10:30',
        relatedClientId: 'demo-client-1',
        talkingPoints: [
          'Confermare budget e timeline',
          'Discutere integrazione con sistema esistente',
          'Proporre pilot project ridotto'
        ],
        aiRationale: 'Cliente ad alto potenziale con budget confermato. Il momento è critico per chiudere.',
        confidence: 88
      },
      {
        title: 'Inviare Proposta Hotel Resort Toscana',
        description: 'Preparare e inviare proposta completa per Virtual Tour camere premium.',
        context: 'Richiesta ricevuta ieri. Hotel 5 stelle in ristrutturazione. Budget Q1.',
        urgencyScore: 90,
        priority: 'critical',
        suggestedTime: '14:00-15:00',
        relatedClientId: 'demo-client-2',
        talkingPoints: [
          'Includere case study hotel simili',
          'ROI specifico per booking diretto',
          'Opzioni pacchetto base e premium'
        ],
        aiRationale: 'Richiesta esplicita con urgenza. Invio rapido aumenta probabilità chiusura del 40%.',
        confidence: 92
      },
      {
        title: 'Preparare Demo Scuola Primaria',
        description: 'Setup demo software educativo VR per meeting di domani con dirigente.',
        context: 'Meeting confermato domani ore 11. Portare 2 headset e contenuti scienze.',
        urgencyScore: 75,
        priority: 'high',
        suggestedTime: '16:00-17:00',
        relatedClientId: 'demo-client-3',
        talkingPoints: [
          'Funzionalità specifiche per curriculum',
          'Training docenti incluso',
          'Possibilità fondi PON'
        ],
        aiRationale: 'Demo dal vivo con decisore presente. Conversione stimata 65% se eseguita bene.',
        confidence: 78
      }
    ]);
  }

  // Default response
  return 'Mock AI response in DEMO_MODE. Configure OPENAI_API_KEY for real AI features.';
}

export interface AITaskGenerationInput {
  sellerId: string;
  sellerName: string;
  activities: any[];
  deals: any[];
  inactiveLeads: any[];
  historicalMetrics: any;
  goals: {
    revenue: number;
    deals: number;
    activities: number;
  };
  aiConfig?: any;
}

export interface GeneratedTask {
  title: string;
  description: string;
  context: string;
  urgencyScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedTime?: string;
  relatedClientId?: string;
  talkingPoints?: string[];
  aiRationale: string;
  confidence: number;
}

export async function generateDailyTasks(
  input: AITaskGenerationInput
): Promise<GeneratedTask[]> {
  const systemPrompt = `Sei un AI Sales Coach esperto. Analizza le attività giornaliere del venditore e genera:

1. Performance summary (0-100 score)
2. 7-10 task prioritizzati per domani
3. Per ogni task includi:
   - Urgency score (0-100)
   - Valore potenziale
   - Probabilità successo
   - Rationale specifico
   - Talking points pratici

Sii diretto, pratico, motivazionale ma realistico.
Output in formato JSON.`;

  const userPrompt = `
VENDITORE: ${input.sellerName} (ID: ${input.sellerId})
DATA: ${new Date().toISOString().split('T')[0]}

ATTIVITÀ OGGI:
${JSON.stringify(input.activities, null, 2)}

DEALS PIPELINE:
${JSON.stringify(input.deals, null, 2)}

LEAD INATTIVI (>3 giorni):
${JSON.stringify(input.inactiveLeads, null, 2)}

PERFORMANCE STORICA (30gg):
${JSON.stringify(input.historicalMetrics, null, 2)}

OBIETTIVI MENSILI:
- Revenue: €${input.goals.revenue}k
- Deals: ${input.goals.deals}
- Activities: ${input.goals.activities}

Genera 7-10 task prioritizzati con rationale per domani in formato JSON array:
[{
  "title": "...",
  "description": "...",
  "context": "...",
  "urgencyScore": 0-100,
  "priority": "critical|high|medium|low",
  "suggestedTime": "HH:mm-HH:mm",
  "relatedClientId": "...",
  "talkingPoints": ["...", "..."],
  "aiRationale": "...",
  "confidence": 0-100
}]
`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    // Parse response
    const responseText = completion.choices[0]?.message?.content || '{}';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);
    const tasks: GeneratedTask[] = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    return tasks;
  } catch (error) {
    console.error('Error generating tasks with OpenAI:', error);
    throw error;
  }
}

export interface LeadScoringInput {
  lead: any;
  sellerHistory: any;
}

export async function scoreLeadUrgency(
  input: LeadScoringInput
): Promise<number> {
  // Simple rule-based scoring
  let score = 0;

  const daysSinceContact = input.lead.daysSinceLastContact || 0;
  if (daysSinceContact > 7) score += 40;
  if (daysSinceContact > 14) score += 20;

  if (input.lead.stage === 'negotiation' && daysSinceContact > 3) score += 30;
  if (input.lead.value > 30000) score += 15;
  if (input.lead.source === 'referral') score += 10;

  // Could be enhanced with ML model
  return Math.min(score, 100);
}

export interface PerformanceAnalysisInput {
  sellerId: string;
  activities: any[];
  deals: any[];
  metrics: any;
}

export async function analyzePerformance(
  input: PerformanceAnalysisInput
): Promise<string> {
  const prompt = `Analizza la performance giornaliera del venditore:

Attività: ${JSON.stringify(input.activities)}
Deals: ${JSON.stringify(input.deals)}
Metriche: ${JSON.stringify(input.metrics)}

Fornisci:
1. Performance score (0-100)
2. Punti di forza (2-3)
3. Aree di miglioramento (2-3)
4. Pattern comportamentali rilevanti
5. Suggerimenti actionable

Formato markdown, massimo 300 parole.`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || 'Performance analysis unavailable';
  } catch (error) {
    console.error('Error analyzing performance:', error);
    return 'Performance analysis unavailable';
  }
}

// Export utility functions
export const AI = {
  getOpenAI,
  isAvailable: () => !DEMO_MODE && !!client,
  isDemoMode: () => DEMO_MODE,
};

export default getOpenAI;
