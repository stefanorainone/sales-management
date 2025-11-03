'use client';

import { useState, useEffect } from 'react';
import { AITask } from '@/types';
import { uploadMultipleFiles, validateFile, formatFileSize } from '@/lib/utils/fileUpload';

interface CompletedTaskModalProps {
  task: AITask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<AITask>) => void;
}

export function CompletedTaskModal({ task, isOpen, onClose, onSave }: CompletedTaskModalProps) {
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<'success' | 'partial' | 'failed' | 'no_answer'>('success');
  const [actualDuration, setActualDuration] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
      setOutcome(task.outcome || 'success');
      setActualDuration(task.actualDuration?.toString() || '');
      setSelectedFiles([]);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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

  const handleSave = async () => {
    let newAttachments = [...(task.attachments || [])];

    // Upload new files if any
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      try {
        const basePath = `task-attachments/${task.userId}/${task.id}`;
        const uploadedUrls = await uploadMultipleFiles(selectedFiles, basePath, (progress) => {
          setUploadProgress(progress);
        });
        newAttachments = [...newAttachments, ...uploadedUrls];
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('❌ Errore durante il caricamento dei file. Riprova.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave(task.id, {
      notes,
      outcome,
      actualDuration: parseInt(actualDuration),
      attachments: newAttachments,
    });

    onClose();
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'no_answer':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return '✅ Successo';
      case 'partial':
        return '⚠️ Parziale';
      case 'failed':
        return '❌ Fallito';
      case 'no_answer':
        return '📵 Nessuna risposta';
      default:
        return outcome;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
            <p className="text-sm text-gray-600">{task.description}</p>
            {task.clientName && (
              <p className="text-sm text-gray-600 mt-1">
                Cliente: <span className="font-medium">{task.clientName}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Completato:</span>
              <span className="ml-2 font-medium text-gray-900">
                {task.completedAt
                  ? new Date(task.completedAt).toLocaleString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Durata stimata:</span>
              <span className="ml-2 font-medium text-gray-900">{task.estimatedDuration || 15} min</span>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4 mb-6">
          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Esito</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['success', 'partial', 'failed', 'no_answer'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOutcome(opt)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    outcome === opt
                      ? getOutcomeColor(opt)
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getOutcomeLabel(opt)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durata effettiva (minuti)</label>
            <input
              type="number"
              value={actualDuration}
              onChange={(e) => setActualDuration(e.target.value)}
              placeholder="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descrivi come è andata, punti chiave discussi, obiezioni, prossimi step..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={6}
            />
          </div>

          {/* Existing Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allegati esistenti</label>
              <div className="space-y-2">
                {task.attachments.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      📎 {url.split('/').pop()?.split('_').slice(1).join('_') || 'File'}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Scarica
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aggiungi nuovi allegati</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file-upload-edit"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload-edit" className="cursor-pointer">
                <div className="text-gray-600">
                  <span className="text-2xl mb-2 block">📎</span>
                  <span className="text-sm">Clicca per caricare file</span>
                  <p className="text-xs text-gray-500 mt-1">PDF, Word, Excel, Immagini (max 10MB)</p>
                </div>
              </label>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">File selezionati:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Caricamento in corso...</span>
                  <span className="text-xs font-medium text-primary">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        {task.aiAnalysis && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🤖 Analisi AI</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.aiAnalysis}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Caricamento...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
}
