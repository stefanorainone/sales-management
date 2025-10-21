'use client';

import { useState, useEffect } from 'react';
import { AITask } from '@/types';
import { Modal } from '../ui/Modal';

interface TaskExecutionModalProps {
  task: AITask | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, notes: string, outcome: string) => void;
}

export function TaskExecutionModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: TaskExecutionModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<'success' | 'partial' | 'failed' | 'no_answer'>('success');
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (isOpen) {
      setElapsedTime(0);
      setIsTimerRunning(false);
      setNotes('');
      setOutcome('success');
      setShowScript(false);
    }
  }, [isOpen]);

  if (!task) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    if (!task) return;
    onComplete(task.id, notes, outcome);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="lg">
      <div className="space-y-4">
        {/* Task Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">👤 {task.clientName}</h4>
              {task.dealTitle && (
                <p className="text-sm text-gray-600 mt-1">{task.dealTitle}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-500">
                Tempo trascorso
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              isTimerRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTimerRunning ? '⏸️ Pausa Timer' : '▶️ Avvia Timer'}
          </button>
        </div>

        {/* Objectives */}
        {task.objectives && task.objectives.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Obiettivi Task</h4>
            <ul className="space-y-2">
              {task.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Script/Email */}
        {(task.script || task.emailDraft || task.demoScript) && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowScript(!showScript)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">
                📋 {task.type === 'email' ? 'Bozza Email' : task.type === 'demo' ? 'Script Demo' : 'Script Chiamata'}
              </span>
              <span className="text-gray-400">{showScript ? '▼' : '▶'}</span>
            </button>
            {showScript && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {task.emailDraft || task.demoScript || task.script}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Talking Points */}
        {task.talkingPoints && task.talkingPoints.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Punti Chiave</h4>
            <ul className="space-y-1">
              {task.talkingPoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Context */}
        {task.clientContext && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📝 Contesto Cliente</h4>
            <p className="text-sm text-gray-700">{task.clientContext}</p>
          </div>
        )}

        {/* Completion Form */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Come è andata?</h4>

          {/* Outcome */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOutcome('success')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                outcome === 'success'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">😊</div>
              <div className="text-sm font-medium">Ottima</div>
            </button>
            <button
              onClick={() => setOutcome('partial')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                outcome === 'partial'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">😐</div>
              <div className="text-sm font-medium">OK</div>
            </button>
            <button
              onClick={() => setOutcome('failed')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                outcome === 'failed'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">😞</div>
              <div className="text-sm font-medium">Male</div>
            </button>
            <button
              onClick={() => setOutcome('no_answer')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                outcome === 'no_answer'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">📵</div>
              <div className="text-sm font-medium">Non risposto</div>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note rapide (l'AI le analizzerà)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es: Budget confermato €4k, vogliono demo venerdì, molto interessati..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✓ Completa Task
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
