import { Card, CardHeader, Badge, Button } from '@/components/ui';

export default function AITasksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Task Manager</h1>
        <p className="text-gray-600 mt-2">Task intelligenti generati da AI per massimizzare le tue performance</p>
      </div>

      {/* AI Status */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-4xl mr-4">🤖</div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant Attivo</h3>
              <p className="text-sm text-gray-600 mt-1">Ultimo aggiornamento: 5 minuti fa</p>
              <p className="text-sm text-gray-600">Prossima analisi: Oggi alle 18:00</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">87%</div>
            <div className="text-sm text-gray-600">Confidenza AI</div>
          </div>
        </div>
      </Card>

      {/* Today's AI Tasks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Oggi - 16 Ottobre</h2>

        {/* Critical Priority Task */}
        <Card className="mb-4 border-2 border-red-200 bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <input type="checkbox" className="mt-1 mr-4" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="danger">PRIORITÀ CRITICA</Badge>
                  <Badge variant="gray" size="sm">Urgenza: 95/100</Badge>
                </div>

                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Chiamata Beta SRL - Paolo Verdi
                </h3>

                <div className="bg-white p-4 rounded-lg mb-3">
                  <p className="text-sm text-gray-700 mb-2">
                    ⏰ <strong>Suggerito:</strong> 09:00-10:00 (optimal time)
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    🎯 <strong>Obiettivo:</strong> Fissare incontro di persona
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    💰 <strong>Valore:</strong> €25,000
                  </p>
                  <p className="text-sm text-gray-700">
                    🔥 <strong>Urgenza:</strong> 95/100
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">📋 Context AI:</p>
                  <p className="text-sm text-gray-700">
                    "Lead inattivo da 3 giorni. Era molto caldo dopo ultima chiamata. Pattern storici simili
                    mostrano 67% conversione se ricontattato entro 4 giorni. Rischio perdita momentum."
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 mb-2">💡 Talking Points suggeriti:</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Menziona caso studio Acme Corp (settore simile, +35% ROI)</li>
                    <li>Proponi demo personalizzata per il loro team tecnico</li>
                    <li>Evidenzia sconto early-bird che scade il 20/10</li>
                    <li>Riferimento a preoccupazione compliance discussa in call precedente</li>
                  </ul>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button size="sm">📞 Call Now</Button>
                  <Button variant="secondary" size="sm">📅 Schedule</Button>
                  <Button variant="ghost" size="sm">✏️ Edit</Button>
                  <Button variant="ghost" size="sm">❌ Dismiss</Button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Feedback AI:</p>
                  <div className="flex gap-2">
                    <button className="text-2xl hover:scale-110 transition">👍</button>
                    <button className="text-2xl hover:scale-110 transition">👎</button>
                    <button className="text-sm text-primary hover:underline ml-2">💬 "Non rilevante perché..."</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* High Priority Task */}
        <Card className="mb-4 border-l-4 border-warning">
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-4" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="warning">ALTA PRIORITÀ</Badge>
                <Badge variant="gray" size="sm">Urgenza: 88/100</Badge>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">
                Follow-up Gamma Spa - Preventivo inviato
              </h3>

              <p className="text-sm text-gray-700 mb-2">
                ⏰ 14:00-15:00 | 💰 €18,000 | 🎯 Ottenere accettazione preventivo
              </p>

              <div className="bg-blue-50 p-3 rounded mb-2">
                <p className="text-sm text-gray-700">
                  <strong>Context AI:</strong> Preventivo inviato 2 giorni fa. Nessuna risposta.
                  Momentum sta calando. Storico mostra che dopo 3 giorni probabilità chiusura scende dal 65% al 38%.
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-700">
                  <strong>💡 Script suggerito:</strong> "Ciao Marco, ti scrivo per capire se hai avuto
                  modo di vedere la proposta. Quali domande hai?"
                </p>
                <p className="text-xs text-gray-600 mt-1">❌ <strong>NO:</strong> "Avete visto il preventivo?"</p>
              </div>

              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary">✉️ Email</Button>
                <Button size="sm" variant="secondary">📞 Call</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Medium Priority Task */}
        <Card className="mb-4">
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 mr-4" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary">OPPORTUNITÀ</Badge>
                <Badge variant="gray" size="sm">Urgenza: 65/100</Badge>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">
                Prospecting: 5 nuovi lead outbound
              </h3>

              <p className="text-sm text-gray-700 mb-2">
                ⏰ 10:00-11:00 | 🎯 2-3 lead qualificati
              </p>

              <div className="bg-blue-50 p-3 rounded mb-2">
                <p className="text-sm text-gray-700">
                  <strong>Context AI:</strong> Pipeline sta diventando sottile in stage iniziali.
                  Serve alimentare top-of-funnel per mantenere momentum prossime settimane.
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>👥 Lista prospect generata da AI (10):</strong>
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Tech companies 50-200 dipendenti</li>
                  <li>✓ Nord Italia (tuo territorio)</li>
                  <li>✓ ICP match &gt;80%</li>
                </ul>
                <Button size="sm" variant="ghost" className="mt-2">📋 Vedi Lista e Script</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Learning Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-3">🎓 AI Learning From You</h3>
        <p className="text-sm text-gray-700 mb-3">
          L'AI sta imparando dalle tue preferenze:
        </p>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ Preferisci chiamate 09:00-11:00 (89% accepted)</p>
          <p>✓ Task con context dettagliato (+32% completion)</p>
          <p>✓ Prospect lista &lt;10 contatti (più gestibile)</p>
          <p className="text-warning">⚠️ Spesso dismiss task prospecting pomeriggio</p>
        </div>
        <p className="text-sm text-gray-600 mt-3 italic">
          💡 L'AI sta adattando suggerimenti di conseguenza
        </p>
        <Button variant="ghost" size="sm" className="mt-3">
          ⚙️ Configura preferenze AI →
        </Button>
      </Card>
    </div>
  );
}
