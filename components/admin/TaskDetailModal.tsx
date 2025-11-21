'use client';

import { Modal } from '../ui/Modal';
import { Badge } from '../ui';
import { AITask } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface TaskDetailModalProps {
  task: AITask | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'success': return 'success';
      case 'partial': return 'warning';
      case 'failed': return 'danger';
      case 'no_answer': return 'gray';
      default: return 'gray';
    }
  };

  const getOutcomeLabel = (outcome?: string) => {
    switch (outcome) {
      case 'success': return '✅ Successo';
      case 'partial': return '⚠️ Parziale';
      case 'failed': return '❌ Fallito';
      case 'no_answer': return '📵 Nessuna Risposta';
      default: return '❓ Sconosciuto';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴 Critico';
      case 'high': return '🟠 Alta';
      case 'medium': return '🟡 Media';
      case 'low': return '🟢 Bassa';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: '📞 Chiamata',
      email: '📧 Email',
      meeting: '🤝 Meeting',
      demo: '🎯 Demo',
      follow_up: '🔄 Follow-up',
      research: '🔍 Ricerca',
      admin: '📋 Amministrativo',
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: it });
    } catch {
      return timestamp;
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return '🖼️';
    if (['pdf'].includes(extension || '')) return '📄';
    if (['doc', 'docx'].includes(extension || '')) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) return '📊';
    if (['zip', 'rar'].includes(extension || '')) return '📦';
    return '📎';
  };

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-start gap-3">
          <div className="text-3xl">📋</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 break-words">
              {task.title}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={getPriorityColor(task.priority) as any} size="sm">
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge variant="primary" size="sm">
                {getTypeLabel(task.type)}
              </Badge>
              {task.outcome && (
                <Badge variant={getOutcomeColor(task.outcome) as any} size="sm">
                  {getOutcomeLabel(task.outcome)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Task Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">📅 Completato:</span>
              <div className="text-gray-900 mt-1">
                {formatTimestamp(task.completedAt)}
                {task.completedAt && (
                  <div className="text-xs text-gray-500">
                    {new Date(task.completedAt).toLocaleString('it-IT')}
                  </div>
                )}
              </div>
            </div>
            {task.actualDuration && (
              <div>
                <span className="font-medium text-gray-700">⏱️ Durata:</span>
                <div className="text-gray-900 mt-1">
                  {task.actualDuration} minuti
                  {task.estimatedDuration && (
                    <span className="text-xs text-gray-500 ml-2">
                      (stimati: {task.estimatedDuration} min)
                    </span>
                  )}
                </div>
              </div>
            )}
            {task.clientName && (
              <div>
                <span className="font-medium text-gray-700">👤 Cliente:</span>
                <div className="text-gray-900 mt-1">{task.clientName}</div>
              </div>
            )}
            {task.dealTitle && (
              <div>
                <span className="font-medium text-gray-700">💼 Deal:</span>
                <div className="text-gray-900 mt-1">{task.dealTitle}</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📝 Descrizione</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {task.description}
            </p>
          </div>
        )}

        {/* AI Rationale */}
        {task.aiRationale && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🤖 Razionale AI</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg border border-blue-200">
              {task.aiRationale}
            </p>
          </div>
        )}

        {/* Results - MOST IMPORTANT */}
        {task.results && (
          <div className="border-2 border-green-200 rounded-lg bg-green-50 p-4">
            <h3 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Risultati Ottenuti
            </h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {task.results}
            </p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">💬 Note del Venditore</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              {task.notes}
            </p>
          </div>
        )}

        {/* Additional Notes */}
        {task.additionalNotes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📌 Note Aggiuntive</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {task.additionalNotes}
            </p>
          </div>
        )}

        {/* AI Analysis */}
        {task.aiAnalysis && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🔍 Analisi AI</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 p-3 rounded-lg border border-purple-200">
              {task.aiAnalysis}
            </p>
          </div>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              📎 File Caricati ({task.attachments.length})
            </h3>
            <div className="space-y-3">
              {task.attachments.map((url, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getFileIcon(url)}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        File {index + 1}: {url.split('/').pop()?.split('?')[0] || 'Download'}
                      </a>
                    </div>
                  </div>

                  {/* Preview for images */}
                  {isImageFile(url) && (
                    <div className="mt-2">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="max-w-full h-auto rounded border border-gray-300"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objectives */}
        {task.objectives && task.objectives.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🎯 Obiettivi</h3>
            <ul className="space-y-2 bg-gray-50 p-3 rounded-lg">
              {task.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Script/Talking Points */}
        {task.script && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📄 Script</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg font-mono text-xs">
              {task.script}
            </p>
          </div>
        )}

        {task.talkingPoints && task.talkingPoints.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Punti Chiave</h3>
            <ul className="space-y-1 bg-gray-50 p-3 rounded-lg">
              {task.talkingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Context */}
        {(task.clientContext || task.dealContext) && (
          <div className="space-y-3">
            {task.clientContext && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">👤 Contesto Cliente</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {task.clientContext}
                </p>
              </div>
            )}
            {task.dealContext && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">💼 Contesto Deal</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {task.dealContext}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Expected Output Format */}
        {task.expectedOutputFormat && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Formato Output Richiesto
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-900">Tipo:</span>
                <span className="ml-2 text-blue-700">{task.expectedOutputFormat.type}</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Descrizione:</span>
                <p className="text-blue-700 mt-1 whitespace-pre-wrap">
                  {task.expectedOutputFormat.description}
                </p>
              </div>
              {task.expectedOutputFormat.example && (
                <div>
                  <span className="font-medium text-blue-900">Esempio:</span>
                  <p className="text-blue-700 mt-1 whitespace-pre-wrap font-mono text-xs">
                    {task.expectedOutputFormat.example}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guidelines */}
        {task.guidelines && task.guidelines.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📚 Linee Guida</h3>
            <ol className="space-y-2 bg-gray-50 p-3 rounded-lg">
              {task.guidelines.map((guideline, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="font-semibold text-blue-600 min-w-[20px]">{i + 1}.</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Best Practices */}
        {task.bestPractices && task.bestPractices.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">✨ Best Practices</h3>
            <ul className="space-y-2 bg-green-50 p-3 rounded-lg">
              {task.bestPractices.map((practice, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {task.commonMistakes && task.commonMistakes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Errori Comuni da Evitare</h3>
            <ul className="space-y-2 bg-red-50 p-3 rounded-lg">
              {task.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
