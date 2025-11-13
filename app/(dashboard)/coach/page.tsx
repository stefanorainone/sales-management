'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDeals } from '@/lib/hooks/useDeals';
import type { AICoachMessage } from '@/types';

const QUICK_QUESTIONS = [
  'Come posso migliorare il mio conversion rate?',
  'Quali deal dovrei prioritizzare oggi?',
  'Come gestire obiezione sul prezzo?',
  'Strategie per chiudere deal più velocemente',
  'Come migliorare le mie demo?',
  'Cosa dire quando il cliente non risponde?',
];

export default function CoachPage() {
  const { user } = useAuth();
  const { deals } = useDeals();

  const [messages, setMessages] = useState<AICoachMessage[]>([
    {
      id: '1',
      userId: user?.id || '',
      role: 'assistant',
      content: `Ciao ${user?.displayName || 'Venditore'}! 👋

Sono il tuo AI Sales Coach, sempre pronto ad aiutarti.

Posso aiutarti con:
• Strategie per chiudere deal
• Gestione obiezioni
• Preparazione demo e chiamate
• Analisi del tuo pipeline
• Consigli su prioritizzazione task
• Tips per migliorare performance

Cosa posso fare per te oggi?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: AICoachMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.displayName || 'Venditore',
          question: messageText,
          context: {
            activePipeline: deals.slice(0, 5),
            recentActivities: [],
          },
        }),
      });

      const data = await response.json();

      // Add AI response
      const aiMessage: AICoachMessage = {
        id: (Date.now() + 1).toString(),
        userId: user?.id || '',
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting coach response:', error);

      const errorMessage: AICoachMessage = {
        id: (Date.now() + 1).toString(),
        userId: user?.id || '',
        role: 'assistant',
        content:
          'Mi dispiace, ho avuto un problema nel rispondere. Riprova tra poco.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Sales Coach</h1>
            <p className="text-sm text-gray-600">
              Il tuo assistente personale sempre disponibile
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-2xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">AI sta pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions (shown only at start) */}
      {messages.length <= 2 && !isLoading && (
        <div className="p-4 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Domande frequenti:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((question, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(question)}
                className="text-left text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi la tua domanda... (Invio per inviare, Shift+Invio per nuova riga)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Invia
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Fai domande specifiche per ricevere consigli più utili
        </p>
      </div>
    </div>
  );
}
