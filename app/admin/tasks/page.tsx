'use client';

import { Card, Badge, Button, Modal, Select, InlineEdit } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import type { AITask } from '@/types';

interface Seller {
  id: string;
  displayName: string;
  email: string;
}

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<AITask | null>(null);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    userId: '',
    type: 'call' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    scheduledAt: '',
    objectives: '',
    clientName: '',
    dealTitle: '',
  });

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, selectedSeller, selectedStatus]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      let url = '/api/admin/tasks?';
      if (selectedSeller !== 'all') url += `sellerId=${selectedSeller}&`;
      if (selectedStatus !== 'all') url += `status=${selectedStatus}&`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load tasks');

      const data = await response.json();
      setTasks(data.tasks);
      setSellers(data.sellers);
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Errore nel caricamento dei task');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (task: AITask) => {
    setViewingTask(task);
    setIsViewModalOpen(true);
  };

  const handleUpdateTaskField = async (taskId: string, field: string, value: string | string[]) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const updatePayload: any = { [field]: value };

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const data = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error; // Re-throw to let InlineEdit handle the error
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo task?')) return;

    try {
      setDeletingTaskId(taskId);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      // Rimuovi dalla lista
      setTasks(prev => prev.filter(t => t.id !== taskId));
      alert('✅ Task eliminato con successo');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('❌ Errore nell\'eliminazione del task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.userId || !newTask.title || !newTask.scheduledAt) {
      alert('Compila i campi obbligatori: Venditore, Titolo, Data/Ora');
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          objectives: newTask.objectives ? newTask.objectives.split('\n').filter(o => o.trim()) : [],
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const data = await response.json();
      setTasks(prev => [data.task, ...prev]);
      setIsCreateModalOpen(false);

      // Reset form
      setNewTask({
        userId: '',
        type: 'call',
        title: '',
        description: '',
        priority: 'medium',
        scheduledAt: '',
        objectives: '',
        clientName: '',
        dealTitle: '',
      });

      alert('✅ Task creato con successo');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('❌ Errore nella creazione del task');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: { variant: 'danger' as const, label: '🔴 Critico' },
      high: { variant: 'warning' as const, label: '🟡 Alta' },
      medium: { variant: 'primary' as const, label: '🟢 Media' },
      low: { variant: 'gray' as const, label: '⚪ Bassa' },
    };
    const config = variants[priority as keyof typeof variants] || variants.medium;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'warning' as const, label: '⏳ Da fare' },
      in_progress: { variant: 'primary' as const, label: '🔄 In corso' },
      completed: { variant: 'success' as const, label: '✅ Completato' },
      snoozed: { variant: 'gray' as const, label: '😴 Posticipato' },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '🤝',
      demo: '🎯',
      follow_up: '🔄',
      research: '🔍',
      admin: '📋',
    };
    return <span className="text-lg">{icons[type as keyof typeof icons] || '📋'}</span>;
  };

  // Stats
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Gestione Task</h1>
          <p className="text-gray-600 mt-2">
            Monitora e gestisci i task di tutti i venditori
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Crea Task Manuale
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-90">Task Totali</div>
          <div className="text-3xl font-bold mt-1">{totalTasks}</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-sm opacity-90">Da Fare</div>
          <div className="text-3xl font-bold mt-1">{pendingTasks}</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-90">Completati</div>
          <div className="text-3xl font-bold mt-1">{completedTasks}</div>
        </Card>
        <Card padding={false} className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm opacity-90">Completion Rate</div>
          <div className="text-3xl font-bold mt-1">{completionRate}%</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venditore
            </label>
            <Select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
            >
              <option value="all">Tutti i venditori</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.displayName || seller.email}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">Da fare</option>
              <option value="in_progress">In corso</option>
              <option value="completed">Completati</option>
              <option value="snoozed">Posticipati</option>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="ghost" onClick={loadTasks}>
              🔄 Aggiorna
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <Card>
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Task ({tasks.length})
          </h3>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>Nessun task trovato</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary transition"
              >
                <div className="flex-shrink-0 pt-1">
                  <InlineEdit
                    value={task.type}
                    onSave={(value) => handleUpdateTaskField(task.id, 'type', value)}
                    type="select"
                    options={[
                      { value: 'call', label: '📞 Chiamata' },
                      { value: 'email', label: '✉️ Email' },
                      { value: 'meeting', label: '🤝 Meeting' },
                      { value: 'demo', label: '🎯 Demo' },
                      { value: 'follow_up', label: '🔄 Follow-up' },
                      { value: 'research', label: '🔍 Ricerca' },
                      { value: 'admin', label: '📋 Admin' },
                    ]}
                    displayFormatter={(value) => getTypeBadge(String(value))}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  {/* Title */}
                  <div>
                    <InlineEdit
                      value={task.title}
                      onSave={(value) => handleUpdateTaskField(task.id, 'title', value)}
                      className="font-semibold text-gray-900 text-base"
                      placeholder="Task title"
                    />
                  </div>

                  {/* Priority, Status, and Scheduled Date */}
                  <div className="flex flex-wrap items-center gap-2">
                    <InlineEdit
                      value={task.priority}
                      onSave={(value) => handleUpdateTaskField(task.id, 'priority', value)}
                      type="select"
                      options={[
                        { value: 'low', label: '⚪ Bassa' },
                        { value: 'medium', label: '🟢 Media' },
                        { value: 'high', label: '🟡 Alta' },
                        { value: 'critical', label: '🔴 Critica' },
                      ]}
                      displayFormatter={(value) => getPriorityBadge(String(value))}
                    />
                    <InlineEdit
                      value={task.status}
                      onSave={(value) => handleUpdateTaskField(task.id, 'status', value)}
                      type="select"
                      options={[
                        { value: 'pending', label: '⏳ Da fare' },
                        { value: 'in_progress', label: '🔄 In corso' },
                        { value: 'completed', label: '✅ Completato' },
                        { value: 'snoozed', label: '😴 Posticipato' },
                      ]}
                      displayFormatter={(value) => getStatusBadge(String(value))}
                    />
                    <Badge variant="gray" size="sm">
                      👤 {(task as any).sellerName}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      📅{' '}
                      <InlineEdit
                        value={task.scheduledAt}
                        onSave={(value) => handleUpdateTaskField(task.id, 'scheduledAt', value)}
                        type="datetime"
                        displayFormatter={(value) =>
                          new Date(String(value)).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-gray-600">
                    <InlineEdit
                      value={task.description || ''}
                      onSave={(value) => handleUpdateTaskField(task.id, 'description', value)}
                      type="textarea"
                      placeholder="Click to add description"
                      rows={2}
                    />
                  </div>

                  {/* AI Rationale - Read only */}
                  {task.aiRationale && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700">
                      <span className="font-semibold">Motivo:</span> {task.aiRationale}
                    </div>
                  )}

                  {/* Client and Deal */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>👤 Cliente:</span>
                      <InlineEdit
                        value={task.clientName || ''}
                        onSave={(value) => handleUpdateTaskField(task.id, 'clientName', value)}
                        placeholder="N/A"
                        className="font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🎯 Deal:</span>
                      <InlineEdit
                        value={task.dealTitle || ''}
                        onSave={(value) => handleUpdateTaskField(task.id, 'dealTitle', value)}
                        placeholder="N/A"
                        className="font-medium"
                      />
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="text-xs">
                    <div className="font-semibold text-gray-700 mb-1">Obiettivi:</div>
                    <InlineEdit
                      value={task.objectives || []}
                      onSave={(value) => {
                        const objectives = Array.isArray(value) ? value : String(value).split('\n').filter(o => o.trim());
                        return handleUpdateTaskField(task.id, 'objectives', objectives);
                      }}
                      type="textarea"
                      multiline={true}
                      placeholder="Click to add objectives (one per line)"
                      rows={3}
                      displayFormatter={(value) => {
                        const objectives = Array.isArray(value) ? value : [];
                        if (objectives.length === 0) return null;
                        return (
                          <ul className="list-disc list-inside space-y-1">
                            {objectives.map((obj, idx) => (
                              <li key={idx}>{obj}</li>
                            ))}
                          </ul>
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  {task.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewTask(task)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Visualizza risultati"
                    >
                      👁️
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={deletingTaskId === task.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingTaskId === task.id ? '⏳' : '🗑️'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crea Nuovo Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venditore *
            </label>
            <Select
              value={newTask.userId}
              onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
              required
            >
              <option value="">Seleziona venditore...</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.displayName || seller.email}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Task *
            </label>
            <Select
              value={newTask.type}
              onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
              required
            >
              <option value="call">📞 Chiamata</option>
              <option value="email">✉️ Email</option>
              <option value="meeting">🤝 Meeting</option>
              <option value="demo">🎯 Demo</option>
              <option value="follow_up">🔄 Follow-up</option>
              <option value="research">🔍 Ricerca</option>
              <option value="admin">📋 Admin</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo *
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Es: Chiamare Mario Rossi per follow-up"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Descrizione dettagliata del task..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <Select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
              >
                <option value="low">⚪ Bassa</option>
                <option value="medium">🟢 Media</option>
                <option value="high">🟡 Alta</option>
                <option value="critical">🔴 Critica</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data/Ora *
              </label>
              <input
                type="datetime-local"
                value={newTask.scheduledAt}
                onChange={(e) => setNewTask({ ...newTask, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (opzionale)
              </label>
              <input
                type="text"
                value={newTask.clientName}
                onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                placeholder="Nome cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal (opzionale)
              </label>
              <input
                type="text"
                value={newTask.dealTitle}
                onChange={(e) => setNewTask({ ...newTask, dealTitle: e.target.value })}
                placeholder="Titolo deal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obiettivi (uno per riga)
            </label>
            <textarea
              value={newTask.objectives}
              onChange={(e) => setNewTask({ ...newTask, objectives: e.target.value })}
              placeholder="Es:&#10;Qualificare interesse&#10;Fissare meeting&#10;Inviare proposta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary text-black bg-white"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button type="submit" className="flex-1">
              ✅ Crea Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Completed Task Modal */}
      {viewingTask && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingTask(null);
          }}
          title="📊 Risultati Task Completato"
          size="lg"
        >
          <div className="space-y-6">
            {/* Task Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewingTask.title}</h3>
                  <p className="text-gray-700">{viewingTask.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getTypeBadge(viewingTask.type)}
                  {getPriorityBadge(viewingTask.priority)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {viewingTask.clientName && (
                  <div>
                    <span className="text-sm text-gray-600">👤 Cliente:</span>
                    <p className="font-semibold text-gray-900">{viewingTask.clientName}</p>
                  </div>
                )}
                {viewingTask.dealTitle && (
                  <div>
                    <span className="text-sm text-gray-600">🎯 Deal:</span>
                    <p className="font-semibold text-gray-900">{viewingTask.dealTitle}</p>
                  </div>
                )}
                {viewingTask.completedAt && (
                  <div>
                    <span className="text-sm text-gray-600">✅ Completato il:</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(viewingTask.completedAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {viewingTask.actualDuration && (
                  <div>
                    <span className="text-sm text-gray-600">⏱️ Tempo impiegato:</span>
                    <p className="font-semibold text-gray-900">{viewingTask.actualDuration} minuti</p>
                  </div>
                )}
              </div>
            </div>

            {/* Outcome */}
            {viewingTask.outcome && (
              <div className="border-2 rounded-xl p-6 bg-white">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  📈 Esito
                </h4>
                <div className="flex items-center gap-2">
                  {viewingTask.outcome === 'success' && (
                    <Badge variant="success" size="lg">😊 Ottimo - Obiettivi raggiunti</Badge>
                  )}
                  {viewingTask.outcome === 'partial' && (
                    <Badge variant="warning" size="lg">😐 Parziale - Alcuni obiettivi raggiunti</Badge>
                  )}
                  {viewingTask.outcome === 'failed' && (
                    <Badge variant="danger" size="lg">😞 Non riuscito - Obiettivi non raggiunti</Badge>
                  )}
                  {viewingTask.outcome === 'no_answer' && (
                    <Badge variant="gray" size="lg">📵 Nessuna risposta</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {viewingTask.notes && (
              <div className="border-2 rounded-xl p-6 bg-white">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  📝 Note del Venditore
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{viewingTask.notes}</p>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {viewingTask.aiAnalysis && (
              <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🤖 Analisi AI
                </h4>
                <p className="text-gray-800 leading-relaxed">{viewingTask.aiAnalysis}</p>
              </div>
            )}

            {/* Attachments */}
            {viewingTask.attachments && viewingTask.attachments.length > 0 && (
              <div className="border-2 rounded-xl p-6 bg-white">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  📎 Documenti Allegati ({viewingTask.attachments.length})
                </h4>
                <div className="space-y-2">
                  {viewingTask.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <span className="text-2xl">📄</span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{attachment}</span>
                      <span className="text-blue-600 text-sm font-medium">Apri →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* No data message */}
            {!viewingTask.notes && !viewingTask.attachments?.length && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>Nessuna nota o documento allegato per questo task</p>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingTask(null);
                }}
                variant="secondary"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
