'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDeals } from '@/lib/hooks/useDeals';
import { useActivities } from '@/lib/hooks/useActivities';
import type { AICoachMessage } from '@/types';

const QUICK_QUESTIONS = [
  'Come posso migliorare il mio conversion rate?',
  'Quali deal dovrei prioritizzare oggi?',
  'Come gestire obiezione sul prezzo?',
  'Strategie per chiudere deal più velocemente',
  'Come migliorare le mie demo?',
  'Cosa dire quando il cliente non risponde?',
];

export function AIChatWidget() {
  const { user } = useAuth();
  const { deals } = useDeals();
  const { activities } = useActivities();

  const [isOpen, setIsOpen] = useState(false);
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
• Consigli su prioritizzazione
• Tips per migliorare performance

Cosa posso fare per te?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

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
            recentActivities: activities.slice(0, 5),
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
        content: 'Mi dispiace, ho avuto un problema. Riprova tra poco.',
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
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform z-50 animate-pulse"
          title="AI Coach"
        >
          🤖
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold">AI Sales Coach</h3>
                <p className="text-xs text-white/80">Sempre disponibile</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
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
                    <span className="text-xs text-gray-500">AI sta pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (shown only at start) */}
          {messages.length <= 2 && !isLoading && (
            <div className="p-3 bg-white border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Domande frequenti:
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {QUICK_QUESTIONS.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left text-xs px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-800"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi qui..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
