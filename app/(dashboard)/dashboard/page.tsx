import { Card, CardHeader, Badge } from '@/components/ui';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Benvenuto Mario!
        </h1>
        <p className="text-gray-600 mt-2">
          Hai 5 attività oggi | 3 follow-up urgenti
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Deals Attivi</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">23</div>
          <div className="text-sm text-success mt-1">+5 ▲</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Target: 25</p>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">65%</div>
          <div className="text-sm text-gray-600 mt-1">Questo Mese</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-success h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Media: 58%</p>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Hot Leads</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">12</div>
          <div className="text-sm text-danger mt-1">-2 ▼</div>
          <div className="mt-2">
            <Badge variant="hot" size="sm">Richiede attenzione</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Oggi */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Tasks Oggi"
              subtitle="5 attività pianificate"
            />
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <input type="checkbox" className="mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Chiamare Beta SRL</p>
                  <p className="text-sm text-gray-600">Lead caldo - Follow-up proposta</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">14:00</p>
                  <Badge variant="danger" size="sm">High</Badge>
                </div>
              </div>

              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input type="checkbox" className="mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Follow-up Acme Corp</p>
                  <p className="text-sm text-gray-600">Proposta inviata 2gg fa</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">15:30</p>
                  <Badge variant="warning" size="sm">Medium</Badge>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
                <input type="checkbox" defaultChecked className="mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-through">Demo per Gamma SRL</p>
                  <p className="text-sm text-gray-600">Completato</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">10:00</p>
                  <Badge variant="success" size="sm">Done</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Pipeline Snapshot */}
          <Card className="mt-6">
            <CardHeader title="Pipeline Snapshot" />
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-gray-600 mt-1">Lead</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center flex-1">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-gray-600 mt-1">Qualified</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center flex-1">
                <div className="text-3xl font-bold">5</div>
                <div className="text-sm text-gray-600 mt-1">Proposal</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center flex-1">
                <div className="text-3xl font-bold">3</div>
                <div className="text-sm text-gray-600 mt-1">Negotiation</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center flex-1">
                <div className="text-3xl font-bold text-success">2</div>
                <div className="text-sm text-gray-600 mt-1">Won</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Activities */}
          <Card>
            <CardHeader title="Prossime Attività" />
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-3">
                <p className="text-sm font-medium">Lun 14:00</p>
                <p className="text-sm text-gray-600">Demo Cliente X</p>
              </div>
              <div className="border-l-4 border-primary pl-3">
                <p className="text-sm font-medium">Mar 10:30</p>
                <p className="text-sm text-gray-600">Follow-up Deal importante</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-sm font-medium">Mer</p>
                <p className="text-sm text-gray-600">3 chiamate schedulate</p>
              </div>
            </div>
          </Card>

          {/* Personal Progress */}
          <Card>
            <CardHeader title="📈 Il Tuo Progresso" subtitle="Confronto con settimana scorsa" />
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Deal chiusi</span>
                  <span className="text-sm font-bold text-green-600">+3 ↑</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-xs text-gray-600">3/4</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Settimana scorsa: 0 deal</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Task completati</span>
                  <span className="text-sm font-bold text-blue-600">+30% ↑</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-xs text-gray-600">17/20</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Settimana scorsa: 13/20 (65%)</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Response speed</span>
                  <span className="text-sm font-bold text-purple-600">+2h ↓</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-xs text-gray-600">4h avg</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Settimana scorsa: 6h</p>
              </div>
            </div>
          </Card>

          {/* Team Goals (Collaborative) */}
          <Card>
            <CardHeader title="🎯 Obiettivi Team" subtitle="Lavoriamo insieme" />
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Q4 2025: 30 deal</span>
                  <span className="text-sm font-bold text-blue-600">23/30</span>
                </div>
                <div className="w-full bg-white rounded-full h-3 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '77%' }}></div>
                </div>
                <p className="text-xs text-gray-700">💪 Ci siamo quasi! Ancora 7 deal</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">🎉 Traguardi team recenti</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700"><strong>Luca</strong> ha chiuso Comune di Siena!</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700"><strong>Sara</strong> ha installato 3° hotel questa settimana</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700"><strong>Team</strong> ha superato 20 deal Q4! 🚀</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
