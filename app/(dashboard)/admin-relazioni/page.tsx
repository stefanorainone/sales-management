'use client';

import { Card, Input, Modal, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAdminRelationships, type RelationshipWithUser } from '@/lib/hooks/useAdminRelationships';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from '@/components/ui/Toast';
import { useRelationshipForm } from '@/lib/hooks/useRelationshipForm';

export default function AdminRelazioniPage() {
  const { user } = useAuth();
  const { relationships, users, recentActivity, stats, loading, error, updateRelationship, deleteRelationship, addNote } = useAdminRelationships();
  const { showToast } = useToast();
  const form = useRelationshipForm();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<RelationshipWithUser | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // Update editingRelation when relationships change (for real-time notes updates)
  useEffect(() => {
    if (editingRelation && isEditModalOpen) {
      const updated = relationships.find(r => r.id === editingRelation.id);
      if (updated) {
        setEditingRelation(updated);
      }
    }
  }, [relationships, editingRelation?.id, isEditModalOpen]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600">Solo gli amministratori possono accedere a questa pagina</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: it });
    } catch {
      return dateString;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'developing': return 'bg-yellow-100 text-yellow-700';
      case 'weak': return 'bg-gray-100 text-gray-700';
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

  const openEditModal = (relation: RelationshipWithUser) => {
    setEditingRelation(relation);
    form.setFormData(relation);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.validate()) {
      showToast('Compila tutti i campi obbligatori', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingRelation) {
        await updateRelationship(editingRelation.id, {
          name: form.formData.name!,
          company: form.formData.company!,
          role: form.formData.role!,
          strength: form.formData.strength || 'developing',
          importance: form.formData.importance || 'medium',
          category: form.formData.category || 'decision_maker',
          valueBalance: form.formData.valueBalance || 'balanced',
          nextAction: form.formData.nextAction || '',
          mutualBenefits: form.formData.mutualBenefits?.filter((b: string) => b.trim()) || [],
        });
        showToast('✅ Relazione aggiornata!', 'success');
        setIsEditModalOpen(false);
        form.reset();
      }
    } catch (error: any) {
      console.error('Error saving relationship:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateFormField = (field: any, value: any) => {
    form.updateField(field, value);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...(form.formData.mutualBenefits || [''])];
    newBenefits[index] = value;
    form.updateField('mutualBenefits', newBenefits);
  };

  const addBenefit = () => {
    form.updateField('mutualBenefits', [...(form.formData.mutualBenefits || []), '']);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = (form.formData.mutualBenefits || []).filter((_: string, i: number) => i !== index);
    form.updateField('mutualBenefits', newBenefits);
  };

  const handleAddNote = async (relationId: string) => {
    if (!newNoteText.trim() || !user) {
      showToast('Inserisci il testo della nota', 'error');
      return;
    }

    setAddingNote(true);
    try {
      await addNote(relationId, newNoteText.trim(), {
        id: user.id,
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || 'admin',
      });
      showToast('✅ Nota aggiunta!', 'success');
      setNewNoteText('');
    } catch (error: any) {
      console.error('Error adding note:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setAddingNote(false);
    }
  };

  // Filter relationships
  const filteredRelationships = relationships.filter(rel => {
    const matchesSearch =
      rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (users[rel.userId]?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser = filterUser === 'all' || rel.userId === filterUser;

    return matchesSearch && matchesUser;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          👨‍💼 Admin: Monitoraggio Relazioni
        </h1>
        <p className="text-gray-600 mt-2">
          Panoramica completa in real-time di tutte le relazioni del team
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 border-l-4 border-primary">
          <div className="text-sm text-gray-600">Relazioni Totali</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRelationships}</div>
          <div className="text-xs text-gray-500 mt-1">Across all users</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Venditori Attivi</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">Team members</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Azioni Oggi</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.actionsToday}</div>
          <div className="text-xs text-gray-500 mt-1">Completed actions</div>
        </Card>

        <Card padding={false} className="p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600">Strong Relations</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats.strongRelationships}</div>
          <div className="text-xs text-gray-500 mt-1">High value relationships</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="🔍 Cerca per nome, azienda o venditore..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="all">👥 Tutti i venditori</option>
            {Object.entries(users).map(([userId, userData]) => (
              <option key={userId} value={userId}>
                {userData.displayName} ({userData.email})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Attività Recente</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">Nessuna attività recente</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {activity.relationshipName}
                        </div>
                        <div className="text-xs text-gray-600">{activity.relationshipCompany}</div>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(activity.completedAt)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">✓ {activity.action}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        👤 {activity.userName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* All Relationships List */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🤝 Tutte le Relazioni ({filteredRelationships.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredRelationships.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm">Nessuna relazione trovata</p>
                </div>
              ) : (
                filteredRelationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{rel.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStrengthColor(rel.strength)}`}>
                            {getStrengthIcon(rel.strength)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{rel.role} • {rel.company}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            👤 {users[rel.userId]?.displayName || 'Unknown'}
                          </span>
                          {rel.nextAction && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              ⏭️ {rel.nextAction}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditModal(rel)}
                        >
                          ✏️ Modifica
                        </Button>
                        <div className="text-xs text-gray-500">
                          📅 {formatDate(rel.lastContact)}
                        </div>
                        {rel.actionsHistory && rel.actionsHistory.length > 0 && (
                          <div className="text-xs text-purple-600">
                            📋 {rel.actionsHistory.length} azioni
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Latest Action */}
                    {rel.actionsHistory && rel.actionsHistory.length > 0 && (
                      <div className="bg-purple-50 p-2 rounded text-xs">
                        <span className="font-semibold text-purple-700">Ultima azione: </span>
                        <span className="text-purple-900">
                          {rel.actionsHistory[rel.actionsHistory.length - 1].action}
                        </span>
                        <span className="text-purple-600 ml-2">
                          ({formatDate(rel.actionsHistory[rel.actionsHistory.length - 1].completedAt)})
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          form.reset();
        }}
        title="✏️ Modifica Relazione (Admin)"
        size="lg"
      >
        {editingRelation && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-700">Venditore:</div>
              <div className="text-sm text-blue-900">
                {users[editingRelation.userId]?.displayName} ({users[editingRelation.userId]?.email})
              </div>
            </div>

            {/* Nome, Azienda, Ruolo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <Input
                  value={form.formData.name || ''}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder="Es. Mario Rossi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Azienda *</label>
                <Input
                  value={form.formData.company || ''}
                  onChange={(e) => updateFormField('company', e.target.value)}
                  placeholder="Es. Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
              <Input
                value={form.formData.role || ''}
                onChange={(e) => updateFormField('role', e.target.value)}
                placeholder="Es. CEO, Responsabile Acquisti"
              />
            </div>

            {/* Strength e Importance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">💪 Forza della Relazione</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  value={form.formData.strength || 'developing'}
                  onChange={(e) => updateFormField('strength', e.target.value)}
                >
                  <option value="strong">💪 Strong</option>
                  <option value="active">✓ Active</option>
                  <option value="developing">⟳ Developing</option>
                  <option value="weak">○ Weak</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⭐ Importanza Strategica</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  value={form.formData.importance || 'medium'}
                  onChange={(e) => updateFormField('importance', e.target.value)}
                >
                  <option value="critical">⭐⭐⭐ Critical</option>
                  <option value="high">⭐⭐ High</option>
                  <option value="medium">⭐ Medium</option>
                  <option value="low">○ Low</option>
                </select>
              </div>
            </div>

            {/* Prossima Azione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">⏭️ Prossima Azione</label>
              <Input
                value={form.formData.nextAction || ''}
                onChange={(e) => updateFormField('nextAction', e.target.value)}
                placeholder="Es. Chiamata per follow-up"
              />
            </div>

            {/* Benefici Reciproci */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">💚 Benefici Reciproci</label>
              <div className="space-y-2">
                {(form.formData.mutualBenefits || ['']).map((benefit: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder="Es. Partnership strategica"
                      className="flex-1"
                    />
                    {(form.formData.mutualBenefits?.length || 0) > 1 && (
                      <Button variant="secondary" size="sm" onClick={() => removeBenefit(index)}>
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addBenefit} className="w-full">
                  + Aggiungi Beneficio
                </Button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                💬 Note e Commenti
              </label>

              {/* Add New Note */}
              <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Aggiungi una nota o commento..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddNote(editingRelation.id);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleAddNote(editingRelation.id)}
                    disabled={!newNoteText.trim() || addingNote}
                    size="sm"
                  >
                    {addingNote ? '...' : '➕'}
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {editingRelation.notes && editingRelation.notes.length > 0 ? (
                  [...editingRelation.notes]
                    .reverse()
                    .map((note) => (
                      <div key={note.id} className="bg-white border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {note.createdByName}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                note.createdByRole === 'admin'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {note.createdByRole === 'admin' ? 'ADMIN' : 'VENDITORE'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nessuna nota ancora. Aggiungi la prima!
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={saving}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
