import { Card, CardHeader, Button, Select } from '@/components/ui';

export default function AIConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Configuration Center</h1>
        <p className="text-gray-600 mt-2">Configura il comportamento dell'AI per il tuo team di vendita</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button className="border-b-2 border-primary py-4 px-1 text-sm font-medium text-primary">
            Comportamento AI
          </button>
          <button className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Priorità
          </button>
          <button className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Automazioni
          </button>
          <button className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Performance AI
          </button>
        </nav>
      </div>

      {/* Obiettivi Business */}
      <Card>
        <CardHeader title="🎯 Obiettivi Business Correnti" subtitle="Istruisci l'AI su cosa prioritizzare questo periodo" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Focus primario:</label>
            <Select>
              <option>Closing deals esistenti (Q-end push)</option>
              <option>New business / Lead generation</option>
              <option>Account expansion / Upselling</option>
              <option>Relationship building</option>
              <option>Pipeline velocity</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Focus secondario:</label>
            <Select>
              <option>Lead generation</option>
              <option>Closing deals esistenti</option>
              <option>Account expansion</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contesto addizionale per AI:</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32"
              placeholder="Es: Siamo a fine Q1. Priorità assoluta chiudere deal in stage Negotiation e Proposal. Secondo obiettivo: riempire pipeline per Q2. Settore focus: Tech companies 50-200 emp."
              defaultValue="Siamo a fine Q1. Priorità assoluta chiudere deal in stage Negotiation e Proposal. Secondo obiettivo: riempire pipeline per Q2. Settore focus: Tech companies 50-200 emp."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              🤖 AI interpreterà questi obiettivi per generare task e suggerimenti allineati.
            </p>
          </div>
        </div>
      </Card>

      {/* Parametri Comportamento */}
      <Card>
        <CardHeader title="🎚️ Parametri Comportamento AI" />

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Aggressività suggerimenti:</label>
              <span className="text-sm text-gray-600">60%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="60" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservativo</span>
              <span>Aggressivo (Più task, più pressione)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Focus qualità vs quantità:</label>
              <span className="text-sm text-gray-600">70%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Qualità (pochi task mirati)</span>
              <span>Quantità (molti task)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Autonomia AI:</label>
              <span className="text-sm text-gray-600">40%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="40" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Supervisione (solo suggerisce)</span>
              <span>Autonomia (auto-assegna)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Lunghezza context:</label>
              <span className="text-sm text-gray-600">80%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conciso</span>
              <span>Dettagliato</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Risk tolerance (suggerimenti non convenzionali):</label>
              <span className="text-sm text-gray-600">60%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="60" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Safe</span>
              <span>Sperimentale</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personalità AI */}
      <Card>
        <CardHeader title="🎭 Personalità AI Assistant" subtitle="Come deve comportarsi l'AI con i venditori?" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tono:</label>
            <Select>
              <option>Professionale e motivazionale</option>
              <option>Professionale e diretto</option>
              <option>Coach supportivo</option>
              <option>Drill sergeant (esigente)</option>
              <option>Amichevole e casual</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Celebra successi e milestone</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Fornisci feedback costruttivo su errori</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Modalità competitiva (spinge per leaderboard)</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Timing & Scheduling */}
      <Card>
        <CardHeader title="⏰ Timing & Scheduling" subtitle="Quando AI genera task" />

        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Daily analysis alle 18:00 (task per domani)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Morning boost alle 08:00 (reminder + update)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-gray-700">Real-time (continuo durante giornata)</span>
          </label>

          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Task planning window:</label>
              <span className="text-sm text-gray-600">1 giorno avanti</span>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">1d</button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm">3d</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">5d</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">7d</button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Lead inactivity threshold:</label>
              <span className="text-sm text-gray-600">5 giorni</span>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">3</button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm">5</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">7</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">10</button>
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">14</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Giorni senza contatto prima di alert</p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button>💾 Salva Configurazione</Button>
        <Button variant="secondary">🔄 Reset to Defaults</Button>
        <Button variant="ghost">📋 Esporta Config</Button>
      </div>

      {/* AI Performance Preview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h3 className="font-semibold text-gray-900 mb-3">📊 Impact Preview</h3>
        <p className="text-sm text-gray-700 mb-3">
          Con queste impostazioni, l'AI genererà circa:
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">7-8</div>
            <div className="text-xs text-gray-600">task/giorno per venditore</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">65%</div>
            <div className="text-xs text-gray-600">focus su closing deals</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">35%</div>
            <div className="text-xs text-gray-600">focus su prospecting</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
