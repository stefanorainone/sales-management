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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      className={`border-l-4 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 ${
        priorityColors[task.priority]
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-lg sm:text-xl flex-shrink-0">{typeIcons[task.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs flex-shrink-0">{priorityIcons[task.priority]}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 truncate">
                {task.priority === 'critical'
                  ? 'ALTA PRIORITÀ'
                  : task.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mt-1 break-words">{task.title}</h3>
          </div>
        </div>
      </div>

      {/* Time Estimate & Scheduled Date */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2 ml-6 sm:ml-7 flex-wrap">
        <span>⚡</span>
        <span className="font-medium text-green-600">
          Stima: {task.estimatedDuration || 15} min
        </span>
        <span className="text-gray-400">•</span>
        <span>📅 {new Date(task.scheduledAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
        <span className="text-gray-400">•</span>
        <span>{scheduledTime}</span>
      </div>

      {/* Client/Deal info */}
      {(task.clientName || task.dealTitle) && (
        <div className="ml-6 sm:ml-7 mb-2 sm:mb-3 space-y-1">
          {task.clientName && (
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-gray-500 flex-shrink-0">Contatto:</span>
              <span className="font-medium text-gray-900 break-words">{task.clientName}</span>
            </div>
          )}
          {task.dealTitle && (
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-gray-500 flex-shrink-0">Deal:</span>
              <span className="text-gray-700 break-words">{task.dealTitle}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Rationale */}
      <div className="ml-6 sm:ml-7 mb-2 sm:mb-3 p-2.5 sm:p-3 bg-white rounded border border-gray-200">
        <div className="flex items-start gap-2">
          <span className="text-xs sm:text-sm flex-shrink-0">🤖</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Perché questo task è importante:
            </p>
            <p className="text-xs sm:text-sm text-gray-700 break-words">{task.aiRationale}</p>
          </div>
        </div>
      </div>

      {/* Objectives preview */}
      {task.objectives && task.objectives.length > 0 && (
        <div className="ml-6 sm:ml-7 mb-2 sm:mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Obiettivi:</p>
          <ul className="space-y-1">
            {task.objectives.slice(0, 3).map((obj, i) => (
              <li key={i} className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
                <span className="flex-shrink-0">•</span>
                <span className="break-words">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="ml-6 sm:ml-7 flex gap-2 relative flex-wrap">
        <button
          onClick={() => setShowDetailsModal(true)}
          className="flex-shrink-0 px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-200 transition-colors border border-purple-300"
        >
          📋 Vedi Guida
        </button>
        <button
          onClick={() => onStart(task)}
          className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {task.type === 'email' ? 'Scrivi Email' : 'Inizia Task'}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Perché vuoi posticipare questo task?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              La motivazione aiuterà l'AI a proporti questo task al momento più opportuno
            </p>
            <textarea
              value={postponeReason}
              onChange={(e) => setPostponeReason(e.target.value)}
              placeholder="Es: Devo aspettare risposta del cliente, Ho altre priorità più urgenti, Non ho tutte le informazioni necessarie..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setPostponeReason('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmPostpone}
                className="flex-1 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{typeIcons[task.type]}</span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{task.title}</h2>
                </div>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="ml-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Guidelines Section */}
            {task.guidelines && task.guidelines.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📝</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Come Eseguire il Task
                  </h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ol className="space-y-2">
                    {task.guidelines.map((guideline, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="font-semibold text-blue-600 flex-shrink-0">
                          {guideline.match(/^\d+\./) ? '' : `${index + 1}.`}
                        </span>
                        <span>{guideline.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Best Practices Section */}
            {task.bestPractices && task.bestPractices.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">✨</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Consigli per il Successo
                  </h3>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {task.bestPractices.map((practice, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Common Mistakes Section */}
            {task.commonMistakes && task.commonMistakes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Errori da Evitare
                  </h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {task.commonMistakes.map((mistake, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-600 flex-shrink-0">✗</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Script Section */}
            {task.script && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💬</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Script Suggerito
                  </h3>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {task.script}
                  </pre>
                </div>
              </div>
            )}

            {/* Talking Points Section */}
            {task.talkingPoints && task.talkingPoints.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💡</span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Punti Chiave da Toccare
                  </h3>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {task.talkingPoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-yellow-600 flex-shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Chiudi
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  onStart(task);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Inizia Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
