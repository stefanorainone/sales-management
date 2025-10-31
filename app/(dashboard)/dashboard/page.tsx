'use client';

import { Card, Button } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDeals } from '@/lib/hooks/useDeals';
import { useClients } from '@/lib/hooks/useClients';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { deals, loading: dealsLoading } = useDeals();
  const { clients, loading: clientsLoading } = useClients();

  const userName = user?.displayName?.split(' ')[0] || 'Venditore';

  // Count active deals
  const activeDeals = deals.filter(d =>
    d.stage !== 'won' && d.stage !== 'lost'
  ).length;

  const hotLeads = clients.filter(c => c.priority === 'hot').length;

  const loading = dealsLoading || clientsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Benvenuto {userName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Deals Attivi</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{activeDeals}</div>
          <div className="text-sm text-gray-600 mt-1">In corso</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Clienti Totali</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</div>
          <div className="text-sm text-gray-600 mt-1">Database</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Hot Leads</div>
          <div className="text-3xl font-bold text-danger mt-2">{hotLeads}</div>
          <div className="text-sm text-gray-600 mt-1">Alta priorità</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Task AI Giornalieri</h2>
          <p className="text-gray-600 mb-4">
            Visualizza i task intelligenti generati dall'AI basati sui tuoi deals e attività.
          </p>
          <Link href="/today">
            <Button className="w-full">Vai ai Miei Task</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Gestione Clienti</h2>
          <p className="text-gray-600 mb-4">
            Visualizza e gestisci tutti i tuoi clienti e leads.
          </p>
          <Link href="/clients">
            <Button className="w-full" variant="secondary">Vai ai Clienti</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics</h2>
          <p className="text-gray-600 mb-4">
            Analizza le tue performance e visualizza statistiche dettagliate.
          </p>
          <Link href="/analytics">
            <Button className="w-full" variant="secondary">Vai alle Analytics</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Attività</h2>
          <p className="text-gray-600 mb-4">
            Traccia tutte le tue attività, chiamate, meeting e follow-up.
          </p>
          <Link href="/activities">
            <Button className="w-full" variant="secondary">Vai alle Attività</Button>
          </Link>
        </Card>
      </div>

      {/* Status Card */}
      {deals.length === 0 && clients.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">👋 Inizia da qui</h3>
            <p className="text-gray-600 mb-4">
              Non hai ancora clienti o deals. Inizia aggiungendo il tuo primo cliente!
            </p>
            <Link href="/clients">
              <Button>+ Aggiungi Primo Cliente</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
