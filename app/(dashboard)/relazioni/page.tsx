'use client';

import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { useState } from 'react';
import { useRelationships, type Relationship } from '@/lib/hooks/useRelationships';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

// Modello Ferrazzi "Never Eat Alone"
// Focus su RELAZIONI strategiche, non solo clienti

export default function RelazioniPage() {
  const { relationships, loading, addRelationship, updateRelationship, deleteRelationship } = useRelationships();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<Relationship | null>(null);
  const [formData, setFormData] = useState<Partial<Relationship>>({});
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingRelation(null);
    setFormData({
      name: '',
      company: '',
      role: '',
      strength: 'developing',
      importance: 'medium',
      category: 'decision_maker',
      nextAction: '',
      mutualBenefits: [''],
      valueBalance: 'balanced',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (relation: Relationship) => {
    setEditingRelation(relation);
    setFormData(relation);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.company || !formData.role) {
      return;
    }

    setSaving(true);
    try {
      if (editingRelation) {
        // Update existing
        await updateRelationship(editingRelation.id, {
          name: formData.name,
          company: formData.company,
          role: formData.role,
          strength: formData.strength || 'developing',
          importance: formData.importance || 'medium',
          category: formData.category || 'decision_maker',
          nextAction: formData.nextAction || '',
          mutualBenefits: formData.mutualBenefits?.filter(b => b.trim()) || [],
          valueBalance: formData.valueBalance || 'balanced',
        });
      } else {
        // Add new
        await addRelationship({
          name: formData.name,
          company: formData.company,
          role: formData.role,
          strength: formData.strength || 'developing',
          importance: formData.importance || 'medium',
          category: formData.category || 'decision_maker',
          lastContact: new Date().toISOString(),
          nextAction: formData.nextAction || '',
          mutualBenefits: formData.mutualBenefits?.filter(b => b.trim()) || [],
          valueBalance: formData.valueBalance || 'balanced',
          noteCount: 0,
        });
      }
      setIsModalOpen(false);
      setFormData({});
    } catch (error) {
      console.error('Error saving relationship:', error);
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa relazione?')) {
      setSaving(true);
      try {
        await deleteRelationship(id);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error deleting relationship:', error);
        alert('Errore durante l\'eliminazione. Riprova.');
      } finally {
        setSaving(false);
      }
    }
  };

  const updateFormField = (field: keyof Relationship, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...(formData.mutualBenefits || [''])];
    newBenefits[index] = value;
    setFormData({ ...formData, mutualBenefits: newBenefits });
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      mutualBenefits: [...(formData.mutualBenefits || []), '']
    });
  };

  const removeBenefit = (index: number) => {
    const newBenefits = (formData.mutualBenefits || []).filter((_, i) => i !== index);
    setFormData({ ...formData, mutualBenefits: newBenefits });
  };

  const filteredRelationships = relationships.filter(rel => {
    const matchesSearch = rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStrength = filterStrength === 'all' || rel.strength === filterStrength;
    const matchesImportance = filterImportance === 'all' || rel.importance === filterImportance;
    return matchesSearch && matchesStrength && matchesImportance;
  });

  const stats = {
    total: relationships.length,
    strong: relationships.filter(r => r.strength === 'strong' || r.strength === 'active').length,
    critical: relationships.filter(r => r.importance === 'critical').length,
    needsAction: relationships.filter(r => r.valueBalance === 'do_give_more').length,
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-700 border-green-300';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'developing': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'weak': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'strong': return '💪';
      case 'active': return '✓';
      case 'developing': return '⟳';
      case 'weak': return '○';
      default: return '○';
    }
  };

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'active': return 'Active';
      case 'developing': return 'Developing';
      case 'weak': return 'Weak';
      default: return strength;
    }
  };

  const getImportanceIcon = (imp: string) => {
    switch (imp) {
      case 'critical': return '⭐⭐⭐';
      case 'high': return '⭐⭐';
      case 'medium': return '⭐';
      case 'low': return '○';
      default: return '';
    }
  };

  const getImportanceLabel = (imp: string) => {
    switch (imp) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return imp;
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

  const formatLastContact = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: it });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento relazioni...</p>
        </div>
      </div>
    );
  }

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
        <Button onClick={openAddModal}>+ Nuova Relazione</Button>
      </div>

      {/* Stats Cards - Ferrazzi Focus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 border-l-4 border-primary">
          <div className="text-sm text-gray-600">Relazioni Totali</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">Rete professionale attiva</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Strong Relationships</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.strong}</div>
          <div className="text-xs text-gray-500 mt-1">Ready for opportunities</div>
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
            value={filterStrength}
            onChange={(e) => setFilterStrength(e.target.value)}
          >
            <option value="all">💪 All Strengths</option>
            <option value="strong">💪 Strong</option>
            <option value="active">✓ Active</option>
            <option value="developing">⟳ Developing</option>
            <option value="weak">○ Weak</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
          >
            <option value="all">⭐ All Importance</option>
            <option value="critical">⭐⭐⭐ Critical</option>
            <option value="high">⭐⭐ High</option>
            <option value="medium">⭐ Medium</option>
            <option value="low">○ Low</option>
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
          {filteredRelationships.map((rel) => {
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
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStrengthColor(rel.strength)}`}>
                    {getStrengthIcon(rel.strength)} {getStrengthLabel(rel.strength)}
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
                    📅 {formatLastContact(rel.lastContact)}
                  </div>
                  <div className="text-xs text-gray-500">
                    📝 {rel.noteCount} note
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(rel)}
                  >
                    ✏️ Modifica
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="space-y-3">
            {filteredRelationships.map((rel) => {
              const balance = getBalanceIndicator(rel.valueBalance);
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  {/* Strength */}
                  <div className={`px-3 py-2 rounded-full text-sm font-semibold border ${getStrengthColor(rel.strength)}`}>
                    {getStrengthIcon(rel.strength)}
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
                      <span className="text-xs text-gray-500">• {formatLastContact(rel.lastContact)}</span>
                    </div>
                  </div>

                  {/* Next Action */}
                  <div className="text-sm text-gray-600 max-w-xs">
                    <span className="font-semibold">⏭️</span> {rel.nextAction}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(rel)}
                  >
                    ✏️ Modifica
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredRelationships.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nessuna relazione trovata
          </h3>
          <p className="text-gray-600 mb-6">
            Inizia a costruire la tua rete di relazioni strategiche
          </p>
          <Button onClick={openAddModal}>+ Aggiungi Prima Relazione</Button>
        </Card>
      )}

      {/* Modal per Aggiungere/Modificare */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRelation ? '✏️ Modifica Relazione' : '➕ Nuova Relazione'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Nome, Azienda, Ruolo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Es. Mario Rossi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Azienda *
              </label>
              <Input
                value={formData.company || ''}
                onChange={(e) => updateFormField('company', e.target.value)}
                placeholder="Es. Acme Corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruolo *
            </label>
            <Input
              value={formData.role || ''}
              onChange={(e) => updateFormField('role', e.target.value)}
              placeholder="Es. CEO, Responsabile Acquisti"
            />
          </div>

          {/* Strength e Importance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💪 Forza della Relazione
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.strength || 'developing'}
                onChange={(e) => updateFormField('strength', e.target.value)}
              >
                <option value="strong">💪 Strong - Relazione consolidata</option>
                <option value="active">✓ Active - Regolarmente in contatto</option>
                <option value="developing">⟳ Developing - In sviluppo</option>
                <option value="weak">○ Weak - Da rafforzare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⭐ Importanza Strategica
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.importance || 'medium'}
                onChange={(e) => updateFormField('importance', e.target.value)}
              >
                <option value="critical">⭐⭐⭐ Critical - Essenziale</option>
                <option value="high">⭐⭐ High - Molto importante</option>
                <option value="medium">⭐ Medium - Importante</option>
                <option value="low">○ Low - Bassa priorità</option>
              </select>
            </div>
          </div>

          {/* Categoria e Value Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎯 Categoria
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.category || 'decision_maker'}
                onChange={(e) => updateFormField('category', e.target.value)}
              >
                <option value="decision_maker">👑 Decisore</option>
                <option value="influencer">📢 Influencer</option>
                <option value="champion">🏆 Champion</option>
                <option value="gatekeeper">🚪 Gatekeeper</option>
                <option value="advisor">🎓 Consulente</option>
                <option value="connector">🌐 Connettore</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⚖️ Bilancio del Valore
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.valueBalance || 'balanced'}
                onChange={(e) => updateFormField('valueBalance', e.target.value)}
              >
                <option value="do_give_more">⬆️ Devo dare più valore</option>
                <option value="balanced">⚖️ Bilanciato</option>
                <option value="do_receive_more">⬇️ Sto ricevendo più valore</option>
              </select>
            </div>
          </div>

          {/* Prossima Azione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⏭️ Prossima Azione
            </label>
            <Input
              value={formData.nextAction || ''}
              onChange={(e) => updateFormField('nextAction', e.target.value)}
              placeholder="Es. Chiamata per follow-up, Meeting per proposta"
            />
          </div>

          {/* Benefici Reciproci */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💚 Benefici Reciproci
            </label>
            <div className="space-y-2">
              {(formData.mutualBenefits || ['']).map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="Es. Partnership strategica, Revenue share"
                    className="flex-1"
                  />
                  {(formData.mutualBenefits?.length || 0) > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={addBenefit}
                className="w-full"
              >
                + Aggiungi Beneficio
              </Button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {editingRelation && (
              <Button
                variant="secondary"
                onClick={() => handleDelete(editingRelation.id)}
                className="bg-red-50 text-red-600 hover:bg-red-100"
              >
                🗑️ Elimina
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.company || !formData.role || saving}
            >
              {saving ? 'Salvataggio...' : editingRelation ? '💾 Salva Modifiche' : '➕ Aggiungi Relazione'}
            </Button>
          </div>
        </div>
      </Modal>

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
