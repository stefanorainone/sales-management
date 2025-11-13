'use client';

import { Card, Button, Input } from '@/components/ui';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600">Solo gli amministratori possono accedere a questa pagina</p>
        </div>
      </div>
    );
  }

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/ai-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error asking AI:', error);
      showToast('❌ Errore nella richiesta AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Chi è il venditore che sta lavorando meglio?',
    'Quali venditori hanno più relazioni strong?',
    'Chi ha il miglior value balance nelle relazioni?',
    'Analizza chi non sta seguendo bene le relazioni',
    'Confronta le performance dei venditori',
    'Chi ha più relazioni critical?',
    'Quali venditori stanno dando più valore alle loro relazioni?',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          🤖 AI Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Fai domande all'AI per analizzare le performance dei venditori e le loro relazioni
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Come funziona</h3>
            <p className="text-sm text-gray-700 mb-2">
              L'AI ha accesso completo a tutti i dati del sistema:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Tutte le relazioni di tutti i venditori (strength, importance, value balance)</li>
              <li>Storico azioni completate e note</li>
              <li>Task assegnati e completati</li>
              <li>Deals e loro valore</li>
              <li>Attività svolte</li>
            </ul>
            <p className="text-sm text-gray-700 mt-2">
              Fai domande in linguaggio naturale e ricevi analisi dettagliate!
            </p>
          </div>
        </div>
      </Card>

      {/* Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggested Questions */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-bold text-gray-900 mb-4">💬 Domande Suggerite</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-lg font-semibold mb-2">Inizia una conversazione</p>
                    <p className="text-sm">
                      Fai una domanda o seleziona una delle domande suggerite
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-gray-600 text-sm">Sto analizzando i dati...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !loading) {
                        e.preventDefault();
                        askQuestion();
                      }
                    }}
                    placeholder="Fai una domanda... (Es: Chi è il venditore con più relazioni strong?)"
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button
                    onClick={askQuestion}
                    disabled={!question.trim() || loading}
                  >
                    {loading ? '⏳' : '📤'} Invia
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Premi Invio per inviare • L'AI analizzerà tutti i dati in tempo reale
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Preview */}
      {messages.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-2">📊 Analisi Completate</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-2xl font-bold text-primary">{messages.filter(m => m.role === 'user').length}</div>
                <div className="text-sm text-gray-600">Domande Poste</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{messages.filter(m => m.role === 'assistant').length}</div>
                <div className="text-sm text-gray-600">Risposte AI</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {messages.reduce((sum, m) => sum + m.content.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Caratteri Analizzati</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
