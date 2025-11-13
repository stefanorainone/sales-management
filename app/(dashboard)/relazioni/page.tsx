'use client';

import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useRelationships, type Relationship } from '@/lib/hooks/useRelationships';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRelationshipFilters } from '@/lib/hooks/useRelationshipFilters';
import { useRelationshipForm } from '@/lib/hooks/useRelationshipForm';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { usePagination } from '@/lib/hooks/usePagination';
import { exportToCSV, exportToJSON } from '@/lib/utils/exportImport';

// Modello Ferrazzi "Never Eat Alone"
// Focus su RELAZIONI strategiche, non solo clienti

export default function RelazioniPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { relationships, loading, error, addRelationship, updateRelationship, deleteRelationship, completeAction, addNote } = useRelationships();

  // Custom hooks
  const filters = useRelationshipFilters(relationships);
  const form = useRelationshipForm();
  const pagination = usePagination(filters.filteredRelationships, 20);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [viewingRelation, setViewingRelation] = useState<Relationship | null>(null);
  const [editingRelation, setEditingRelation] = useState<Relationship | null>(null);
  const [relationToDelete, setRelationToDelete] = useState<Relationship | null>(null);
  const [actionRelation, setActionRelation] = useState<Relationship | null>(null);
  const [newActionText, setNewActionText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completingAction, setCompletingAction] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingActionText, setEditingActionText] = useState('');
  const [isDeleteActionDialogOpen, setIsDeleteActionDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);


  // Update actionRelation and editingRelation when relationships change (for real-time updates)
  useEffect(() => {
    if (actionRelation && isActionsModalOpen) {
      const updated = relationships.find(r => r.id === actionRelation.id);
      if (updated) {
        setActionRelation(updated);
      }
    }
    if (editingRelation && isModalOpen) {
      const updated = relationships.find(r => r.id === editingRelation.id);
      if (updated) {
        setEditingRelation(updated);
      }
    }
  }, [relationships, actionRelation?.id, isActionsModalOpen, editingRelation?.id, isModalOpen]);

  const openAddModal = () => {
    setEditingRelation(null);
    form.reset();
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (relation: Relationship) => {
    setEditingRelation(relation);
    form.setFormData(relation);
    setIsFormDirty(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isFormDirty) {
      setIsUnsavedChangesDialogOpen(true);
    } else {
      setIsModalOpen(false);
      form.reset();
    }
  };

  const handleDiscardChanges = () => {
    setIsUnsavedChangesDialogOpen(false);
    setIsModalOpen(false);
    setIsFormDirty(false);
    form.reset();
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setIsUnsavedChangesDialogOpen(false);
  };

  const openDetailsModal = (relation: Relationship) => {
    setViewingRelation(relation);
    setIsDetailsModalOpen(true);
  };

  const openDeleteDialog = (relation: Relationship) => {
    setRelationToDelete(relation);
    setIsDeleteDialogOpen(true);
  };

  const openActionsModal = (relation: Relationship) => {
    setActionRelation(relation);
    setNewActionText(relation.nextAction || '');
    setIsActionsModalOpen(true);
  };

  const handleCompleteCurrentAction = async () => {
    if (!actionRelation?.nextAction) {
      showToast('Nessuna azione da completare', 'error');
      return;
    }

    setCompletingAction(true);
    try {
      await completeAction(actionRelation.id, actionRelation.nextAction);
      showToast('✅ Azione completata!', 'success');
      // Modal will auto-update because relationships updates via onSnapshot
    } catch (error: any) {
      console.error('Error completing action:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setCompletingAction(false);
    }
  };

  const handleSaveNewAction = async () => {
    if (!actionRelation || !newActionText.trim()) {
      showToast('Inserisci una prossima azione', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateRelationship(actionRelation.id, {
        nextAction: newActionText.trim(),
      });
      showToast('✅ Prossima azione aggiornata!', 'success');
      setIsActionsModalOpen(false);
      setNewActionText('');
    } catch (error: any) {
      console.error('Error updating action:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (relationId: string) => {
    if (!newNoteText.trim()) {
      showToast('Inserisci il testo della nota', 'error');
      return;
    }

    setAddingNote(true);
    try {
      await addNote(relationId, newNoteText.trim());
      showToast('✅ Nota aggiunta!', 'success');
      setNewNoteText('');
    } catch (error: any) {
      console.error('Error adding note:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const openDeleteActionDialog = (actionId: string) => {
    setActionToDelete(actionId);
    setIsDeleteActionDialogOpen(true);
  };

  const handleConfirmDeleteAction = async () => {
    if (!actionRelation || !actionToDelete) return;

    try {
      const updatedHistory = actionRelation.actionsHistory.filter(a => a.id !== actionToDelete);
      await updateRelationship(actionRelation.id, {
        actionsHistory: updatedHistory,
      });
      showToast('✅ Azione eliminata!', 'success');
      setIsDeleteActionDialogOpen(false);
      setActionToDelete(null);
    } catch (error: any) {
      console.error('Error deleting action:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    }
  };

  const handleStartEditAction = (action: any) => {
    setEditingActionId(action.id);
    setEditingActionText(action.action);
    setEditingActionType(action.type || 'call');
  };

  const handleSaveEditAction = async (actionId: string) => {
    if (!actionRelation || !editingActionText.trim()) {
      showToast('Inserisci il testo dell\'azione', 'error');
      return;
    }

    try {
      const updatedHistory = actionRelation.actionsHistory.map(a =>
        a.id === actionId ? { ...a, action: editingActionText.trim() } : a
      );
      await updateRelationship(actionRelation.id, {
        actionsHistory: updatedHistory,
      });
      showToast('✅ Azione modificata!', 'success');
      setEditingActionId(null);
      setEditingActionText('');
      setEditingActionType('call');
    } catch (error: any) {
      console.error('Error editing action:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    }
  };

  const handleCancelEditAction = () => {
    setEditingActionId(null);
    setEditingActionText('');
  };

  const handleSave = async () => {
    // Validate using form hook
    if (!form.validate()) {
      showToast('Compila tutti i campi obbligatori', 'error');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...form.formData,
        whatICanGive: form.formData.whatICanGive?.filter((b: string) => b.trim()) || [],
        whatICanReceive: form.formData.whatICanReceive?.filter((b: string) => b.trim()) || [],
      };

      if (editingRelation) {
        await updateRelationship(editingRelation.id, dataToSave);
        showToast('✅ Relazione aggiornata con successo!', 'success');
      } else {
        // Type assertion is safe here because validation ensures required fields are present
        await addRelationship({
          name: form.formData.name!,
          company: form.formData.company!,
          role: form.formData.role!,
          strength: form.formData.strength || 'developing',
          importance: form.formData.importance || 'medium',
          category: form.formData.category || 'decision_maker',
          valueBalance: form.formData.valueBalance || 'balanced',
          nextAction: form.formData.nextAction || '',
          whatICanGive: form.formData.whatICanGive?.filter((b: string) => b.trim()) || [],
          whatICanReceive: form.formData.whatICanReceive?.filter((b: string) => b.trim()) || [],
          lastContact: new Date().toISOString(),
          noteCount: 0,
          actionsHistory: [],
        });
        showToast('✅ Nuova relazione aggiunta!', 'success');
      }

      setIsModalOpen(false);
      form.reset();
      setEditingRelation(null);
      setIsFormDirty(false);
    } catch (error: any) {
      console.error('Error saving relationship:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!relationToDelete) return;
    setDeleting(true);
    try {
      await deleteRelationship(relationToDelete.id);
      showToast('✅ Relazione eliminata con successo', 'success');
      setIsDeleteDialogOpen(false);
      setRelationToDelete(null);
      if (isModalOpen) setIsModalOpen(false);
      if (isDetailsModalOpen) setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting relationship:', error);
      showToast(`❌ Errore: ${error.message || 'Riprova'}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const updateFormField = (field: keyof Relationship, value: any) => {
    form.updateField(field, value);
    setIsFormDirty(true);
  };

  const stats = {
    total: relationships.length,
    strong: relationships.filter(r => r.strength === 'strong' || r.strength === 'active').length,
    critical: relationships.filter(r => r.importance === 'critical').length,
    needsAction: relationships.filter(r => r.valueBalance === 'do_give_more').length,
  };

  // Citazioni motivazionali sulle relazioni - una diversa ogni giorno
  const relationshipQuotes = [
    {
      text: "Il vero potere risiede nel dare generosamente, nel costruire relazioni autentiche e nel creare valore per gli altri prima di chiedere qualcosa in cambio.",
      author: "Keith Ferrazzi, Never Eat Alone"
    },
    {
      text: "Le relazioni più forti si costruiscono quando aiutiamo gli altri a raggiungere i loro obiettivi, non i nostri.",
      author: "Zig Ziglar"
    },
    {
      text: "Il networking non è raccogliere contatti, è piantare semi di relazioni che cresceranno nel tempo.",
      author: "Keith Ferrazzi"
    },
    {
      text: "Le persone dimenticheranno cosa hai detto, dimenticheranno cosa hai fatto, ma non dimenticheranno mai come le hai fatte sentire.",
      author: "Maya Angelou"
    },
    {
      text: "Il successo arriva quando investi nelle relazioni, non solo nelle transazioni.",
      author: "Simon Sinek"
    },
    {
      text: "La qualità delle tue relazioni determina la qualità della tua vita.",
      author: "Tony Robbins"
    },
    {
      text: "Non costruire una rete di contatti. Costruisci una rete di relazioni autentiche.",
      author: "Seth Godin"
    }
  ];

  // Seleziona citazione basata sul giorno dell'anno
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyQuote = relationshipQuotes[dayOfYear % relationshipQuotes.length];

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
      case 'do_give_more': return { icon: '⬆️', text: 'Sto dando più valore', color: 'text-orange-600' };
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
            Il tuo successo è la somma delle persone che conosci e di come le aiuti a crescere
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
          <div className="text-sm text-gray-600">Sto Dando Valore</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.needsAction}</div>
          <div className="text-xs text-gray-500 mt-1">Azioni da fare per loro</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="🔍 Cerca per nome, azienda o ruolo..."
              value={filters.searchTerm}
              onChange={(e) => filters.setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={filters.filterStrength}
            onChange={(e) => filters.setFilterStrength(e.target.value)}
          >
            <option value="all">💪 Tutte le Forze</option>
            <option value="strong">💪 Strong</option>
            <option value="active">✓ Active</option>
            <option value="developing">⟳ Developing</option>
            <option value="weak">○ Weak</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={filters.filterImportance}
            onChange={(e) => filters.setFilterImportance(e.target.value)}
          >
            <option value="all">⭐ Tutte le Importanze</option>
            <option value="critical">⭐⭐⭐ Critical</option>
            <option value="high">⭐⭐ High</option>
            <option value="medium">⭐ Medium</option>
            <option value="low">○ Low</option>
          </select>
        </div>

        {/* Sorting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={filters.sortBy}
            onChange={(e) => filters.setSortBy(e.target.value as any)}
          >
            <option value="name">📛 Ordina per Nome</option>
            <option value="company">🏢 Ordina per Azienda</option>
            <option value="role">💼 Ordina per Ruolo</option>
            <option value="lastContact">📅 Ordina per Ultimo Contatto</option>
            <option value="lastAction">⏱️ Ordina per Ultima Azione</option>
            <option value="importance">⭐ Ordina per Importanza</option>
            <option value="strength">💪 Ordina per Forza Relazione</option>
            <option value="category">🎯 Ordina per Categoria</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={filters.sortOrder}
            onChange={(e) => filters.setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">⬆️ Crescente (A-Z, Vecchio-Nuovo)</option>
            <option value="desc">⬇️ Decrescente (Z-A, Nuovo-Vecchio)</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center px-4 py-2 bg-gray-50 rounded-lg">
            📊 {filters.filteredRelationships.length} relazioni trovate
          </div>
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
          {pagination.paginatedItems.map((rel) => {
            const balance = getBalanceIndicator(rel.valueBalance);
            return (
              <Card
                key={rel.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => openEditModal(rel)}
                >
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

                {/* What I Can Give */}
                {rel.whatICanGive && rel.whatICanGive.length > 0 && rel.whatICanGive.some((item: string) => item.trim()) && (
                  <div className="mb-3 bg-green-50 p-3 rounded-lg">
                    <div className="text-xs font-semibold text-green-700 mb-1">💚 Cosa Posso Dare:</div>
                    <div className="space-y-1">
                      {rel.whatICanGive.filter((item: string) => item.trim()).map((item: string, idx: number) => (
                        <div key={idx} className="text-xs text-green-600">• {item}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What I Can Receive */}
                {rel.whatICanReceive && rel.whatICanReceive.length > 0 && rel.whatICanReceive.some((item: string) => item.trim()) && (
                  <div className="mb-3 bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-semibold text-blue-700 mb-1">💙 Cosa Posso Ricevere:</div>
                    <div className="space-y-1">
                      {rel.whatICanReceive.filter((item: string) => item.trim()).map((item: string, idx: number) => (
                        <div key={idx} className="text-xs text-blue-600">• {item}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Balance */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{balance.icon}</span>
                  <span className={`text-sm font-medium ${balance.color}`}>{balance.text}</span>
                </div>

                {/* Next Action - Clickable */}
                <div
                  className="mb-3 bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openActionsModal(rel);
                  }}
                >
                  <div className="text-xs font-semibold text-blue-700 mb-1">⏭️ Prossima Azione:</div>
                  <div className="text-xs text-blue-600">{rel.nextAction || 'Clicca per pianificare...'}</div>
                  {rel.actionsHistory && rel.actionsHistory.length > 0 && (
                    <div className="text-xs text-blue-500 mt-1">
                      📋 {rel.actionsHistory.length} azioni completate
                    </div>
                  )}
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
                </div>

                {/* Hint text */}
                <div className="mt-3 text-xs text-center text-gray-400 italic">
                  Clicca per modificare • Clicca "Prossima Azione" per gestire attività
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="space-y-3">
            {pagination.paginatedItems.map((rel) => {
              const balance = getBalanceIndicator(rel.valueBalance);
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => openEditModal(rel)}
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

                  {/* Next Action - Clickable */}
                  <div
                    className="text-sm text-gray-600 max-w-xs px-3 py-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionsModal(rel);
                    }}
                  >
                    <span className="font-semibold">⏭️</span> {rel.nextAction || 'Pianifica azione...'}
                    {rel.actionsHistory && rel.actionsHistory.length > 0 && (
                      <span className="text-xs text-blue-500 ml-2">
                        ({rel.actionsHistory.length})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filters.filteredRelationships.length === 0 && (
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
        onClose={handleCloseModal}
        title={editingRelation ? '✏️ Modifica Relazione' : '➕ Nuova Relazione'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Nome, Ruolo, Azienda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome e Cognome *
              </label>
              <Input
                value={form.formData.name || ''}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Es. Mario Rossi"
              />
              {form.errors.name && (
                <p className="text-xs text-red-600 mt-1">{form.errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruolo *
              </label>
              <Input
                value={form.formData.role || ''}
                onChange={(e) => updateFormField('role', e.target.value)}
                placeholder="Es. CEO, Responsabile Acquisti"
              />
              {form.errors.role && (
                <p className="text-xs text-red-600 mt-1">{form.errors.role}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Azienda *
            </label>
            <Input
              value={form.formData.company || ''}
              onChange={(e) => updateFormField('company', e.target.value)}
              placeholder="Es. Acme Corp"
            />
            {form.errors.company && (
              <p className="text-xs text-red-600 mt-1">{form.errors.company}</p>
            )}
          </div>

          {/* Strength e Importance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💪 Forza della Relazione
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                value={form.formData.strength || 'developing'}
                onChange={(e) => updateFormField('strength', e.target.value)}
              >
                <option value="strong">💪 Strong - Relazione consolidata</option>
                <option value="active">✓ Active - Regolarmente in contatto</option>
                <option value="developing">⟳ Developing - In sviluppo</option>
                <option value="weak">○ Weak - Da rafforzare</option>
                <option value="prospective">🎯 Prospective - Relazione da costruire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⭐ Importanza Strategica
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                value={form.formData.importance || 'medium'}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                value={form.formData.category || 'decision_maker'}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                value={form.formData.valueBalance || 'balanced'}
                onChange={(e) => updateFormField('valueBalance', e.target.value)}
              >
                <option value="do_give_more">⬆️ Sto dando più valore</option>
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
              value={form.formData.nextAction || ''}
              onChange={(e) => updateFormField('nextAction', e.target.value)}
              placeholder="Es. Chiamata per follow-up, Meeting per proposta"
            />
          </div>

          {/* Cosa Posso Dare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💚 Cosa Posso Dare
            </label>
            <div className="space-y-2">
              {(form.formData.whatICanGive || ['']).map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => form.updateGive(index, e.target.value)}
                    placeholder="Es. Introduzioni, Consulenza strategica, Partnership"
                    className="flex-1"
                  />
                  {(form.formData.whatICanGive?.length || 0) > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => form.removeGive(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={form.addGive}
                className="w-full"
              >
                + Aggiungi Valore che Posso Dare
              </Button>
            </div>
          </div>

          {/* Cosa Posso Ricevere */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💙 Cosa Posso Ricevere
            </label>
            <div className="space-y-2">
              {(form.formData.whatICanReceive || ['']).map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => form.updateReceive(index, e.target.value)}
                    placeholder="Es. Referral, Opportunità commerciali, Insights di mercato"
                    className="flex-1"
                  />
                  {(form.formData.whatICanReceive?.length || 0) > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => form.removeReceive(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={form.addReceive}
                className="w-full"
              >
                + Aggiungi Valore che Posso Ricevere
              </Button>
            </div>
          </div>

          {/* Notes Section - Only show if editing existing relationship */}
          {editingRelation && (
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
                            {formatLastContact(note.createdAt)}
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
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {editingRelation && (
              <Button
                variant="secondary"
                onClick={() => openDeleteDialog(editingRelation)}
                className="bg-red-50 text-red-600 hover:bg-red-100"
                disabled={saving || deleting}
              >
                🗑️ Elimina
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.formData.name || !form.formData.company || !form.formData.role || saving}
            >
              {saving ? 'Salvataggio...' : editingRelation ? '💾 Salva Modifiche' : '➕ Aggiungi Relazione'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Dettagli - Read Only */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="👁️ Dettagli Relazione"
        size="lg"
      >
        {viewingRelation && (
          <div className="space-y-4">
            {/* Info di base */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{viewingRelation.name}</h3>
              <p className="text-gray-600">{viewingRelation.role}</p>
              <p className="text-sm text-gray-500">{viewingRelation.company}</p>
            </div>

            {/* Metriche */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 font-semibold mb-1">💪 Forza Relazione</div>
                <div className="text-sm font-medium text-blue-900">
                  {getStrengthIcon(viewingRelation.strength)} {getStrengthLabel(viewingRelation.strength)}
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xs text-yellow-600 font-semibold mb-1">⭐ Importanza</div>
                <div className="text-sm font-medium text-yellow-900">
                  {getImportanceLabel(viewingRelation.importance)}
                </div>
              </div>
            </div>

            {/* Categoria e Balance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-purple-600 font-semibold mb-1">🎯 Categoria</div>
                <div className="text-sm font-medium text-purple-900">
                  {getCategoryLabel(viewingRelation.category)}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-semibold mb-1">⚖️ Bilancio Valore</div>
                <div className="text-sm font-medium text-green-900">
                  {getBalanceIndicator(viewingRelation.valueBalance).icon} {getBalanceIndicator(viewingRelation.valueBalance).text}
                </div>
              </div>
            </div>

            {/* Cosa Posso Dare */}
            {viewingRelation.whatICanGive && viewingRelation.whatICanGive.length > 0 && viewingRelation.whatICanGive.some((item: string) => item.trim()) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-green-700 mb-2">💚 Cosa Posso Dare:</div>
                <ul className="space-y-1">
                  {viewingRelation.whatICanGive.filter((item: string) => item.trim()).map((item: string, idx: number) => (
                    <li key={idx} className="text-sm text-green-600">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cosa Posso Ricevere */}
            {viewingRelation.whatICanReceive && viewingRelation.whatICanReceive.length > 0 && viewingRelation.whatICanReceive.some((item: string) => item.trim()) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-blue-700 mb-2">💙 Cosa Posso Ricevere:</div>
                <ul className="space-y-1">
                  {viewingRelation.whatICanReceive.filter((item: string) => item.trim()).map((item: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-600">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prossima Azione */}
            {viewingRelation.nextAction && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-blue-700 mb-1">⏭️ Prossima Azione:</div>
                <div className="text-sm text-blue-600">{viewingRelation.nextAction}</div>
              </div>
            )}

            {/* Storico Azioni Completate */}
            {viewingRelation.actionsHistory && viewingRelation.actionsHistory.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-purple-700 mb-3">📋 Storico Azioni Completate:</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {viewingRelation.actionsHistory
                    .slice()
                    .reverse()
                    .map((action, idx) => (
                      <div key={action.id} className="bg-white p-3 rounded border border-purple-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm text-purple-900 font-medium">{action.action}</div>
                            {action.notes && (
                              <div className="text-xs text-purple-600 mt-1">{action.notes}</div>
                            )}
                          </div>
                          <div className="text-xs text-purple-500 whitespace-nowrap">
                            {formatLastContact(action.completedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Info temporali */}
            <div className="border-t pt-4 flex justify-between text-xs text-gray-500">
              <div>📅 Ultimo contatto: {formatLastContact(viewingRelation.lastContact)}</div>
              <div>📝 {viewingRelation.noteCount} note</div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openEditModal(viewingRelation);
                }}
              >
                ✏️ Modifica
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Chiudi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Gestione Azioni */}
      <Modal
        isOpen={isActionsModalOpen}
        onClose={() => {
          setIsActionsModalOpen(false);
          setNewActionText('');
        }}
        title="⏭️ Gestione Azioni"
        size="lg"
      >
        {actionRelation && (
          <div className="space-y-4">
            {/* Info Relazione */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-900">{actionRelation.name}</h3>
              <p className="text-sm text-gray-600">{actionRelation.company}</p>
            </div>

            {/* Prossima Azione Corrente */}
            {actionRelation.nextAction && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-blue-700 mb-1">Prossima Azione:</div>
                    <div className="text-sm text-blue-900">{actionRelation.nextAction}</div>
                  </div>
                  <Button
                    onClick={handleCompleteCurrentAction}
                    disabled={completingAction}
                    size="sm"
                    className="w-full"
                  >
                    {completingAction ? '...' : '✓ Completa Azione'}
                  </Button>
                </div>
              </div>
            )}

            {/* Nuova Prossima Azione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionRelation.nextAction ? 'Modifica Prossima Azione:' : 'Pianifica Prossima Azione:'}
              </label>
              <Input
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="Es. Chiamata follow-up venerdì alle 15:00"
                className="mb-2"
              />
              <Button
                onClick={handleSaveNewAction}
                disabled={!newActionText.trim() || saving}
                size="sm"
                className="w-full"
              >
                {saving ? 'Salvataggio...' : '💾 Salva Prossima Azione'}
              </Button>
            </div>

            {/* Storico Azioni Completate */}
            {actionRelation.actionsHistory && actionRelation.actionsHistory.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-purple-700 mb-3">📋 Storico Azioni Completate:</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {actionRelation.actionsHistory
                    .slice()
                    .reverse()
                    .map((action) => (
                      <div key={action.id} className="bg-white p-3 rounded border border-purple-200">
                        {editingActionId === action.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingActionText}
                              onChange={(e) => setEditingActionText(e.target.value)}
                              placeholder="Modifica azione..."
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEditAction(action.id)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                ✓ Salva
                              </button>
                              <button
                                onClick={handleCancelEditAction}
                                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                              >
                                ✕ Annulla
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm text-purple-900 font-medium">{action.action}</div>
                              {action.notes && (
                                <div className="text-xs text-purple-600 mt-1">{action.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-purple-500 whitespace-nowrap">
                                {formatLastContact(action.completedAt)}
                              </div>
                              <button
                                onClick={() => handleStartEditAction(action)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Modifica"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => openDeleteActionDialog(action.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Elimina"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {actionRelation.actionsHistory?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Nessuna azione completata ancora</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsActionsModalOpen(false);
                  setNewActionText('');
                }}
                className="flex-1"
              >
                Chiudi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Daily Motivational Quote */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-100 border-l-4 border-primary">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <p className="text-gray-700 italic mb-2">
              "{dailyQuote.text}"
            </p>
            <p className="text-sm text-gray-600 font-semibold">— {dailyQuote.author}</p>
          </div>
        </div>
      </Card>

      {/* Confirm Delete Action Dialog */}
      <ConfirmDialog
        isOpen={isDeleteActionDialogOpen}
        onClose={() => {
          setIsDeleteActionDialogOpen(false);
          setActionToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAction}
        title="Elimina Azione"
        message="Sei sicuro di voler eliminare questa azione completata? Questa azione non può essere annullata."
        confirmText="Elimina"
        type="danger"
      />

      {/* Unsaved Changes Dialog */}
      <Modal
        isOpen={isUnsavedChangesDialogOpen}
        onClose={() => setIsUnsavedChangesDialogOpen(false)}
        title="⚠️ Modifiche non salvate"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Hai apportato delle modifiche che non sono state salvate. Cosa vuoi fare?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveAndClose}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvataggio...' : '💾 Salva e Chiudi'}
            </Button>
            <Button
              onClick={handleDiscardChanges}
              variant="secondary"
              className="w-full bg-red-50 text-red-600 hover:bg-red-100"
            >
              🗑️ Scarta Modifiche
            </Button>
            <Button
              onClick={() => setIsUnsavedChangesDialogOpen(false)}
              variant="secondary"
              className="w-full"
            >
              ✕ Annulla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Relationship Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Elimina Relazione"
        message={`Sei sicuro di voler eliminare la relazione con ${relationToDelete?.name}? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}
