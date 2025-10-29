'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDeals } from '@/lib/hooks/useDeals';
import { useClients } from '@/lib/hooks/useClients';
import { useActivities } from '@/lib/hooks/useActivities';
import { TaskCard } from '@/components/ai/TaskCard';
import { TaskExecutionModal } from '@/components/ai/TaskExecutionModal';
import { ArchivedTasks } from '@/components/today/ArchivedTasks';
import type { AITask, AIInsight, DailyBriefing } from '@/types';

export default function TodayPage() {
  const { user } = useAuth();
  const { deals, loading: dealsLoading } = useDeals();
  const { clients, loading: clientsLoading } = useClients();
  const { activities, loading: activitiesLoading } = useActivities();

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Wait for all data to load
    if (dealsLoading || clientsLoading || activitiesLoading) {
      return;
    }

    // Only load once
    if (hasLoadedRef.current) {
      return;
    }

    if (user && deals.length > 0) {
      hasLoadedRef.current = true;
      loadDailyBriefing();
    } else if (user) {
      // No deals yet, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dealsLoading, clientsLoading, activitiesLoading, deals.length]);

  const loadDailyBriefing = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.displayName || 'Venditore',
          deals,
          clients,
          recentActivities: activities.slice(0, 10),
          date: today,
        }),
      });

      const data = await response.json();
      setBriefing(data);
      setTasks(data.tasks);
      setInsights(data.insights);
    } catch (error) {
      console.error('Error loading briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (task: AITask) => {
    setSelectedTask(task);
    setIsExecutionModalOpen(true);
  };

  const handleSkipTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'skipped' as const } : t))
    );
  };

  const handleDismissTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'dismissed' as const, dismissedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleSnoozeTask = (taskId: string, snoozeUntil: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const postponeRecord: import('@/types').TaskPostponeReason = {
            timestamp: new Date().toISOString(),
            reason,
            postponedFrom: t.scheduledAt,
            postponedTo: snoozeUntil,
          };

          return {
            ...t,
            status: 'snoozed' as const,
            snoozedUntil: snoozeUntil,
            originalScheduledAt: t.originalScheduledAt || t.scheduledAt,
            postponeHistory: [...(t.postponeHistory || []), postponeRecord],
          };
        }
        return t;
      })
    );
  };

  const handleRestoreTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'pending' as const,
              snoozedUntil: undefined,
              dismissedAt: undefined,
            }
          : t
      )
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCompleteTask = async (taskId: string, notes: string, outcome: string) => {
    // Update task status
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'completed' as const,
              notes,
              outcome: outcome as any,
              completedAt: new Date().toISOString(),
            }
          : t
      )
    );

    // Send to AI for analysis
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      try {
        await fetch('/api/ai/analyze-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            taskType: task.type,
            clientName: task.clientName,
            dealTitle: task.dealTitle,
            notes,
            outcome,
          }),
        });
      } catch (error) {
        console.error('Error analyzing notes:', error);
      }
    }
  };

  const handleDismissInsight = (insightId: string) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === insightId ? { ...i, dismissed: true } : i))
    );
  };

  // Filtra task per data
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const todayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.scheduledAt).toISOString().split('T')[0];
    return taskDate === today && t.status !== 'snoozed' && t.status !== 'dismissed';
  });

  const tomorrowTasks = tasks.filter((t) => {
    const taskDate = new Date(t.scheduledAt).toISOString().split('T')[0];
    return taskDate === tomorrowDate && t.status !== 'snoozed' && t.status !== 'dismissed';
  });

  const archivedTasks = tasks.filter(
    (t) => t.status === 'snoozed'
  );

  const pendingTodayTasks = todayTasks.filter((t) => t.status === 'pending');
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
  const completionRate =
    todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

  const activeInsights = insights.filter((i) => !i.dismissed);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento briefing giornaliero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {briefing?.motivationalMessage || `Buongiorno, ${user?.displayName}!`}
        </h1>
        <p className="text-gray-600 text-lg">
          {new Date().toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Progress Bar Simple */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Progress Oggi</h2>
            <p className="text-sm text-gray-600">
              {completedTodayTasks.length} su {todayTasks.length} task completati
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">{completionRate}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-primary h-4 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Task di Oggi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                🎯 Task di Oggi
              </h2>
              <p className="text-gray-600 mt-1">
                {pendingTodayTasks.length} task da completare
              </p>
            </div>
          </div>

          {pendingTodayTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ottimo lavoro!
              </h3>
              <p className="text-gray-600">
                Hai completato tutti i task di oggi!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTodayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onSkip={handleSkipTask}
                  onSnooze={handleSnoozeTask}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTodayTasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ✅ Completati Oggi ({completedTodayTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-green-600 text-xl">✓</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {task.title}
                      </div>
                      {task.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          {task.notes}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(task.completedAt!).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task di Domani */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                📅 Task di Domani
              </h2>
              <p className="text-gray-600 mt-1">
                {tomorrowTasks.length} task programmati • Puoi posticipare quelli che non sono urgenti
              </p>
            </div>
          </div>

          {tomorrowTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>Nessun task programmato per domani</p>
              <p className="text-sm mt-2">I task verranno generati dall'AI questa sera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tomorrowTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onSkip={handleSkipTask}
                  onSnooze={handleSnoozeTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Archived Tasks */}
        <ArchivedTasks
          tasks={archivedTasks}
          onRestore={handleRestoreTask}
        />
      </div>

      {/* Task Execution Modal */}
      <TaskExecutionModal
        task={selectedTask}
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        onComplete={handleCompleteTask}
      />
    </div>
  );
}
