'use client';

import { Card, Badge, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface SellerStats {
  user: any;
  dealsActive: number;
  dealsWon: number;
  tasksToday: number;
  lastActivityDate: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [sellersStats, setSellersStats] = useState<SellerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [lastTaskGeneration, setLastTaskGeneration] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get all sellers
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['seller', 'team_leader'])
      );
      const usersSnapshot = await getDocs(usersQuery);
      const sellers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all deals
      const dealsSnapshot = await getDocs(collection(db, 'deals'));
      const allDeals = dealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all tasks
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const allTasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent activities
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const allActivities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Calculate stats for each seller
      const stats: SellerStats[] = sellers.map(seller => {
        const sellerDeals = allDeals.filter((d: any) => d.userId === seller.id);
        const dealsActive = sellerDeals.filter((d: any) =>
          d.stage !== 'won' && d.stage !== 'lost'
        ).length;
        const dealsWon = sellerDeals.filter((d: any) => d.stage === 'won').length;

        const today = new Date().toISOString().split('T')[0];
        const sellerTasks = allTasks.filter((t: any) => {
          if (t.userId !== seller.id) return false;
          const taskDate = t.scheduledAt ? new Date(t.scheduledAt).toISOString().split('T')[0] : '';
          return taskDate === today;
        });
        const tasksToday = sellerTasks.length;

        const sellerActivities = allActivities.filter((a: any) => a.userId === seller.id);
        const lastActivity = sellerActivities.length > 0 ? sellerActivities[0] : null;
        const lastActivityDate = lastActivity?.createdAt?.toDate
          ? new Date(lastActivity.createdAt.toDate()).toLocaleDateString('it-IT')
          : 'Mai';

        return {
          user: seller,
          dealsActive,
          dealsWon,
          tasksToday,
          lastActivityDate
        };
      });

      setSellersStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate tasks');
      }

      setLastTaskGeneration(new Date().toISOString());
      alert(`✅ Generati ${data.summary.tasksGenerated} task per ${data.summary.sellersProcessed} venditori!`);
      await loadDashboardData(); // Reload data
    } catch (error: any) {
      console.error('Error generating tasks:', error);
      if (error.message.includes('OPENAI_API_KEY')) {
        alert('❌ OpenAI API key non configurata. Configura OPENAI_API_KEY nelle variabili d\'ambiente.');
      } else {
        alert(`❌ Errore: ${error.message}`);
      }
    } finally {
      setLoadingTasks(false);
    }
  };

  const totalDealsActive = sellersStats.reduce((acc, s) => acc + s.dealsActive, 0);
  const totalDealsWon = sellersStats.reduce((acc, s) => acc + s.dealsWon, 0);
  const avgWinRate = sellersStats.length > 0
    ? Math.round((totalDealsWon / (totalDealsActive + totalDealsWon)) * 100) || 0
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Command Center</h1>
          <p className="text-gray-600 mt-2">
            Panoramica completa del team • {sellersStats.length} sellers
          </p>
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
                  L'AI analizza tutti i deals, clienti e attività e genera task personalizzati per ogni venditore
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

          {/* Info Box */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-3xl">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Requisiti</h3>
                <p className="text-sm text-gray-600">
                  Per utilizzare la generazione AI dei task, è necessario configurare OPENAI_API_KEY nelle variabili d'ambiente.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Senza API key configurata, la funzione mostrerà un errore.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-90">Deals Attivi (Team)</div>
          <div className="text-3xl font-bold mt-1">{totalDealsActive}</div>
          <div className="text-sm opacity-90 mt-1">In pipeline</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-90">Deals Chiusi</div>
          <div className="text-3xl font-bold mt-1">{totalDealsWon}</div>
          <div className="text-sm opacity-90 mt-1">Totale vinti</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm opacity-90">Win Rate</div>
          <div className="text-3xl font-bold mt-1">{avgWinRate}%</div>
          <div className="text-sm opacity-90 mt-1">Media team</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="text-sm opacity-90">Sellers</div>
          <div className="text-3xl font-bold mt-1">{sellersStats.length}</div>
          <div className="text-sm opacity-90 mt-1">Team attivo</div>
        </Card>
      </div>

      {/* Sellers Grid */}
      {sellersStats.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nessun venditore trovato</h3>
          <p className="text-gray-600">
            Crea utenti con ruolo "seller" per visualizzarli qui.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sellersStats.map((stat) => (
            <Card key={stat.user.id} hover>
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(stat.user.displayName || stat.user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {stat.user.displayName || stat.user.email}
                    </h3>
                    <p className="text-sm text-gray-600">{stat.user.team || 'Nessun team'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600">Deals Attivi</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.dealsActive}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Chiusi</div>
                  <div className="text-2xl font-bold text-success">{stat.dealsWon}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Task Oggi</div>
                  <div className="text-2xl font-bold text-primary">{stat.tasksToday}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Ultima attività: {stat.lastActivityDate}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
