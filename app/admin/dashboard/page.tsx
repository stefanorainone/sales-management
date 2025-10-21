'use client';

import { Card, Badge, Button } from '@/components/ui';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';

interface Seller {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  dealsActive: number;
  dealsWon: number;
  winRate: number;
  activitiesToday: number;
  lastActivity: string;
  target: number;
  performance: 'excellent' | 'good' | 'needs-attention';
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  seller: string;
  message: string;
  time: string;
}

const mockSellers: Seller[] = [
  {
    id: '1',
    name: 'Luca Bianchi',
    status: 'active',
    dealsActive: 18,
    dealsWon: 15,
    winRate: 68,
    activitiesToday: 12,
    lastActivity: '5 min fa',
    target: 20,
    performance: 'excellent',
  },
  {
    id: '2',
    name: 'Mario Rossi',
    status: 'active',
    dealsActive: 23,
    dealsWon: 11,
    winRate: 48,
    activitiesToday: 8,
    lastActivity: '15 min fa',
    target: 15,
    performance: 'good',
  },
  {
    id: '3',
    name: 'Sara Verdi',
    status: 'idle',
    dealsActive: 15,
    dealsWon: 9,
    winRate: 60,
    activitiesToday: 4,
    lastActivity: '2h fa',
    target: 12,
    performance: 'good',
  },
  {
    id: '4',
    name: 'Paolo Neri',
    status: 'offline',
    dealsActive: 8,
    dealsWon: 3,
    winRate: 37,
    activitiesToday: 2,
    lastActivity: 'Ieri',
    target: 10,
    performance: 'needs-attention',
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    seller: 'Paolo Neri',
    message: 'Nessuna attività nelle ultime 24h - 3 follow-up critici in attesa',
    time: '2h fa',
  },
  {
    id: '2',
    type: 'warning',
    seller: 'Sara Verdi',
    message: 'Deal importante in stallo da 5 giorni',
    time: '4h fa',
  },
  {
    id: '3',
    type: 'info',
    seller: 'Luca Bianchi',
    message: 'Ha superato il target mensile con 5 giorni di anticipo',
    time: '6h fa',
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>(mockSellers);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [lastTaskGeneration, setLastTaskGeneration] = useState<string | null>(null);
  const [lastProspectResearch, setLastProspectResearch] = useState<string | null>(null);

  const totalDealsActive = sellers.reduce((acc, s) => acc + s.dealsActive, 0);
  const totalDealsWon = sellers.reduce((acc, s) => acc + s.dealsWon, 0);
  const avgWinRate = Math.round(sellers.reduce((acc, s) => acc + s.winRate, 0) / sellers.length);
  const activeSellers = sellers.filter(s => s.status === 'active').length;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'success' as const, label: '🟢 Attivo' },
      idle: { variant: 'warning' as const, label: '🟡 Idle' },
      offline: { variant: 'gray' as const, label: '⚫ Offline' },
    };
    return <Badge variant={variants[status as keyof typeof variants].variant} size="sm">
      {variants[status as keyof typeof variants].label}
    </Badge>;
  };

  const getPerformanceBadge = (performance: string) => {
    const variants = {
      excellent: { variant: 'success' as const, label: '⭐ Eccellente' },
      good: { variant: 'primary' as const, label: '👍 Buono' },
      'needs-attention': { variant: 'danger' as const, label: '⚠️ Attenzione' },
    };
    return <Badge variant={variants[performance as keyof typeof variants].variant} size="sm">
      {variants[performance as keyof typeof variants].label}
    </Badge>;
  };

  const getAlertColor = (type: string) => {
    const colors = {
      critical: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
    };
    return colors[type as keyof typeof colors];
  };

  const handleGenerateDailyTasks = async () => {
    if (!user) return;

    setLoadingTasks(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch('/api/ai/generate-daily-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();
      setLastTaskGeneration(new Date().toISOString());
      alert(`✅ Generati ${data.summary.tasksGenerated} task per ${data.summary.sellersProcessed} venditori!`);
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('❌ Errore nella generazione dei task');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleResearchProspects = async () => {
    if (!user) return;

    const numberOfProspects = prompt('Quanti prospect vuoi generare?', '5');
    if (!numberOfProspects) return;

    setLoadingProspects(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch('/api/ai/research-prospects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetSectors: ['scuola', 'hotel', 'museo_privato', 'comune'],
          targetRegions: ['Toscana', 'Lazio', 'Campania', 'Lombardia'],
          numberOfProspects: parseInt(numberOfProspects),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to research prospects');
      }

      const data = await response.json();
      setLastProspectResearch(new Date().toISOString());
      alert(`✅ Trovati ${data.summary.prospectsCreated} nuovi prospect!\nCreati ${data.summary.tasksCreated} task di contatto.`);
    } catch (error) {
      console.error('Error researching prospects:', error);
      alert('❌ Errore nella ricerca prospect');
    } finally {
      setLoadingProspects(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Command Center</h1>
          <p className="text-gray-600 mt-2">
            Panoramica completa del team • {activeSellers}/{sellers.length} sellers attivi
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => window.location.href = '/admin/tasks'}>
            📋 Gestione Task
          </Button>
          <Button variant="ghost">🔔 Notifiche</Button>
          <Button>📊 Report Completo</Button>
        </div>
      </div>

      {/* AI Automation Section */}
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-2 border-purple-200">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🤖 AI Automation Center
          </h2>
          <p className="text-gray-600 mt-1">
            Gestione automatizzata del database e generazione task giornalieri
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Generate Daily Tasks */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">📋</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Genera Task Giornalieri</h3>
                <p className="text-sm text-gray-600 mb-3">
                  L'AI analizza tutti i deals, clienti e attività e genera task personalizzati per ogni venditore per oggi e domani
                </p>
                {lastTaskGeneration && (
                  <p className="text-xs text-gray-500 mb-2">
                    Ultima generazione: {new Date(lastTaskGeneration).toLocaleString('it-IT')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleGenerateDailyTasks}
              disabled={loadingTasks}
              className="w-full"
            >
              {loadingTasks ? '⏳ Generazione in corso...' : '🚀 Genera Task per Tutti'}
            </Button>
          </div>

          {/* Research Prospects */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">🔍</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Ricerca Nuovi Prospect</h3>
                <p className="text-sm text-gray-600 mb-3">
                  L'AI ricerca potenziali clienti (scuole, hotel, musei, comuni), li aggiunge al database e crea task di contatto
                </p>
                {lastProspectResearch && (
                  <p className="text-xs text-gray-500 mb-2">
                    Ultima ricerca: {new Date(lastProspectResearch).toLocaleString('it-IT')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleResearchProspects}
              disabled={loadingProspects}
              variant="primary"
              className="w-full"
            >
              {loadingProspects ? '⏳ Ricerca in corso...' : '🎯 Trova Nuovi Prospect'}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Automazione Intelligente:</span> Il sistema analizza l'intero database (deals, clienti, attività, note) per generare task strategici e trovare nuove opportunità. Ogni task è personalizzato in base alla situazione specifica del venditore.
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-90">Deals Attivi (Team)</div>
          <div className="text-3xl font-bold mt-1">{totalDealsActive}</div>
          <div className="text-sm opacity-90 mt-1">Distribuiti tra {sellers.length} sellers</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-90">Deals Chiusi (MTD)</div>
          <div className="text-3xl font-bold mt-1">{totalDealsWon}</div>
          <div className="text-sm opacity-90 mt-1">Target: 50 • {Math.round((totalDealsWon / 50) * 100)}%</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm opacity-90">Win Rate Medio</div>
          <div className="text-3xl font-bold mt-1">{avgWinRate}%</div>
          <div className="text-sm opacity-90 mt-1">+5% vs mese scorso</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="text-sm opacity-90">Sellers Attivi</div>
          <div className="text-3xl font-bold mt-1">{activeSellers}</div>
          <div className="text-sm opacity-90 mt-1">In tempo reale</div>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Alerts & Notifiche
              <Badge variant="danger" size="sm" className="ml-2">
                {alerts.filter(a => a.type === 'critical').length} critici
              </Badge>
            </h3>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <span className="text-xl">
                  {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{alert.seller}</span>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                </div>
                <Button size="sm" variant="ghost">Visualizza</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sellers.map(seller => (
          <Card key={seller.id} hover className="relative">
            <div className="absolute top-3 right-3">
              {getStatusBadge(seller.status)}
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {seller.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{seller.name}</h3>
                  <p className="text-sm text-gray-600">Ultima attività: {seller.lastActivity}</p>
                </div>
              </div>
              {getPerformanceBadge(seller.performance)}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-600">Deals Attivi</div>
                <div className="text-2xl font-bold text-gray-900">{seller.dealsActive}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Chiusi MTD</div>
                <div className="text-2xl font-bold text-success">{seller.dealsWon}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Win Rate</div>
                <div className="text-2xl font-bold text-primary">{seller.winRate}%</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Target Mensile</span>
                <span className="font-medium">
                  {seller.dealsWon} / {seller.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    seller.dealsWon >= seller.target ? 'bg-success' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min((seller.dealsWon / seller.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-600">Attività oggi</span>
              <Badge
                variant={seller.activitiesToday >= 8 ? 'success' : seller.activitiesToday >= 5 ? 'warning' : 'danger'}
                size="sm"
              >
                {seller.activitiesToday} attività
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1">👁️ Dettagli</Button>
              <Button size="sm" variant="ghost" className="flex-1">📊 Analytics</Button>
              <Button size="sm" variant="ghost" className="flex-1">💬 Messaggio</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Team Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Leaderboard MTD</h3>
          </div>
          <div className="space-y-3">
            {sellers
              .sort((a, b) => b.dealsWon - a.dealsWon)
              .map((seller, idx) => (
                <div key={seller.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold text-gray-400 w-8">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{seller.name}</div>
                    <div className="text-sm text-gray-600">
                      {seller.dealsWon} deals • Win rate: {seller.winRate}%
                    </div>
                  </div>
                  {idx === 0 && <span className="text-2xl">🥇</span>}
                  {idx === 1 && <span className="text-2xl">🥈</span>}
                  {idx === 2 && <span className="text-2xl">🥉</span>}
                </div>
              ))}
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🤖 AI Insights - Team
            </h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Obiettivo Raggiungibile</div>
                  <p className="text-sm text-gray-700 mt-1">
                    Il team è al 76% del target mensile. Con il trend attuale, raggiungerete il 98% del target.
                    Focus su Paolo Neri per recuperare il gap.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Attenzione Richiesta</div>
                  <p className="text-sm text-gray-700 mt-1">
                    Paolo Neri mostra calo attività (-45% vs media). Suggerisco 1-to-1 per identificare blocchi.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">⭐</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Best Practice</div>
                  <p className="text-sm text-gray-700 mt-1">
                    Luca Bianchi ha un win rate eccezionale (68%). Considerate di farlo fare training al team
                    sulle sue tecniche di chiusura.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">📈</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Opportunità</div>
                  <p className="text-sm text-gray-700 mt-1">
                    Il team ha 64 deals attivi. Con un win rate del 55%, potreste chiudere 35 deals questo mese.
                    Aumentate focus su follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Attività in Tempo Reale
            <Badge variant="success" size="sm" className="ml-2">Live</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <span className="text-sm text-gray-500">5 min fa</span>
            <span className="text-lg">📞</span>
            <div className="flex-1">
              <span className="font-medium">Luca Bianchi</span>
              <span className="text-gray-600"> ha completato una chiamata con </span>
              <span className="font-medium">Acme Corp</span>
            </div>
            <Badge variant="success" size="sm">Qualificato</Badge>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <span className="text-sm text-gray-500">15 min fa</span>
            <span className="text-lg">✉️</span>
            <div className="flex-1">
              <span className="font-medium">Mario Rossi</span>
              <span className="text-gray-600"> ha inviato una proposta a </span>
              <span className="font-medium">Beta SRL</span>
            </div>
            <Badge variant="primary" size="sm">Proposta</Badge>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <span className="text-sm text-gray-500">1h fa</span>
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <span className="font-medium">Sara Verdi</span>
              <span className="text-gray-600"> ha schedulato un meeting con </span>
              <span className="font-medium">Gamma Spa</span>
            </div>
            <Badge variant="warning" size="sm">Meeting</Badge>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded bg-green-50">
            <span className="text-sm text-gray-500">2h fa</span>
            <span className="text-lg">✅</span>
            <div className="flex-1">
              <span className="font-medium">Luca Bianchi</span>
              <span className="text-gray-600"> ha chiuso un deal con </span>
              <span className="font-medium">Delta Tech</span>
            </div>
            <Badge variant="success" size="sm">Won</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
