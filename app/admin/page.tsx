'use client';

import { Card } from '@/components/ui';
import Link from 'next/link';

export default function AdminPage() {
  const adminSections = [
    {
      title: '🎯 Command Center',
      description: 'Panoramica completa del team sales, statistiche in tempo reale, alerts e AI automation',
      href: '/admin/dashboard',
      color: 'from-blue-500 to-blue-600',
      features: [
        'Monitoraggio sellers in tempo reale',
        'Generazione automatica task giornalieri',
        'Ricerca AI di nuovi prospect',
        'Statistiche aggregate del team',
      ]
    },
    {
      title: '👥 Gestione Utenti',
      description: 'Crea e gestisci gli account dei venditori e team leaders',
      href: '/admin/users',
      color: 'from-orange-500 to-orange-600',
      features: [
        'Creazione nuovi account venditori',
        'Gestione ruoli e permessi',
        'Visualizzazione utenti registrati',
        'Controllo accessi al sistema',
      ]
    },
    {
      title: '🧠 AI Config',
      description: 'Configura il comportamento dell\'AI e gli obiettivi business',
      href: '/admin/ai-config',
      color: 'from-green-500 to-green-600',
      features: [
        'Impostazioni obiettivi business',
        'Parametri comportamento AI',
        'Personalità AI assistant',
        'Timing e scheduling automazioni',
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ⚙️ Admin Panel
        </h1>
        <p className="text-gray-600 text-lg">
          Centro di controllo per la gestione del CRM e dell'AI
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">4</div>
            <div className="text-sm text-gray-600 mt-1">Sezioni Admin</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">🤖</div>
            <div className="text-sm text-gray-600 mt-1">AI Automation Attiva</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">✅</div>
            <div className="text-sm text-gray-600 mt-1">Sistema Operativo</div>
          </div>
        </Card>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card
              hover
              className="h-full cursor-pointer transition-all hover:shadow-xl"
            >
              <div className={`bg-gradient-to-br ${section.color} text-white rounded-lg p-6 mb-4`}>
                <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                <p className="text-sm opacity-90">{section.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Funzionalità:</p>
                {section.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-primary font-medium text-sm flex items-center justify-between">
                  <span>Apri sezione</span>
                  <span>→</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Azioni Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/admin/dashboard">
            <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="font-semibold text-gray-900">Genera Task Giornalieri</div>
                  <div className="text-sm text-gray-600">Lancia generazione AI per tutti i sellers</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/dashboard">
            <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-semibold text-gray-900">Ricerca Nuovi Prospect</div>
                  <div className="text-sm text-gray-600">AI trova potenziali clienti</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/ai-tasks">
            <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-semibold text-gray-900">AI Task Manager</div>
                  <div className="text-sm text-gray-600">Gestisci i task generati dall'AI</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/activities">
            <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900">Activities Admin</div>
                  <div className="text-sm text-gray-600">Monitora attività dei venditori</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💡</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Suggerimento</h3>
            <p className="text-sm text-gray-700">
              Usa il <span className="font-semibold">Command Center</span> per avere una visione d'insieme del team e lanciare le automazioni AI.
              Con <span className="font-semibold">AI Task Manager</span> gestisci i task generati dall'intelligenza artificiale.
              Con <span className="font-semibold">AI Config</span> puoi ottimizzare il comportamento dell'AI in base ai tuoi obiettivi business.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
