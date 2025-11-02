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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestione Task AI</h1>
        <p className="text-gray-600 mt-2">
          Genera task personalizzati per ogni venditore con l'AI
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="bg-green-50 border-green-200">
          <p className="text-green-700">{success}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sellers List */}
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Venditori</h2>
          <div className="space-y-2">
            {sellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => handleSelectSeller(seller)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedSeller?.id === seller.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="font-semibold text-gray-900">{seller.displayName}</div>
                <div className="text-sm text-gray-600">{seller.email}</div>
                <div className="text-xs text-gray-500 mt-1">{seller.team}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedSeller ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👈</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Seleziona un Venditore</h3>
                <p className="text-gray-600">
                  Scegli un venditore dalla lista per iniziare a generare task AI
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* AI Task Generator */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🤖 Genera Task AI per {selectedSeller.displayName}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt Personalizzato per l'AI
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Es: Genera 5 task urgenti per chiudere i deals in stage 'proposal_sent'. Focus su follow-up e gestione obiezioni."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] text-gray-900"
                      disabled={generating || confirming}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Descrivi in dettaglio che tipo di task vuoi generare. L'AI analizzerà i deals, clienti e attività del venditore.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleGenerateTasks}
                      disabled={generating || confirming || !customPrompt.trim()}
                      className="flex-1"
                    >
                      {generating ? '⏳ Generando...' : '🚀 Genera Task AI'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Suggested Tasks */}
              {suggestedTasks.length > 0 && (
                <Card className="bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        ✨ Task Consigliati dall'AI ({suggestedTasks.length})
                      </h3>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.size === suggestedTasks.length && suggestedTasks.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-medium">Seleziona tutti</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRegenerate}
                        disabled={confirming}
                      >
                        🔄 Rigenera
                      </Button>
                      {selectedTaskIds.size > 0 && (
                        <Button
                          size="sm"
                          onClick={handleConfirmSelected}
                          disabled={confirming}
                        >
                          {confirming ? '⏳ Salvando...' : `✅ Conferma ${selectedTaskIds.size} Selezionati`}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleConfirmTasks}
                        disabled={confirming}
                      >
                        {confirming ? '⏳ Salvando...' : '✅ Conferma Tutti'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {suggestedTasks.map((task, index) => (
                      <div key={index} className={`bg-white p-4 rounded-lg border-2 ${
                        selectedTaskIds.has(index) ? 'border-blue-500' : 'border-purple-200'
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                              <textarea
                                value={editingTask.description}
                                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-gray-900"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                  value={editingTask.type}
                                  onChange={(e) => setEditingTask({ ...editingTask, type: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                >
                                  <option value="low">Bassa</option>
                                  <option value="medium">Media</option>
                                  <option value="high">Alta</option>
                                  <option value="critical">Critica</option>
                                </select>
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
                                    <strong className="text-gray-900">💡 AI Rationale:</strong> <span className="text-gray-800">{task.aiRationale}</span>
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
                                <div className="flex justify-between items-center mt-3">
                                  <div className="flex gap-4 text-xs text-gray-600">
                                    {task.confidence && <span>🎯 Confidence: {task.confidence}%</span>}
                                    {task.impactScore && <span>⚡ Impact: {task.impactScore}%</span>}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleEditTask(index)}
                                      disabled={confirming}
                                    >
                                      ✏️ Modifica
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleDeleteTask(index)}
                                      disabled={confirming}
                                      className="bg-red-50 text-red-700 hover:bg-red-100"
                                    >
                                      🗑️ Elimina
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
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  ⏳ Task Attivi ({activeTasks.length})
                </h3>
                {activeTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nessun task attivo</p>
                ) : (
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {task.type}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Completed Tasks */}
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  ✅ Task Completati (Ultimi 10)
                </h3>
                {completedTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nessun task completato</p>
                ) : (
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-green-50 rounded-lg opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 line-through">{task.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
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
    </div>
  );
}
