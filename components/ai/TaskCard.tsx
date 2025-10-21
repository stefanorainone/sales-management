'use client';

import { useState } from 'react';
import { AITask } from '@/types';

interface TaskCardProps {
  task: AITask;
  onStart: (task: AITask) => void;
  onSkip: (taskId: string) => void;
  onSnooze?: (taskId: string, snoozeUntil: string, reason: string) => void;
}

const priorityColors = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-gray-300 bg-gray-50',
};

const priorityIcons = {
  critical: '🔴',
  high: '🟡',
  medium: '🟢',
  low: '⚪',
};

const typeIcons = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  demo: '🎯',
  follow_up: '🔄',
  research: '🔍',
  admin: '📋',
};

export function TaskCard({ task, onStart, onSkip, onSnooze }: TaskCardProps) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [selectedSnoozeDate, setSelectedSnoozeDate] = useState<string>('');

  const scheduledTime = new Date(task.scheduledAt).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const openReasonModal = (snoozeUntil: string) => {
    setSelectedSnoozeDate(snoozeUntil);
    setShowSnoozeMenu(false);
    setShowReasonModal(true);
  };

  const confirmPostpone = () => {
    if (!postponeReason.trim()) {
      alert('Per favore inserisci una motivazione per posticipare il task');
      return;
    }

    if (onSnooze) {
      onSnooze(task.id, selectedSnoozeDate, postponeReason);
    } else {
      onSkip(task.id);
    }
    setShowReasonModal(false);
    setPostponeReason('');
  };

  const handleSnooze = (hours: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    openReasonModal(snoozeUntil.toISOString());
  };

  const handleSnoozeTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
    openReasonModal(tomorrow.toISOString());
  };

  const handleSnoozeNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0); // 9 AM next week
    openReasonModal(nextWeek.toISOString());
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 ${
        priorityColors[task.priority]
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-xl">{typeIcons[task.type]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs">{priorityIcons[task.priority]}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {task.priority === 'critical'
                  ? 'ALTA PRIORITÀ'
                  : task.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mt-1">{task.title}</h3>
          </div>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 ml-7">
        <span>⏰</span>
        <span>{scheduledTime}</span>
      </div>

      {/* Client/Deal info */}
      {(task.clientName || task.dealTitle) && (
        <div className="ml-7 mb-3 space-y-1">
          {task.clientName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Contatto:</span>
              <span className="font-medium text-gray-900">{task.clientName}</span>
            </div>
          )}
          {task.dealTitle && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Deal:</span>
              <span className="text-gray-700">{task.dealTitle}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Rationale */}
      <div className="ml-7 mb-3 p-3 bg-white rounded border border-gray-200">
        <div className="flex items-start gap-2">
          <span className="text-sm">🤖</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Perché questo task è importante:
            </p>
            <p className="text-sm text-gray-700">{task.aiRationale}</p>
          </div>
        </div>
      </div>

      {/* Objectives preview */}
      {task.objectives && task.objectives.length > 0 && (
        <div className="ml-7 mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Obiettivi:</p>
          <ul className="space-y-1">
            {task.objectives.slice(0, 3).map((obj, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span>•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence & Impact */}
      <div className="ml-7 mb-3 flex gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Probabilità successo:</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${task.confidence}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {task.confidence}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Impatto:</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${task.impactScore}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {task.impactScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-7 flex gap-2 relative">
        <button
          onClick={() => onStart(task)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {task.type === 'email' ? 'Scrivi Email' : 'Inizia Task'}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Posticipa
          </button>
          {showSnoozeMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSnoozeMenu(false)}
              />
              {/* Dropdown menu */}
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[180px]">
                <button
                  onClick={() => handleSnooze(2)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ⏰ Tra 2 ore
                </button>
                <button
                  onClick={() => handleSnooze(4)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ⏰ Tra 4 ore
                </button>
                <button
                  onClick={handleSnoozeTomorrow}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📅 Domani mattina
                </button>
                <button
                  onClick={handleSnoozeNextWeek}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📅 Settimana prossima
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Postpone Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Perché vuoi posticipare questo task?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              La motivazione aiuterà l'AI a proporti questo task al momento più opportuno
            </p>
            <textarea
              value={postponeReason}
              onChange={(e) => setPostponeReason(e.target.value)}
              placeholder="Es: Devo aspettare risposta del cliente, Ho altre priorità più urgenti, Non ho tutte le informazioni necessarie..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setPostponeReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmPostpone}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Conferma Posticipo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
