'use client';

import { Card, Badge, Button, Select } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { TaskDetailModal } from '@/components/admin/TaskDetailModal';
import type { AITask } from '@/types';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'seller';
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details: any;
  timestamp: string;
  metadata?: any;
}

interface Seller {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

interface Stats {
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser: Record<string, { count: number; userName: string; userEmail: string }>;
}

export default function AdminActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);

  // Filters
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, selectedSeller, selectedAction, selectedEntityType, startDate, endDate, offset]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      let url = `/api/admin/activities?limit=${limit}&offset=${offset}`;
      if (selectedSeller !== 'all') url += `&userId=${selectedSeller}`;
      if (selectedAction !== 'all') url += `&action=${selectedAction}`;
      if (selectedEntityType !== 'all') url += `&entityType=${selectedEntityType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load activities');

      const data = await response.json();

      // Filtra solo task e relazioni (esclude login, vecchie attività come call/email/demo/meeting, note, briefing)
      const relevantActivities = data.activities.filter((activity: Activity) => {
        const action = activity.action || '';
        return action.startsWith('task_') || action.startsWith('relationship_');
      });

      // Ricalcola le statistiche solo per le attività rilevanti
      const filteredStats: Stats = {
        total: relevantActivities.length,
        byAction: {},
        byEntityType: {},
        byUser: {}
      };

      relevantActivities.forEach((activity: Activity) => {
        // Count by action
        if (activity.action) {
          filteredStats.byAction[activity.action] = (filteredStats.byAction[activity.action] || 0) + 1;
        }

        // Count by entity type
        if (activity.entityType) {
          filteredStats.byEntityType[activity.entityType] = (filteredStats.byEntityType[activity.entityType] || 0) + 1;
        }

        // Count by user
        if (activity.userId) {
          if (!filteredStats.byUser[activity.userId]) {
            filteredStats.byUser[activity.userId] = {
              count: 0,
              userName: activity.userName || 'Sconosciuto',
              userEmail: activity.userEmail || '',
            };
          }
          filteredStats.byUser[activity.userId].count++;
        }
      });

      setActivities(relevantActivities);
      setStats(filteredStats);
      setSellers(data.sellers);
    } catch (error) {
      console.error('Error loading activities:', error);
      alert('Errore nel caricamento delle attività');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      login: '🔐',
      logout: '🚪',
      task_created: '➕',
      task_completed: '✅',
      task_updated: '✏️',
      task_deleted: '🗑️',
      relationship_created: '🤝',
      relationship_updated: '📝',
      relationship_deleted: '❌',
      action_completed: '✓',
      note_added: '💬',
      briefing_generated: '📊',
      // Old format mapped actions
      call_completed: '📞',
      email_sent: '📧',
      meeting_completed: '🤝',
      demo_completed: '🎯',
      follow_up_completed: '🔄',
      research_completed: '🔍',
      admin_task_completed: '📋',
    };
    return icons[action] || '📌';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Accesso',
      logout: 'Uscita',
      task_created: 'Task Creato',
      task_completed: 'Task Completato',
      task_updated: 'Task Aggiornato',
      task_deleted: 'Task Eliminato',
      relationship_created: 'Relazione Creata',
      relationship_updated: 'Relazione Aggiornata',
      relationship_deleted: 'Relazione Eliminata',
      action_completed: 'Azione Completata',
      note_added: 'Nota Aggiunta',
      briefing_generated: 'Briefing Generato',
      // Old format mapped actions
      call_completed: 'Chiamata Completata',
      email_sent: 'Email Inviata',
      meeting_completed: 'Meeting Completato',
      demo_completed: 'Demo Completata',
      follow_up_completed: 'Follow-up Completato',
      research_completed: 'Ricerca Completata',
      admin_task_completed: 'Task Admin Completato',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'success';
    if (action.includes('completed')) return 'success';
    if (action.includes('updated')) return 'primary';
    if (action.includes('deleted')) return 'danger';
    if (action === 'login') return 'primary';
    if (action === 'logout') return 'gray';
    return 'gray';
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'Task',
      relationship: 'Relazione',
      auth: 'Autenticazione',
      note: 'Nota',
      briefing: 'Briefing',
      // Old format types
      call: 'Chiamata',
      email: 'Email',
      meeting: 'Meeting',
      demo: 'Demo',
      follow_up: 'Follow-up',
      research: 'Ricerca',
      admin: 'Admin',
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: it });
    } catch {
      return timestamp;
    }
  };

  const clearFilters = () => {
    setSelectedSeller('all');
    setSelectedAction('all');
    setSelectedEntityType('all');
    setStartDate('');
    setEndDate('');
    setOffset(0);
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      setLoadingTask(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load task details');

      const data = await response.json();
      setSelectedTask(data.task);
      setIsTaskModalOpen(true);
    } catch (error) {
      console.error('Error loading task details:', error);
      alert('Errore nel caricamento dei dettagli del task');
    } finally {
      setLoadingTask(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    // Solo per task completati con entityId
    if (activity.action === 'task_completed' && activity.entityId) {
      loadTaskDetails(activity.entityId);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 Monitoraggio Task e Relazioni</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Tracciamento modifiche a task e relazioni dei venditori
          </p>
        </div>
        <Button onClick={clearFilters} variant="secondary" className="w-full sm:w-auto">
          🔄 Reset Filtri
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card padding={false} className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-xs sm:text-sm opacity-90">Attività Totali</div>
            <div className="text-xl sm:text-3xl font-bold mt-1">{stats.total}</div>
          </Card>
          <Card padding={false} className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-xs sm:text-sm opacity-90">Venditori Attivi</div>
            <div className="text-xl sm:text-3xl font-bold mt-1">{Object.keys(stats.byUser).length}</div>
          </Card>
          <Card padding={false} className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-xs sm:text-sm opacity-90">Tipi di Azioni</div>
            <div className="text-xl sm:text-3xl font-bold mt-1">{Object.keys(stats.byAction).length}</div>
          </Card>
          <Card padding={false} className="p-3 sm:p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-xs sm:text-sm opacity-90">Task Completati</div>
            <div className="text-xl sm:text-3xl font-bold mt-1">{stats.byAction.task_completed || 0}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Filtri</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Seller Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Venditore
              </label>
              <Select
                value={selectedSeller}
                onChange={(e) => {
                  setSelectedSeller(e.target.value);
                  setOffset(0);
                }}
                className="text-sm"
              >
                <option value="all">Tutti i venditori</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.displayName} ({seller.role})
                  </option>
                ))}
              </Select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Azione
              </label>
              <Select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setOffset(0);
                }}
                className="text-sm"
              >
                <option value="all">Tutte le azioni</option>
                <option value="login">Accesso</option>
                <option value="task_created">Task Creato</option>
                <option value="task_completed">Task Completato</option>
                <option value="task_updated">Task Aggiornato</option>
                <option value="relationship_created">Relazione Creata</option>
                <option value="relationship_updated">Relazione Aggiornata</option>
                <option value="action_completed">Azione Completata</option>
                <option value="note_added">Nota Aggiunta</option>
              </Select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Tipo Entità
              </label>
              <Select
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value);
                  setOffset(0);
                }}
                className="text-sm"
              >
                <option value="all">Tutti i tipi</option>
                <option value="task">Task</option>
                <option value="relationship">Relazione</option>
                <option value="auth">Autenticazione</option>
                <option value="note">Nota</option>
                <option value="briefing">Briefing</option>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Activities Timeline */}
      <Card>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Timeline Task e Relazioni
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Monitoraggio modifiche a task e relazioni
        </p>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📭</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Nessuna attività trovata
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const isTaskCompleted = activity.action === 'task_completed' && activity.entityId;

              return (
                <div
                  key={activity.id}
                  onClick={() => isTaskCompleted ? handleActivityClick(activity) : null}
                  className={`flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg transition-colors ${
                    isTaskCompleted
                      ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  title={isTaskCompleted ? 'Clicca per vedere i dettagli completi del task' : undefined}
                >
                  {/* Icon */}
                  <div className="flex items-start gap-3 sm:block sm:text-center">
                    <div className="text-2xl sm:text-3xl flex-shrink-0">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="sm:hidden flex-1">
                      <div className="font-semibold text-gray-900 text-sm">
                        {activity.userName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={getActionColor(activity.action) as any} size="sm">
                        {getActionLabel(activity.action)}
                      </Badge>
                      <Badge variant="gray" size="sm">
                        {getEntityTypeLabel(activity.entityType)}
                      </Badge>
                      {activity.userRole === 'admin' && (
                        <Badge variant="danger" size="sm">
                          👑 Admin
                        </Badge>
                      )}
                      {isTaskCompleted && (
                        <Badge variant="primary" size="sm">
                          👁️ Visualizza Dettagli
                        </Badge>
                      )}
                    </div>

                    <div className="hidden sm:block text-sm font-medium text-gray-900 mb-1">
                      {activity.userName}
                      <span className="text-gray-500 font-normal ml-2">
                        ({activity.userEmail})
                      </span>
                    </div>

                    {activity.entityName && (
                      <div className="text-xs sm:text-sm text-gray-700 mb-1">
                        <span className="font-medium">Entità:</span> {activity.entityName}
                      </div>
                    )}

                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        <details>
                          <summary className="cursor-pointer font-medium">
                            Dettagli
                          </summary>
                          <pre className="mt-2 text-xs overflow-x-auto">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Timestamp (desktop) */}
                  <div className="hidden sm:block text-right text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(activity.timestamp)}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {activities.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t">
            <div className="text-xs sm:text-sm text-gray-600">
              Mostrando {offset + 1} - {offset + activities.length} di {stats?.total || 0}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                variant="secondary"
                size="sm"
              >
                ← Precedente
              </Button>
              <Button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + activities.length >= (stats?.total || 0)}
                variant="secondary"
                size="sm"
              >
                Successivo →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Loading Overlay */}
      {loadingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento dettagli task...</p>
          </div>
        </div>
      )}
    </div>
  );
}
