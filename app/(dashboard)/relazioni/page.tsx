'use client';

import { Card, Badge, Button, Input } from '@/components/ui';
import { useState } from 'react';

// Modello Ferrazzi "Never Eat Alone"
// Focus su RELAZIONI strategiche, non solo clienti

export default function RelazioniPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemperature, setFilterTemperature] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - dopo creeremo hook e Firestore
  const mockRelationships = [
    {
      id: '1',
      name: 'Marco Bianchi',
      company: 'Liceo Scientifico Einstein',
      role: 'Preside',
      temperature: 'calda' as const,
      importance: 'critica' as const,
      category: 'decision_maker' as const,
      lastContact: '2 giorni fa',
      nextAction: 'Chiamata follow-up proposta VR',
      mutualBenefits: ['Partnership educativa', 'Innovazione didattica'],
      valueBalance: 'balanced' as const,
      noteCount: 12,
    },
    {
      id: '2',
      name: 'Laura Rossi',
      company: 'Hotel Paradiso',
      role: 'General Manager',
      temperature: 'bollente' as const,
      importance: 'alta' as const,
      category: 'champion' as const,
      lastContact: '5 giorni fa',
      nextAction: 'Meeting firma contratto',
      mutualBenefits: ['Esperienza ospiti', 'Revenue share VR'],
      valueBalance: 'do_give_more' as const,
      noteCount: 8,
    },
    {
      id: '3',
      name: 'Giuseppe Verdi',
      company: 'Comune di Milano',
      role: 'Assessore Turismo',
      temperature: 'tiepida' as const,
      importance: 'critica' as const,
      category: 'influencer' as const,
      lastContact: '2 settimane fa',
      nextAction: 'Ricontattare per aggiornamento budget',
      mutualBenefits: ['Promozione città', 'Turismo innovativo'],
      valueBalance: 'do_receive_more' as const,
      noteCount: 5,
    },
  ];

  const relationships = mockRelationships.filter(rel => {
    const matchesSearch = rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemperature = filterTemperature === 'all' || rel.temperature === filterTemperature;
    const matchesImportance = filterImportance === 'all' || rel.importance === filterImportance;
    return matchesSearch && matchesTemperature && matchesImportance;
  });

  const stats = {
    total: mockRelationships.length,
    hot: mockRelationships.filter(r => r.temperature === 'bollente' || r.temperature === 'calda').length,
    critical: mockRelationships.filter(r => r.importance === 'critica').length,
    needsAction: mockRelationships.filter(r => r.valueBalance === 'do_give_more').length,
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'bollente': return 'bg-red-100 text-red-700 border-red-300';
      case 'calda': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'tiepida': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'fredda': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'bollente': return '🔥';
      case 'calda': return '🌡️';
      case 'tiepida': return '☀️';
      case 'fredda': return '❄️';
      default: return '⚪';
    }
  };

  const getImportanceIcon = (imp: string) => {
    switch (imp) {
      case 'critica': return '⭐⭐⭐';
      case 'alta': return '⭐⭐';
      case 'media': return '⭐';
      case 'bassa': return '○';
      default: return '';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'decision_maker': return '👑 Decisore';
      case 'influencer': return '📢 Influencer';
      case 'champion': return '🏆 Champion';
      case 'gatekeeper': return '🚪 Gatekeeper';
      case 'advisor': return '🎓 Consulente';
      case 'connector': return '🌐 Connettore';
      default: return cat;
    }
  };

  const getBalanceIndicator = (balance: string) => {
    switch (balance) {
      case 'do_give_more': return { icon: '⬆️', text: 'Devo dare valore', color: 'text-orange-600' };
      case 'balanced': return { icon: '⚖️', text: 'Bilanciato', color: 'text-green-600' };
      case 'do_receive_more': return { icon: '⬇️', text: 'Sto ricevendo', color: 'text-blue-600' };
      default: return { icon: '', text: '', color: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🤝 Relazioni Strategiche
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci le tue relazioni professionali con il metodo Ferrazzi
          </p>
        </div>
        <Button>+ Nuova Relazione</Button>
      </div>

      {/* Stats Cards - Ferrazzi Focus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 border-l-4 border-primary">
          <div className="text-sm text-gray-600">Relazioni Totali</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">Rete professionale attiva</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-600">Relazioni Calde</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.hot}</div>
          <div className="text-xs text-gray-500 mt-1">Pronte per opportunità</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600">Importanza Critica</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.critical}</div>
          <div className="text-xs text-gray-500 mt-1">Per obiettivi chiave</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600">Devo Dare Valore</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.needsAction}</div>
          <div className="text-xs text-gray-500 mt-1">Azioni da fare per loro</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="🔍 Cerca per nome o azienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filterTemperature}
            onChange={(e) => setFilterTemperature(e.target.value)}
          >
            <option value="all">🌡️ Tutte le temperature</option>
            <option value="bollente">🔥 Bollenti</option>
            <option value="calda">🌡️ Calde</option>
            <option value="tiepida">☀️ Tiepide</option>
            <option value="fredda">❄️ Fredde</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
          >
            <option value="all">⭐ Tutte le importanze</option>
            <option value="critica">⭐⭐⭐ Critiche</option>
            <option value="alta">⭐⭐ Alte</option>
            <option value="media">⭐ Medie</option>
            <option value="bassa">○ Basse</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Griglia
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Lista
          </button>
        </div>
      </Card>

      {/* Relationships Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relationships.map((rel) => {
            const balance = getBalanceIndicator(rel.valueBalance);
            return (
              <Card key={rel.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                {/* Header con temperatura */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{rel.name}</h3>
                    <p className="text-sm text-gray-600">{rel.role}</p>
                    <p className="text-xs text-gray-500">{rel.company}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTemperatureColor(rel.temperature)}`}>
                    {getTemperatureIcon(rel.temperature)} {rel.temperature.toUpperCase()}
                  </div>
                </div>

                {/* Category e Importanza */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {getCategoryLabel(rel.category)}
                  </span>
                  <span className="text-sm">{getImportanceIcon(rel.importance)}</span>
                </div>

                {/* Mutual Benefits */}
                <div className="mb-3 bg-green-50 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-green-700 mb-1">💚 Benefici Reciproci:</div>
                  <div className="space-y-1">
                    {rel.mutualBenefits.map((benefit, idx) => (
                      <div key={idx} className="text-xs text-green-600">• {benefit}</div>
                    ))}
                  </div>
                </div>

                {/* Value Balance */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{balance.icon}</span>
                  <span className={`text-sm font-medium ${balance.color}`}>{balance.text}</span>
                </div>

                {/* Next Action */}
                <div className="mb-3 bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-blue-700 mb-1">⏭️ Prossima Azione:</div>
                  <div className="text-xs text-blue-600">{rel.nextAction}</div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    📅 {rel.lastContact}
                  </div>
                  <div className="text-xs text-gray-500">
                    📝 {rel.noteCount} note
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3">
                  Vedi Dettagli
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="space-y-3">
            {relationships.map((rel) => {
              const balance = getBalanceIndicator(rel.valueBalance);
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  {/* Temperature */}
                  <div className={`px-3 py-2 rounded-full text-sm font-semibold border ${getTemperatureColor(rel.temperature)}`}>
                    {getTemperatureIcon(rel.temperature)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{rel.name}</h3>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{rel.role}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{rel.company}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {getCategoryLabel(rel.category)}
                      </span>
                      <span className="text-xs">{getImportanceIcon(rel.importance)}</span>
                      <span className={`text-xs font-medium ${balance.color}`}>
                        {balance.icon} {balance.text}
                      </span>
                      <span className="text-xs text-gray-500">• {rel.lastContact}</span>
                    </div>
                  </div>

                  {/* Next Action */}
                  <div className="text-sm text-gray-600 max-w-xs">
                    <span className="font-semibold">⏭️</span> {rel.nextAction}
                  </div>

                  <Button variant="outline" size="sm">
                    Dettagli
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {relationships.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nessuna relazione trovata
          </h3>
          <p className="text-gray-600 mb-6">
            Inizia a costruire la tua rete di relazioni strategiche
          </p>
          <Button>+ Aggiungi Prima Relazione</Button>
        </Card>
      )}

      {/* Ferrazzi Quote */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-100 border-l-4 border-primary">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <p className="text-gray-700 italic mb-2">
              "Il successo nella vita è una funzione del numero di conversazioni scomode
              che sei disposto ad avere."
            </p>
            <p className="text-sm text-gray-600 font-semibold">— Keith Ferrazzi, Never Eat Alone</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
