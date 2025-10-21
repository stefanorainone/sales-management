'use client';

import { Card, Badge, Button, Modal, Select } from '@/components/ui';
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
                <div className="flex-shrink-0">
                  {getTypeBadge(task.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                        <Badge variant="gray" size="sm">
                          👤 {(task as any).sellerName}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          📅 {new Date(task.scheduledAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}

                  {task.aiRationale && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700 mb-2">
                      <span className="font-semibold">AI Rationale:</span> {task.aiRationale}
                    </div>
                  )}

                  {(task.clientName || task.dealTitle) && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {task.clientName && (
                        <span>👤 Cliente: <span className="font-medium">{task.clientName}</span></span>
                      )}
                      {task.dealTitle && (
                        <span>🎯 Deal: <span className="font-medium">{task.dealTitle}</span></span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
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
    </div>
  );
}
