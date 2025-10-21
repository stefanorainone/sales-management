'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { AICoachSession, AICoachMessage } from '@/types';

interface ChatViewerProps {
  sessions: AICoachSession[];
  sellerName: string;
  onIntervene: (sessionId: string, message: string) => Promise<void>;
}

export function ChatViewer({ sessions, sellerName, onIntervene }: ChatViewerProps) {
  const [selectedSession, setSelectedSession] = useState<AICoachSession | null>(null);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleIntervene = async () => {
    if (!selectedSession || !interventionMessage.trim()) return;

    setLoading(true);
    try {
      await onIntervene(selectedSession.id, interventionMessage);
      setInterventionMessage('');
      setShowInterventionForm(false);
    } catch (error) {
      console.error('Error intervening in chat:', error);
    } finally {
      setLoading(false);
    }
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
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm italic">
        Nessuna conversazione con l'AI Coach
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sessions List */}
      {!selectedSession && (
        <div className="space-y-2">
          {sessions.map((session) => {
            const lastMessage = session.messages[session.messages.length - 1];
            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {session.topic ? `💬 ${session.topic}` : '💬 Conversazione'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.messages.length} messaggi
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {lastMessage.content.slice(0, 100)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(session.lastMessageAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Session Detail */}
      {selectedSession && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelectedSession(null)}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              ← Torna alle conversazioni
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInterventionForm(!showInterventionForm)}
            >
              {showInterventionForm ? 'Annulla' : '💬 Intervieni'}
            </Button>
          </div>

          {/* Intervention Form */}
          {showInterventionForm && (
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Intervento Admin - Messaggio per {sellerName}
                </p>
                <textarea
                  value={interventionMessage}
                  onChange={(e) => setInterventionMessage(e.target.value)}
                  placeholder="Scrivi un messaggio per aiutare il venditore con questa conversazione..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleIntervene}
                    disabled={loading || !interventionMessage.trim()}
                  >
                    {loading ? 'Invio...' : 'Invia Messaggio'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowInterventionForm(false)}
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Messages */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : message.content.startsWith('📢 **Messaggio dall\'Admin:**')
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.role === 'user' ? sellerName : 'AI Coach'}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Session Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
            Conversazione iniziata {formatTimestamp(selectedSession.startedAt)} •{' '}
            {selectedSession.topic && `Topic: ${selectedSession.topic}`}
          </div>
        </div>
      )}
    </div>
  );
}
