'use client';

import { Card, Button, Input } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  team: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  scheduledAt: string;
  aiRationale?: string;
  objectives?: string[];
  confidence?: number;
  impactScore?: number;
  expectedOutputFormat?: {
    type: 'text' | 'structured_data' | 'google_sheet' | 'document' | 'mixed';
    description: string;
    example?: string;
    fields?: string[];
  };
}

export default function AdminAITasksPage() {
  const { user: currentUser } = useAuth();
  const [sellers, setSellers] = useState<User[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingActiveTask, setEditingActiveTask] = useState<Task | null>(null);
  const [isEditActiveModalOpen, setIsEditActiveModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['seller', 'team_leader'])
      );
      const snapshot = await getDocs(usersQuery);
      const sellersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setSellers(sellersList);
    } catch (err: any) {
      setError('Errore nel caricamento venditori: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForSeller = async (sellerId: string) => {
    try {
      // Load active tasks (pending and in_progress)
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', sellerId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const allTasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // Filter active tasks in memory
      const activeTasks = allTasks.filter(
        task => task.status === 'pending' || task.status === 'in_progress'
      );
      setActiveTasks(activeTasks);

      // Load completed tasks (last 10)
      const completedQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', sellerId),
        where('status', '==', 'completed'),
        orderBy('scheduledAt', 'desc')
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completedTasks = completedSnapshot.docs.slice(0, 10).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setCompletedTasks(completedTasks);

    } catch (err: any) {
      setError('Errore nel caricamento task: ' + err.message);
    }
  };

  const handleSelectSeller = async (seller: User) => {
    setSelectedSeller(seller);
    setSuggestedTasks([]);
    setCustomPrompt('');
    setError('');
    setSuccess('');
    await loadTasksForSeller(seller.id);
  };

  const handleGenerateTasks = async () => {
    if (!selectedSeller || !customPrompt.trim()) {
      setError('Seleziona un venditore e inserisci un prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/generate-tasks-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedSeller.id,
          customPrompt: customPrompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tasks');
      }

      setSuggestedTasks(data.tasks);
      setSuccess(`✅ Generati ${data.tasksGenerated} task consigliati dall'AI!`);
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmTasks = async () => {
    if (!selectedSeller || suggestedTasks.length === 0) {
      setError('Nessun task da confermare');
      return;
    }

    if (!confirm(`Confermare ${suggestedTasks.length} task per ${selectedSeller.displayName}?`)) {
      return;
    }

    setConfirming(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/confirm-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedSeller.id,
          tasks: suggestedTasks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm tasks');
      }

      setSuccess(`✅ Confermati ${data.tasksSaved} task per ${selectedSeller.displayName}!`);
      setSuggestedTasks([]);
      setCustomPrompt('');
      await loadTasksForSeller(selectedSeller.id);
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const handleRegenerate = () => {
    setSuggestedTasks([]);
    setSelectedTaskIds(new Set());
    setEditingTaskIndex(null);
    setEditingTask(null);
    setSuccess('');
    setError('');
  };

  const toggleTaskSelection = (index: number) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedTaskIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === suggestedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(suggestedTasks.map((_, i) => i)));
    }
  };

  const handleEditTask = (index: number) => {
    setEditingTaskIndex(index);
    setEditingTask({ ...suggestedTasks[index] });
  };

  const handleSaveEdit = () => {
    if (editingTaskIndex !== null && editingTask) {
      const updatedTasks = [...suggestedTasks];
      updatedTasks[editingTaskIndex] = editingTask;
      setSuggestedTasks(updatedTasks);
      setEditingTaskIndex(null);
      setEditingTask(null);
      setSuccess('✅ Task modificato con successo!');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskIndex(null);
    setEditingTask(null);
  };

  const handleDeleteTask = (index: number) => {
    if (confirm('Vuoi eliminare questo task?')) {
      const updatedTasks = suggestedTasks.filter((_, i) => i !== index);
      setSuggestedTasks(updatedTasks);

      // Update selected task IDs after deletion
      const newSelection = new Set<number>();
      selectedTaskIds.forEach(id => {
        if (id < index) {
          newSelection.add(id);
        } else if (id > index) {
          newSelection.add(id - 1);
        }
      });
      setSelectedTaskIds(newSelection);

      setSuccess('✅ Task eliminato!');
    }
  };

  const handleConfirmSelected = async () => {
    if (!selectedSeller || selectedTaskIds.size === 0) {
      setError('Seleziona almeno un task da confermare');
      return;
    }

    const tasksToConfirm = suggestedTasks.filter((_, index) => selectedTaskIds.has(index));

    if (!confirm(`Confermare ${tasksToConfirm.length} task selezionati per ${selectedSeller.displayName}?`)) {
      return;
    }

    setConfirming(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/confirm-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedSeller.id,
          tasks: tasksToConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm tasks');
      }

      setSuccess(`✅ Confermati ${data.tasksSaved} task per ${selectedSeller.displayName}!`);

      // Remove confirmed tasks from the list
      const remainingTasks = suggestedTasks.filter((_, index) => !selectedTaskIds.has(index));
      setSuggestedTasks(remainingTasks);
      setSelectedTaskIds(new Set());

      if (remainingTasks.length === 0) {
        setCustomPrompt('');
      }

      await loadTasksForSeller(selectedSeller.id);
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const handleEditActiveTask = (task: Task) => {
    setEditingActiveTask(task);
    setIsEditActiveModalOpen(true);
  };

  const handleSaveActiveTask = async () => {
    if (!editingActiveTask || !selectedSeller) return;

    setConfirming(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/tasks/${editingActiveTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingActiveTask),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setSuccess(`✅ Task aggiornato con successo!`);
      setIsEditActiveModalOpen(false);
      setEditingActiveTask(null);
      await loadTasksForSeller(selectedSeller.id);
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteActiveTask = async (taskId: string) => {
    if (!selectedSeller || !confirm('Sei sicuro di voler eliminare questo task?')) return;

    setConfirming(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      setSuccess(`✅ Task eliminato con successo!`);
      await loadTasksForSeller(selectedSeller.id);
    } catch (err: any) {
      setError(`❌ Errore: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h3>
            <p className="text-gray-600">Solo gli amministratori possono accedere a questa pagina.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                🤖 Gestione Task AI
              </h1>
              <p className="text-gray-600 mt-2">
                Genera task personalizzati per ogni venditore con l'intelligenza artificiale
              </p>
            </div>
            {selectedSeller && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedSeller.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{selectedSeller.displayName}</div>
                  <div className="text-xs text-gray-600">{selectedSeller.team}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sellers List - Desktop */}
        <div className="hidden xl:block xl:col-span-1">
          <Card className="sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👥</span>
              <h2 className="text-xl font-bold text-gray-900">Venditori</h2>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {sellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => handleSelectSeller(seller)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    selectedSeller?.id === seller.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedSeller?.id === seller.id
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {seller.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${
                        selectedSeller?.id === seller.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {seller.displayName}
                      </div>
                      <div className={`text-sm truncate ${
                        selectedSeller?.id === seller.id ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {seller.team}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Sellers Dropdown - Mobile */}
        <div className="xl:hidden">
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👥 Seleziona Venditore
            </label>
            <select
              value={selectedSeller?.id || ''}
              onChange={(e) => {
                const seller = sellers.find(s => s.id === e.target.value);
                if (seller) handleSelectSeller(seller);
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
            >
              <option value="">-- Scegli un venditore --</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.displayName} ({seller.team})
                </option>
              ))}
            </select>
          </Card>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {!selectedSeller ? (
            <Card>
              <div className="text-center py-16 px-4">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Seleziona un Venditore</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Scegli un venditore dalla lista o dal dropdown per iniziare a generare task AI personalizzati
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* AI Task Generator */}
              <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🤖</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Genera Task AI per {selectedSeller.displayName}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💬 Prompt Personalizzato per l'AI
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Es: Genera 5 task urgenti per chiudere i deals in stage 'proposal_sent'. Focus su follow-up e gestione obiezioni."
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[140px] text-black bg-white shadow-sm transition-all"
                      disabled={generating || confirming}
                    />
                    <p className="text-xs text-gray-600 mt-2 flex items-start gap-2">
                      <span>💡</span>
                      <span>Descrivi in dettaglio che tipo di task vuoi generare. L'AI analizzerà i deals, clienti e attività del venditore per creare task strategici e personalizzati.</span>
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerateTasks}
                    disabled={generating || confirming || !customPrompt.trim()}
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generando task con AI...
                      </span>
                    ) : (
                      '🚀 Genera Task AI'
                    )}
                  </Button>
                </div>
              </Card>

              {/* Suggested Tasks */}
              {suggestedTasks.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg">
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          Task Consigliati dall'AI ({suggestedTasks.length})
                        </h3>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-purple-200">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.size === suggestedTasks.length && suggestedTasks.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="font-medium">Seleziona tutti</span>
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRegenerate}
                        disabled={confirming}
                        className="bg-white border-2 border-gray-300 hover:border-gray-400"
                      >
                        🔄 Rigenera
                      </Button>
                      {selectedTaskIds.size > 0 && (
                        <Button
                          size="sm"
                          onClick={handleConfirmSelected}
                          disabled={confirming}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:shadow-lg"
                        >
                          {confirming ? '⏳ Salvando...' : `✅ Conferma ${selectedTaskIds.size} Task`}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleConfirmTasks}
                        disabled={confirming}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg"
                      >
                        {confirming ? '⏳ Salvando...' : '✅ Conferma Tutti'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {suggestedTasks.map((task, index) => (
                      <div key={index} className={`bg-white p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                        selectedTaskIds.has(index)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-purple-200 hover:border-purple-300'
                      }`}>
                        {editingTaskIndex === index && editingTask ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                              <input
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                              <textarea
                                value={editingTask.description}
                                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-black bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                  value={editingTask.type}
                                  onChange={(e) => setEditingTask({ ...editingTask, type: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                >
                                  <option value="call">Chiamata</option>
                                  <option value="email">Email</option>
                                  <option value="meeting">Riunione</option>
                                  <option value="demo">Demo</option>
                                  <option value="follow_up">Follow-up</option>
                                  <option value="research">Ricerca</option>
                                  <option value="note">Nota</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label>
                                <select
                                  value={editingTask.priority}
                                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                >
                                  <option value="low">Bassa</option>
                                  <option value="medium">Media</option>
                                  <option value="high">Alta</option>
                                  <option value="critical">Critica</option>
                                </select>
                              </div>
                            </div>

                            {/* Expected Output Format */}
                            <div className="border-t pt-3 mt-3">
                              <h5 className="font-medium text-gray-900 mb-2">📋 Formato Output Richiesto</h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Formato</label>
                                  <select
                                    value={editingTask.expectedOutputFormat?.type || 'text'}
                                    onChange={(e) => setEditingTask({
                                      ...editingTask,
                                      expectedOutputFormat: {
                                        ...editingTask.expectedOutputFormat,
                                        type: e.target.value as any,
                                        description: editingTask.expectedOutputFormat?.description || '',
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                  >
                                    <option value="text">📝 Testo Descrittivo</option>
                                    <option value="structured_data">📊 Dati Strutturati</option>
                                    <option value="google_sheet">📈 Google Sheet</option>
                                    <option value="document">📄 Documento</option>
                                    <option value="mixed">🔀 Formato Misto</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Formato</label>
                                  <textarea
                                    value={editingTask.expectedOutputFormat?.description || ''}
                                    onChange={(e) => setEditingTask({
                                      ...editingTask,
                                      expectedOutputFormat: {
                                        ...editingTask.expectedOutputFormat!,
                                        type: editingTask.expectedOutputFormat?.type || 'text',
                                        description: e.target.value,
                                      }
                                    })}
                                    placeholder="Descrivi che formato il venditore deve usare per il risultato..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] text-black bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Esempio (opzionale)</label>
                                  <textarea
                                    value={editingTask.expectedOutputFormat?.example || ''}
                                    onChange={(e) => setEditingTask({
                                      ...editingTask,
                                      expectedOutputFormat: {
                                        ...editingTask.expectedOutputFormat!,
                                        type: editingTask.expectedOutputFormat?.type || 'text',
                                        description: editingTask.expectedOutputFormat?.description || '',
                                        example: e.target.value,
                                      }
                                    })}
                                    placeholder="Fornisci un esempio di output atteso..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] text-black bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Campi Richiesti (per structured_data/google_sheet, separati da virgola)</label>
                                  <input
                                    type="text"
                                    value={editingTask.expectedOutputFormat?.fields?.join(', ') || ''}
                                    onChange={(e) => setEditingTask({
                                      ...editingTask,
                                      expectedOutputFormat: {
                                        ...editingTask.expectedOutputFormat!,
                                        type: editingTask.expectedOutputFormat?.type || 'text',
                                        description: editingTask.expectedOutputFormat?.description || '',
                                        fields: e.target.value.split(',').map(f => f.trim()).filter(Boolean),
                                      }
                                    })}
                                    placeholder="Es: Nome Contatto, Email, Telefono, Note"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                💾 Salva
                              </Button>
                              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                ❌ Annulla
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedTaskIds.has(index)}
                                onChange={() => toggleTaskSelection(index)}
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">
                                      {task.type === 'call' && '📞'}
                                      {task.type === 'email' && '✉️'}
                                      {task.type === 'meeting' && '📅'}
                                      {task.type === 'demo' && '🎯'}
                                      {task.type === 'follow_up' && '🔄'}
                                      {task.type === 'research' && '🔍'}
                                      {task.type === 'note' && '📝'}
                                    </span>
                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{task.description}</p>
                                {task.aiRationale && (
                                  <div className="bg-purple-100 p-3 rounded text-sm mb-2">
                                    <strong className="text-gray-900">💡 Motivo:</strong> <span className="text-gray-800">{task.aiRationale}</span>
                                  </div>
                                )}
                                {task.objectives && task.objectives.length > 0 && (
                                  <div className="text-sm text-gray-700 mb-2">
                                    <strong className="text-gray-900">Obiettivi:</strong>
                                    <ul className="list-disc list-inside ml-2">
                                      {task.objectives.map((obj, i) => (
                                        <li key={i} className="text-gray-700">{obj}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {task.expectedOutputFormat && (
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <strong className="text-gray-900">📋 Formato Output:</strong>
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                        {task.expectedOutputFormat.type === 'text' && '📝 Testo'}
                                        {task.expectedOutputFormat.type === 'structured_data' && '📊 Dati Strutturati'}
                                        {task.expectedOutputFormat.type === 'google_sheet' && '📈 Google Sheet'}
                                        {task.expectedOutputFormat.type === 'document' && '📄 Documento'}
                                        {task.expectedOutputFormat.type === 'mixed' && '🔀 Misto'}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-xs mb-1">{task.expectedOutputFormat.description}</p>
                                    {task.expectedOutputFormat.fields && task.expectedOutputFormat.fields.length > 0 && (
                                      <div className="mt-1">
                                        <span className="text-xs font-medium text-gray-700">Campi: </span>
                                        <span className="text-xs text-gray-600">{task.expectedOutputFormat.fields.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 mt-4 pt-3 border-t border-gray-200">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleEditTask(index)}
                                      disabled={confirming}
                                      className="flex-1 sm:flex-none bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                    >
                                      <span className="hidden sm:inline">✏️ Modifica</span>
                                      <span className="sm:hidden">✏️</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleDeleteTask(index)}
                                      disabled={confirming}
                                      className="flex-1 sm:flex-none bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                    >
                                      <span className="hidden sm:inline">🗑️ Elimina</span>
                                      <span className="sm:hidden">🗑️</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Active Tasks */}
              <Card className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">⏳</span>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Task Attivi ({activeTasks.length})
                  </h3>
                </div>
                {activeTasks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-500 font-medium">Nessun task attivo al momento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTasks.map((task) => (
                      <div key={task.id} className="p-4 sm:p-5 bg-white rounded-xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{task.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                {task.type}
                              </span>
                              <span className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                                {task.status}
                              </span>
                              <span className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                                {task.priority}
                              </span>
                              {task.scheduledAt && (
                                <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-semibold">
                                  📅 {new Date(task.scheduledAt).toLocaleString('it-IT', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditActiveTask(task)}
                              disabled={confirming}
                              className="flex-1 sm:flex-none bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-4"
                            >
                              <span className="hidden sm:inline">✏️ Modifica</span>
                              <span className="sm:hidden">✏️</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDeleteActiveTask(task.id)}
                              disabled={confirming}
                              className="flex-1 sm:flex-none bg-red-50 text-red-700 hover:bg-red-100 border-red-200 px-4"
                            >
                              <span className="hidden sm:inline">🗑️ Elimina</span>
                              <span className="sm:hidden">🗑️</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Completed Tasks */}
              <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">✅</span>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Task Completati (Ultimi 10)
                  </h3>
                </div>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-gray-500 font-medium">Nessun task completato ancora</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="p-4 sm:p-5 bg-white rounded-xl border-2 border-green-200 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mt-1">
                            ✓
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-700 line-through mb-1">{task.title}</h4>
                            <p className="text-sm text-gray-600 line-through">{task.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                {task.type}
                              </span>
                              {task.scheduledAt && (
                                <span className="text-xs text-gray-500">
                                  📅 {new Date(task.scheduledAt).toLocaleDateString('it-IT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

        {/* Edit Active Task Modal */}
        {editingActiveTask && isEditActiveModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">✏️</span>
                <h3 className="text-2xl font-bold text-gray-900">Modifica Task Attivo</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={editingActiveTask.title}
                    onChange={(e) => setEditingActiveTask({ ...editingActiveTask, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descrizione</label>
                  <textarea
                    value={editingActiveTask.description}
                    onChange={(e) => setEditingActiveTask({ ...editingActiveTask, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] text-black bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                    <select
                      value={editingActiveTask.type}
                      onChange={(e) => setEditingActiveTask({ ...editingActiveTask, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white transition-all"
                    >
                      <option value="call">📞 Chiamata</option>
                      <option value="email">✉️ Email</option>
                      <option value="meeting">📅 Riunione</option>
                      <option value="demo">🎯 Demo</option>
                      <option value="follow_up">🔄 Follow-up</option>
                      <option value="research">🔍 Ricerca</option>
                      <option value="admin">⚙️ Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priorità</label>
                    <select
                      value={editingActiveTask.priority}
                      onChange={(e) => setEditingActiveTask({ ...editingActiveTask, priority: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white transition-all"
                    >
                      <option value="low">🔵 Bassa</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🟠 Alta</option>
                      <option value="critical">🔴 Critica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stato</label>
                    <select
                      value={editingActiveTask.status}
                      onChange={(e) => setEditingActiveTask({ ...editingActiveTask, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white transition-all"
                    >
                      <option value="pending">⏳ Da fare</option>
                      <option value="in_progress">🚀 In corso</option>
                      <option value="completed">✅ Completato</option>
                      <option value="snoozed">💤 Posticipato</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data/Ora</label>
                    <input
                      type="datetime-local"
                      value={editingActiveTask.scheduledAt ? new Date(editingActiveTask.scheduledAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingActiveTask({ ...editingActiveTask, scheduledAt: new Date(e.target.value).toISOString() })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => {
                      setIsEditActiveModalOpen(false);
                      setEditingActiveTask(null);
                    }}
                    disabled={confirming}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    ❌ Annulla
                  </button>
                  <button
                    onClick={handleSaveActiveTask}
                    disabled={confirming}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {confirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </span>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
