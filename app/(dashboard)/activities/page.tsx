'use client';

import { Card, Badge, Button, Input, Select, Modal } from '@/components/ui';
import { useState } from 'react';
import { useActivities } from '@/lib/hooks/useActivities';
import { ActivityForm } from '@/components/activities/ActivityForm';
import type { Activity } from '@/types';

const activityIcons: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '📅',
  demo: '🎯',
  follow_up: '🔄',
  note: '📝',
  task: '✅',
};

export default function ActivitiesPage() {
  const { activities, loading, addActivity, updateActivity, deleteActivity } = useActivities();
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'gray',
    };
    const labels: Record<string, string> = {
      pending: 'Da fare',
      completed: 'Completato',
      cancelled: 'Annullato',
    };
    return <Badge variant={variants[status]} size="sm">{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const variants: Record<string, any> = {
      high: 'danger',
      medium: 'warning',
      low: 'gray',
    };
    return <Badge variant={variants[priority]} size="sm">{priority.toUpperCase()}</Badge>;
  };

  // Filter activities by search, status, and period
  const filteredActivities = activities.filter((activity) => {
    // Search filter
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus !== 'all' && activity.status !== filterStatus) {
      return false;
    }

    // Period filter
    if (filterPeriod !== 'all') {
      if (!activity.scheduledAt) return false;
      const activityDate = new Date(activity.scheduledAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const monthEnd = new Date(today);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      switch (filterPeriod) {
        case 'today':
          return activityDate >= today && activityDate < tomorrow;
        case 'week':
          return activityDate >= today && activityDate < weekEnd;
        case 'month':
          return activityDate >= today && activityDate < monthEnd;
        case 'past':
          return activityDate < today;
        default:
          return true;
      }
    }

    return true;
  });

  // Sort by scheduled date (most recent first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleCreateActivity = async (data: Partial<Activity>) => {
    await addActivity(data as Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>);
    setIsModalOpen(false);
  };

  const handleUpdateActivity = async (data: Partial<Activity>) => {
    if (selectedActivity) {
      await updateActivity(selectedActivity.id, data);
      setIsModalOpen(false);
      setSelectedActivity(undefined);
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    await updateActivity(activity.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);

    const diffTime = activityDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Oggi ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Domani ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === -1) {
      return `Ieri ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} giorni fa - ${date.toLocaleDateString('it-IT')} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('it-IT')} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Stats
  const todayActivities = activities.filter(a => {
    if (!a.scheduledAt) return false;
    const activityDate = new Date(a.scheduledAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return activityDate >= today && activityDate < tomorrow;
  });

  const completedActivities = activities.filter(a => a.status === 'completed');
  const pendingActivities = activities.filter(a => a.status === 'pending');
  const overdueActivities = activities.filter(a => {
    if (!a.scheduledAt) return false;
    return a.status === 'pending' && new Date(a.scheduledAt) < new Date();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attività</h1>
          <p className="text-gray-600 mt-2">Gestisci tutte le tue attività</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                view === 'calendar' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                view === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lista
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>+ Nuova Attività</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Oggi</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {todayActivities.length}
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Completate</div>
          <div className="text-2xl font-bold text-success mt-1">
            {completedActivities.length}
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">In attesa</div>
          <div className="text-2xl font-bold text-warning mt-1">
            {pendingActivities.length}
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">In ritardo</div>
          <div className="text-2xl font-bold text-danger mt-1">
            {overdueActivities.length}
          </div>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueActivities.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Attività in ritardo</h3>
              <p className="text-sm text-gray-600 mt-1">
                Hai {overdueActivities.length} attività da recuperare
              </p>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setFilterPeriod('past');
                setFilterStatus('pending');
              }}
            >
              Visualizza
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              placeholder="Cerca attività per titolo o descrizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">Da fare</option>
            <option value="completed">Completate</option>
            <option value="cancelled">Annullate</option>
          </Select>
          <Select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="all">Tutti i periodi</option>
            <option value="today">Oggi</option>
            <option value="week">Questa settimana</option>
            <option value="month">Questo mese</option>
            <option value="past">Passate</option>
          </Select>
        </div>
      </Card>

      {view === 'list' ? (
        /* List View */
        <Card>
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Attività ({sortedActivities.length})
            </h3>
          </div>

          {sortedActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p>Nessuna attività trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-gray-900">Tipo</th>
                    <th className="pb-3 font-semibold text-gray-900">Titolo</th>
                    <th className="pb-3 font-semibold text-gray-900">Data/Ora</th>
                    <th className="pb-3 font-semibold text-gray-900">Status</th>
                    <th className="pb-3 font-semibold text-gray-900"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedActivities.map((activity) => (
                    <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-2xl">{activityIcons[activity.type]}</td>
                      <td className="py-3">
                        <div className={`font-medium ${activity.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {activity.title}
                        </div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                        )}
                      </td>
                      <td className="py-3 text-gray-600 text-sm">
                        {activity.scheduledAt ? formatDate(activity.scheduledAt) : 'Nessuna data'}
                      </td>
                      <td className="py-3">{getStatusBadge(activity.status)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {activity.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCompleteActivity(activity)}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setIsModalOpen(true);
                                }}
                              >
                                ✏️
                              </Button>
                            </>
                          )}
                          {activity.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsModalOpen(true);
                              }}
                            >
                              👁️
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* Calendar View */
        <div className="space-y-6">
          {sortedActivities.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📅</div>
                <p>Nessuna attività trovata</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Group activities by date */}
              {Object.entries(
                sortedActivities.reduce((groups, activity) => {
                  if (!activity.scheduledAt) return groups;
                  const date = new Date(activity.scheduledAt);
                  date.setHours(0, 0, 0, 0);
                  const dateKey = date.toISOString();
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(activity);
                  return groups;
                }, {} as Record<string, Activity[]>)
              ).map(([dateKey, dayActivities]) => {
                const date = new Date(dateKey);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffTime = date.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let dateLabel = date.toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });

                if (diffDays === 0) dateLabel = 'Oggi - ' + dateLabel;
                else if (diffDays === 1) dateLabel = 'Domani - ' + dateLabel;
                else if (diffDays === -1) dateLabel = 'Ieri - ' + dateLabel;
                else if (diffDays < -1) dateLabel = `${Math.abs(diffDays)} giorni fa - ` + dateLabel;

                return (
                  <Card key={dateKey}>
                    <div className="border-b border-gray-200 pb-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{dateLabel}</h3>
                    </div>
                    <div className="space-y-3">
                      {dayActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            activity.status === 'completed'
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : activity.scheduledAt && new Date(activity.scheduledAt) < new Date() && activity.status === 'pending'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="text-2xl">{activityIcons[activity.type]}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${activity.status === 'completed' ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                                {activity.title}
                              </h4>
                              {getStatusBadge(activity.status)}
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              🕐 {activity.scheduledAt ? new Date(activity.scheduledAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'Nessun orario'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {activity.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCompleteActivity(activity)}
                                >
                                  ✓ Completa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedActivity(activity);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  ✏️
                                </Button>
                              </>
                            )}
                            {activity.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setIsModalOpen(true);
                                }}
                              >
                                👁️ Dettagli
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(undefined);
        }}
        title={selectedActivity ? 'Modifica Attività' : 'Nuova Attività'}
      >
        <ActivityForm
          activity={selectedActivity}
          onSubmit={selectedActivity ? handleUpdateActivity : handleCreateActivity}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedActivity(undefined);
          }}
        />
      </Modal>
    </div>
  );
}
