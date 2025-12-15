'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { auth } from '@/lib/firebase/config';
import type { AITaskType } from '@/types';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const QUICK_TASK_TYPES: { value: AITaskType; label: string; icon: string }[] = [
  { value: 'call', label: 'Chiamata', icon: '📞' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'admin', label: 'Altro', icon: '📋' },
];

export function QuickTaskModal({ isOpen, onClose, onTaskCreated }: QuickTaskModalProps) {
  const { showToast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<AITaskType>('call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setType('call');
      const today = new Date().toISOString().split('T')[0];
      setScheduledDate(today);
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setScheduledTime(now.toTimeString().slice(0, 5));
      setNotes('');
      setIsSubmitting(false);

      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Inserisci un titolo per il task', 'error');
      titleInputRef.current?.focus();
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      showToast('Inserisci data e ora', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        showToast('Sessione scaduta, ricarica la pagina', 'error');
        return;
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const response = await fetch('/api/seller/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          type,
          scheduledAt,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione del task');
      }

      showToast('Task creato con successo!', 'success');
      onTaskCreated();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nella creazione del task';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Bottom sheet su mobile */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full sm:mx-4">
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle per mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Nuovo Task
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titolo <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Chiamare Mario Rossi"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                         focus:ring-2 focus:ring-primary focus:border-transparent
                         text-base"
                disabled={isSubmitting}
              />
            </div>

            {/* Tipo Task */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_TASK_TYPES.map((taskType) => (
                  <button
                    key={taskType.value}
                    type="button"
                    onClick={() => setType(taskType.value)}
                    disabled={isSubmitting}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                      ${type === taskType.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }
                      disabled:opacity-50
                    `}
                  >
                    <span className="text-2xl mb-1">{taskType.icon}</span>
                    <span className="text-xs font-medium">{taskType.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data e Ora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900
                           focus:ring-2 focus:ring-primary focus:border-transparent
                           text-base"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ora
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900
                           focus:ring-2 focus:ring-primary focus:border-transparent
                           text-base"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note <span className="text-gray-400 font-normal">(opzionale)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi dettagli..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 resize-none
                         focus:ring-2 focus:ring-primary focus:border-transparent
                         text-base"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl
                       hover:bg-primary/90 active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creazione...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crea Task
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
