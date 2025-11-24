'use client';

import { Card, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { Relationship } from '@/lib/hooks/useRelationships';

interface TaskSuggestion {
  id: string;
  relazione: string;
  relazioneId: string;
  task: string;
  motivo: string;
}

interface ProspectSuggestion {
  id: string;
  nome: string;
  ruolo: string;
  azienda: string;
  settore: string;
  motivo: string;
  fonte: string; // Link alla news/fonte
}

interface AIRelationshipSuggestionsProps {
  relationships: Relationship[];
  onTaskClick?: (relationshipId: string) => void;
}

export function AIRelationshipSuggestions({ relationships, onTaskClick }: AIRelationshipSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{ existingRelations: TaskSuggestion[], newProspects: ProspectSuggestion[] }>({
    existingRelations: [],
    newProspects: []
  });
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const generateSuggestions = async () => {
    if (relationships.length === 0) return;

    setLoading(true);

    try {
      // Prepara i dati delle relazioni per l'AI
      const relationsData = relationships.map(r => ({
        id: r.id,
        name: r.name,
        company: r.company,
        role: r.role,
        strength: r.strength,
        importance: r.importance,
        category: r.category,
        valueBalance: r.valueBalance,
        lastContact: r.lastContact,
        nextAction: r.nextAction,
        actionsHistory: r.actionsHistory?.length || 0,
        noteCount: r.noteCount
      }));

      const response = await fetch('/api/ai/relationship-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationships: relationsData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();

      // Check if AI returned valid suggestions
      if (data.suggestions &&
          (data.suggestions.existingRelations?.length > 0 || data.suggestions.newProspects?.length > 0)) {
        setSuggestions(data.suggestions);
      } else {
        // AI returned empty suggestions
        console.log('AI returned empty suggestions');
        setSuggestions({ existingRelations: [], newProspects: [] });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions({ existingRelations: [], newProspects: [] });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (relationships.length > 0) {
      generateSuggestions();
    }
  }, [relationships.length]);

  // Show widget even if no relationships exist
  if (relationships.length === 0) {
    return (
      <Card padding={false} className="w-full bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 sm:border-2 p-3 sm:p-4 lg:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl">🤖</span>
              <span className="leading-tight">Suggerimenti AI</span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
              Task intelligenti per le tue relazioni
            </p>
          </div>
        </div>
        <div className="text-center py-6 sm:py-8">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🤝</div>
          <p className="text-xs sm:text-sm text-gray-600">
            Aggiungi relazioni per ricevere suggerimenti AI!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={false} className="w-full bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 sm:border-2 p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl">🤖</span>
            <span className="leading-tight">Suggerimenti AI</span>
          </h3>
          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
            Task intelligenti per le tue relazioni
          </p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 text-lg sm:text-xl flex-shrink-0"
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm text-gray-600">Generazione suggerimenti...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Rafforza Relazioni Esistenti */}
              {suggestions.existingRelations.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                    <span className="text-sm sm:text-base">🤝</span>
                    <span>Rafforza Relazioni Esistenti</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{suggestions.existingRelations.length}</span>
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {suggestions.existingRelations.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => task.relazioneId !== 'general' && onTaskClick?.(task.relazioneId)}
                        className={`w-full overflow-hidden bg-white border border-purple-200 sm:border-2 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow ${task.relazioneId !== 'general' ? 'cursor-pointer hover:border-purple-400' : ''}`}
                      >
                        <div className="flex flex-col gap-1.5 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight break-words">{task.task}</div>
                            <div className="text-xs text-gray-500 mt-0.5 break-words">Per: {task.relazione}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 p-1.5 sm:p-2 rounded leading-snug break-words">
                          <span className="font-semibold">Motivo:</span> {task.motivo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Persone che dovresti conoscere */}
              {suggestions.newProspects.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                    <span className="text-sm sm:text-base">🎯</span>
                    <span>Persone che dovresti conoscere</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{suggestions.newProspects.length}</span>
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {suggestions.newProspects.map((prospect) => (
                      <div
                        key={prospect.id}
                        className="w-full overflow-hidden bg-white border border-blue-200 sm:border-2 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col gap-1.5 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight break-words">{prospect.nome}</div>
                            <div className="text-xs text-gray-600 mt-0.5 break-words">
                              {prospect.ruolo} @ {prospect.azienda}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Settore: {prospect.settore}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 p-1.5 sm:p-2 rounded leading-snug break-words mb-1.5">
                          <span className="font-semibold">Perché contattare:</span> {prospect.motivo}
                        </div>
                        <a
                          href={prospect.fonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          📰 Fonte
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 sm:pt-3 border-t flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={loading}
                  className="text-xs py-1 sm:py-1.5"
                >
                  🔄 Rigenera
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
