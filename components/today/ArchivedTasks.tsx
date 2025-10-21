'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import type { AITask } from '@/types';

interface ArchivedTasksProps {
  tasks: AITask[];
  onRestore: (taskId: string) => Promise<void>;
}

export function ArchivedTasks({ tasks, onRestore }: ArchivedTasksProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'snoozed' | 'dismissed' | null>('snoozed');

  const snoozedTasks = tasks.filter((task) => task.status === 'snoozed');
  const dismissedTasks = tasks.filter((task) => task.status === 'dismissed');

  const handleRestore = async (taskId: string) => {
    setLoading(taskId);
    try {
      await onRestore(taskId);
    } catch (error) {
      console.error('Error restoring task:', error);
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Domani';
    }
    // Otherwise show date
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min fa`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h fa`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}g fa`;
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">📦 Task Archiviati</h3>
        <p className="text-sm text-gray-600">
          Task posticipati che puoi ripristinare
        </p>
      </div>

      <div className="space-y-3">
        {/* Snoozed Tasks Section */}
        {snoozedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'snoozed' ? null : 'snoozed')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <span className="font-semibold text-gray-900">Task Posticipati</span>
                <Badge variant="primary" size="sm">
                  {snoozedTasks.length}
                </Badge>
              </div>
              <span className="text-gray-600">
                {expandedSection === 'snoozed' ? '▼' : '▶'}
              </span>
            </button>

            {expandedSection === 'snoozed' && (
              <div className="mt-2 space-y-2">
                {snoozedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              task.priority === 'critical'
                                ? 'danger'
                                : task.priority === 'high'
                                ? 'warning'
                                : 'primary'
                            }
                            size="sm"
                          >
                            {task.priority}
                          </Badge>
                          {task.snoozedUntil && (
                            <span className="text-xs text-blue-600 font-medium">
                              📅 Ripristina: {formatDate(task.snoozedUntil)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        {(task.dealTitle || task.clientName) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {task.dealId && '🎯'}
                              {task.clientId && !task.dealId && '👤'}
                            </span>
                            <span>{task.dealTitle || task.clientName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRestore(task.id)}
                          disabled={loading === task.id}
                        >
                          {loading === task.id ? 'Ripristino...' : 'Ripristina'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dismissed Tasks Section */}
        {dismissedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'dismissed' ? null : 'dismissed')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🗑️</span>
                <span className="font-semibold text-gray-900">Task Eliminati</span>
                <Badge variant="cold" size="sm">
                  {dismissedTasks.length}
                </Badge>
              </div>
              <span className="text-gray-600">
                {expandedSection === 'dismissed' ? '▼' : '▶'}
              </span>
            </button>

            {expandedSection === 'dismissed' && (
              <div className="mt-2 space-y-2">
                {dismissedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              task.priority === 'critical'
                                ? 'danger'
                                : task.priority === 'high'
                                ? 'warning'
                                : 'primary'
                            }
                            size="sm"
                          >
                            {task.priority}
                          </Badge>
                          {task.dismissedAt && (
                            <span className="text-xs text-gray-500">
                              Eliminato {formatTimestamp(task.dismissedAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1 line-through">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        {(task.dealTitle || task.clientName) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {task.dealId && '🎯'}
                              {task.clientId && !task.dealId && '👤'}
                            </span>
                            <span>{task.dealTitle || task.clientName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(task.id)}
                          disabled={loading === task.id}
                        >
                          {loading === task.id ? 'Ripristino...' : 'Ripristina'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
