'use client';

import { useState, useEffect } from 'react';
import { AITask } from '@/types';
import { Modal } from '../ui/Modal';
import { uploadMultipleFiles, validateFile, formatFileSize } from '@/lib/utils/fileUpload';
import { auth } from '@/lib/firebase/config';
import { logActivityClient } from '@/lib/utils/activity-logger-client';

// Inline editable objectives component
function ObjectivesList({ objectives, taskId }: { objectives: string[], taskId: string }) {
  const [items, setItems] = useState<string[]>(objectives);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSave = async (index: number) => {
    if (!editValue.trim()) return;

    setSaving(true);
    const newItems = [...items];
    newItems[index] = editValue.trim();

    try {
      // Update in Firebase
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objectives: newItems }),
      });

      if (!response.ok) throw new Error('Failed to update objectives');

      setItems(newItems);
      setEditingIndex(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating objectives:', error);
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(index);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <ul className="space-y-2">
      {items.map((obj, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-green-600 mt-0.5">✓</span>
          {editingIndex === i ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onBlur={() => handleSave(i)}
                disabled={saving}
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <span
              onClick={() => handleStartEdit(i)}
              className="text-sm text-gray-700 flex-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              title="Clicca per modificare"
            >
              {obj}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface TaskExecutionModalProps {
  task: AITask | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, notes: string, outcome: string, actualDuration: number, attachments?: string[]) => void;
}

export function TaskExecutionModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: TaskExecutionModalProps) {
  const [results, setResults] = useState(''); // Risultati ottenuti - OBBLIGATORIO
  const [additionalNotes, setAdditionalNotes] = useState(''); // Note aggiuntive - opzionale
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<'success' | 'partial' | 'failed' | 'no_answer'>('success');
  const [showScript, setShowScript] = useState(false);
  const [actualDuration, setActualDuration] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResults('');
      setAdditionalNotes('');
      setNotes('');
      setOutcome('success');
      setShowScript(false);
      setActualDuration('');
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!task) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file, {
        maxSizeMB: 10,
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/*',
          'text/plain',
        ],
      });

      if (!validation.valid) {
        alert(`❌ ${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!task) return;

    // Validazione: risultati ottenuti obbligatori
    if (!results.trim()) {
      alert('⚠️ Per favore descrivi i risultati ottenuti prima di completare il task!');
      return;
    }

    // Validazione: tempo effettivo obbligatorio
    if (!actualDuration.trim() || isNaN(parseInt(actualDuration)) || parseInt(actualDuration) <= 0) {
      alert('⚠️ Per favore inserisci il tempo effettivo impiegato (in minuti)!');
      return;
    }

    try {
      setIsUploading(true);
      let attachmentUrls: string[] = [];

      // Upload files only if there are files selected
      if (selectedFiles.length > 0) {
        const basePath = `task-attachments/${task.userId}/${task.id}`;

        try {
          attachmentUrls = await uploadMultipleFiles(selectedFiles, basePath, (progress) => {
            setUploadProgress(progress);
          });
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          // Se l'upload fallisce, chiedi conferma all'utente
          const confirmWithoutFiles = confirm(
            '❌ Errore durante il caricamento dei file.\n\n' +
            'Possibile causa: Firebase Storage non configurato.\n\n' +
            'Vuoi completare il task SENZA i file allegati?\n\n' +
            '(Potrai ricaricarli più tardi quando Firebase Storage sarà configurato)'
          );

          if (!confirmWithoutFiles) {
            setIsUploading(false);
            return;
          }
          // Procedi senza file
          attachmentUrls = [];
        }
      }

      // Pass results as notes for API compatibility
      const combinedNotes = results + (additionalNotes ? `\n\nNote aggiuntive:\n${additionalNotes}` : '');

      // Log activity before completing task
      try {
        await logActivityClient({
          action: 'task_completed',
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
          details: {
            outcome,
            actualDuration: parseInt(actualDuration),
            estimatedDuration: task.estimatedDuration,
            hasAttachments: attachmentUrls.length > 0,
            clientName: task.clientName,
            dealTitle: task.dealTitle,
          },
        });
      } catch (logError) {
        console.error('Error logging task completion:', logError);
        // Don't block task completion if logging fails
      }

      onComplete(task.id, combinedNotes, outcome, parseInt(actualDuration), attachmentUrls);
      onClose();
      setIsUploading(false);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('❌ Errore durante il completamento del task. Riprova.');
      setIsUploading(false);
    }
  };

  const estimatedMinutes = task.estimatedDuration || 15;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="lg">
      <div className="space-y-4">
        {/* Task Info with Time Estimate */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">👤 {task.clientName || 'Task generale'}</h4>
              {task.dealTitle && (
                <p className="text-sm text-gray-600 mt-1">{task.dealTitle}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                ⚡ {estimatedMinutes} min
              </div>
              <div className="text-xs text-gray-600 font-medium">
                Tempo stimato
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded p-2 text-center">
            <p className="text-xs text-gray-600">
              💪 <strong>Sfida:</strong> Completa in meno di {estimatedMinutes} minuti!
            </p>
          </div>
        </div>

        {/* Objectives - Editable Inline */}
        {task.objectives && task.objectives.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Obiettivi Task</h4>
            <ObjectivesList
              objectives={task.objectives}
              taskId={task.id}
            />
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

        {/* Expected Output Format - Informativo (non più obbligatorio) */}
        {task.expectedOutputFormat && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">
                  📝 Formato Output Suggerito
                </h4>
                <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded mb-2">
                  {task.expectedOutputFormat.type === 'text' && '📝 Testo Descrittivo'}
                  {task.expectedOutputFormat.type === 'structured_data' && '📊 Dati Strutturati'}
                  {task.expectedOutputFormat.type === 'google_sheet' && '📈 Google Sheet'}
                  {task.expectedOutputFormat.type === 'document' && '📄 Documento'}
                  {task.expectedOutputFormat.type === 'mixed' && '🔀 Formato Misto'}
                </div>
                <p className="text-sm text-blue-900">
                  {task.expectedOutputFormat.description}
                </p>
                {task.expectedOutputFormat.fields && task.expectedOutputFormat.fields.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-blue-700 mb-1">Campi suggeriti:</p>
                    <div className="flex flex-wrap gap-1">
                      {task.expectedOutputFormat.fields.map((field, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-blue-700 text-xs rounded border border-blue-200">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {task.expectedOutputFormat.example && (
                  <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">📌 Esempio:</p>
                    <p className="text-xs text-gray-700 italic">{task.expectedOutputFormat.example}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion Form */}
        <div className="border-t-2 border-gray-300 pt-4 space-y-4">
          <h4 className="font-semibold text-gray-900 text-lg">✅ Completa il Task</h4>

          {/* Actual Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⏱️ Quanto tempo ci hai messo? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                placeholder={estimatedMinutes.toString()}
                min="1"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-center text-gray-900"
              />
              <span className="text-gray-600 font-medium">minuti</span>
              {actualDuration && parseInt(actualDuration) <= estimatedMinutes && (
                <span className="text-green-600 font-medium">🎉 Ottimo!</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Stima: {estimatedMinutes} min • Inserisci il tempo reale impiegato
            </p>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Com'è andata?
            </label>
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
          </div>

          {/* Results - OBBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ✅ Risultati ottenuti <span className="text-red-500">*</span>
            </label>
            <textarea
              value={results}
              onChange={(e) => setResults(e.target.value)}
              placeholder="OBBLIGATORIO: Descrivi i risultati concreti ottenuti da questo task.

Esempio: Budget confermato €4k, vogliono demo venerdì prossimo, molto interessati al prodotto. DSGA deve ancora dare approvazione finale."
              className="w-full h-32 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
              required
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Descrivi accordi presi, informazioni raccolte, feedback ricevuti, prossimi passi
            </p>
          </div>

          {/* File Upload - OPZIONALE */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📎 Allega file o documento <span className="text-gray-500 font-normal">(opzionale)</span>
            </label>
            <div className="space-y-3">
              {/* File Input */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <span className="text-3xl mb-2">📎</span>
                  <span className="text-sm font-medium text-gray-700">
                    Clicca per caricare file
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, Word, Excel, Immagini, Testo (max 10MB)
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt"
                  />
                </label>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    ✅ File selezionati ({selectedFiles.length}):
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      {!isUploading && (
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-700 px-2 py-1 font-bold text-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2 bg-white p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      ⏳ Caricamento in corso...
                    </span>
                    <span className="text-blue-600 font-bold text-lg">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes - OPZIONALE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Commenti / Note aggiuntive <span className="text-gray-500 font-normal">(opzionale)</span>
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Aggiungi eventuali commenti, osservazioni o note aggiuntive su questo task..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
              disabled={isUploading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleComplete}
              disabled={isUploading}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Caricamento file...
                </span>
              ) : (
                '✓ Completa Task'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
