'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { TaskCard } from '@/components/ai/TaskCard';
import { TaskExecutionModal } from '@/components/ai/TaskExecutionModal';
import { CompletedTaskModal } from '@/components/today/CompletedTaskModal';
import { ArchivedTasks } from '@/components/today/ArchivedTasks';
import { QuickTaskModal } from '@/components/today/QuickTaskModal';
import type { AITask, AIInsight, DailyBriefing } from '@/types';
import { logActivityClient } from '@/lib/utils/activity-logger-client';

export default function TodayPage() {
  const { user } = useAuth();

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [isCompletedTaskModalOpen, setIsCompletedTaskModalOpen] = useState(false);
  const [selectedCompletedTask, setSelectedCompletedTask] = useState<AITask | null>(null);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once when user is available
    if (hasLoadedRef.current || !user) {
      return;
    }

    hasLoadedRef.current = true;
    loadDailyBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadDailyBriefing = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('No auth token available');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.displayName || 'Venditore',
          date: today,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Briefing API error:', errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setBriefing(data);
      setTasks(data.tasks || []);
      setInsights(data.insights || []);

      // Log briefing generation
      try {
        await logActivityClient({
          action: 'briefing_generated',
          entityType: 'briefing',
          details: {
            tasksCount: (data.tasks || []).length,
            insightsCount: (data.insights || []).length,
            date: today,
          },
        });
      } catch (logError) {
        console.error('Error logging briefing generation:', logError);
      }
    } catch (error) {
      console.error('Error loading briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    hasLoadedRef.current = false;
    loadDailyBriefing();
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

  const handleCompleteTask = async (taskId: string, notes: string, outcome: string, actualDuration: number, attachments?: string[]) => {
    // Update task status
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'completed' as const,
              notes,
              outcome: outcome as any,
              actualDuration,
              completedAt: new Date().toISOString(),
              attachments,
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
            actualDuration,
            estimatedDuration: task.estimatedDuration,
            attachments,
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

  const handleUpdateCompletedTask = async (taskId: string, updates: Partial<AITask>) => {
    // Update local state
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    // Save to Firestore via API
    try {
      await fetch('/api/ai/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          taskType: selectedCompletedTask?.type,
          clientName: selectedCompletedTask?.clientName,
          dealTitle: selectedCompletedTask?.dealTitle,
          notes: updates.notes,
          outcome: updates.outcome,
          actualDuration: updates.actualDuration,
          estimatedDuration: selectedCompletedTask?.estimatedDuration,
          attachments: updates.attachments,
        }),
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Ordina task per priorità
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const allPendingTasks = tasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) => {
      // Prima ordina per priorità
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Poi per data di scadenza
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  const completedTasks = tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const archivedTasks = tasks.filter((t) => t.status === 'snoozed');

  const today = new Date().toISOString().split('T')[0];
  const todayCompletedTasks = completedTasks.filter((t) => {
    const taskDate = new Date(t.completedAt!).toISOString().split('T')[0];
    return taskDate === today;
  });

  const completionRate =
    allPendingTasks.length + todayCompletedTasks.length > 0
      ? Math.round((todayCompletedTasks.length / (allPendingTasks.length + todayCompletedTasks.length)) * 100)
      : 0;

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
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
          Buongiorno, {user?.displayName}!
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          {new Date().toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Frase Motivazionale */}
      {briefing?.motivationalMessage && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl sm:text-4xl">💡</span>
            <div className="flex-1">
              <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                {briefing.motivationalMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar Simple */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Progress Oggi</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {todayCompletedTasks.length} completati • {allPendingTasks.length} da fare
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{completionRate}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
          <div
            className="bg-primary h-3 sm:h-4 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Tutti i Task ordinati per priorità */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                🎯 I Tuoi Task
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {allPendingTasks.length} task • Ordinati per priorità
              </p>
            </div>
            <button
              onClick={() => setIsQuickTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Crea nuovo task</span>
              <span className="sm:hidden">Nuovo</span>
            </button>
          </div>

          {allPendingTasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Ottimo lavoro!
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Hai completato tutti i task!
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {allPendingTasks.map((task) => (
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
          {todayCompletedTasks.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                ✅ Completati Oggi ({todayCompletedTasks.length})
              </h3>
              <div className="space-y-2">
                {todayCompletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-green-600 text-lg flex-shrink-0">✓</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm break-words">
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.notes}
                          </div>
                        )}
                        {task.actualDuration && task.estimatedDuration && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              ⏱️ {task.actualDuration} min
                            </span>
                            {task.actualDuration <= task.estimatedDuration && (
                              <span className="text-xs text-green-600 font-medium">
                                🎉 Sotto stima!
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-7 sm:ml-0">
                      <span className="text-xs text-gray-500">
                        {new Date(task.completedAt!).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCompletedTask(task);
                          setIsCompletedTaskModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-100 transition-colors whitespace-nowrap"
                      >
                        👁️ Dettagli
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Completed Task Details Modal */}
      <CompletedTaskModal
        task={selectedCompletedTask}
        isOpen={isCompletedTaskModalOpen}
        onClose={() => {
          setIsCompletedTaskModalOpen(false);
          setSelectedCompletedTask(null);
        }}
        onSave={handleUpdateCompletedTask}
      />

      {/* Modal creazione rapida task */}
      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
