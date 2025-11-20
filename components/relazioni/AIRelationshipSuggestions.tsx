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
  priorita: 'alta' | 'media' | 'bassa';
}

interface AIRelationshipSuggestionsProps {
  relationships: Relationship[];
}

export function AIRelationshipSuggestions({ relationships }: AIRelationshipSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{ main: TaskSuggestion[], bonus: TaskSuggestion[] }>({ main: [], bonus: [] });
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
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to manual suggestions if AI fails
      generateManualSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const generateManualSuggestions = () => {
    const main: TaskSuggestion[] = [];
    const bonus: TaskSuggestion[] = [];

    // Task prioritari
    relationships.forEach((rel, idx) => {
      if (main.length < 3) {
        // Contatto non recente
        const lastContactDate = new Date(rel.lastContact);
        const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceContact > 30 && rel.importance === 'critical') {
          main.push({
            id: `main-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Contattare ${rel.name} per un follow-up`,
            motivo: `Relazione critica non contattata da ${daysSinceContact} giorni. Rischio di perdere il contatto.`,
            priorita: 'alta'
          });
        } else if (rel.valueBalance === 'do_give_more' && rel.strength !== 'weak') {
          main.push({
            id: `main-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Offrire valore a ${rel.name}`,
            motivo: `Stai dando più di quanto ricevi. Importante rafforzare il reciproco scambio di valore.`,
            priorita: 'alta'
          });
        } else if (!rel.nextAction && rel.importance !== 'low') {
          main.push({
            id: `main-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Pianificare prossima azione con ${rel.name}`,
            motivo: `Nessuna prossima azione definita. Importante mantenere la relazione attiva.`,
            priorita: 'alta'
          });
        }
      }
    });

    // Task bonus
    relationships.forEach((rel, idx) => {
      if (bonus.length < 5) {
        const lastContactDate = new Date(rel.lastContact);
        const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceContact > 14 && daysSinceContact < 30) {
          bonus.push({
            id: `bonus-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Check-in informale con ${rel.name}`,
            motivo: `Mantenere la relazione calda con contatti regolari ogni 2-3 settimane.`,
            priorita: 'media'
          });
        } else if (rel.strength === 'developing' && rel.category === 'decision_maker') {
          bonus.push({
            id: `bonus-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Approfondire relazione con ${rel.name}`,
            motivo: `Decisore chiave in fase di sviluppo. Importante investire tempo ora.`,
            priorita: 'media'
          });
        } else if (rel.category === 'connector' && rel.noteCount < 2) {
          bonus.push({
            id: `bonus-${rel.id}`,
            relazione: rel.name,
            relazioneId: rel.id,
            task: `Richiedere introduzioni a ${rel.name}`,
            motivo: `Connettore con potenziale di network. Chiedere presentazioni strategiche.`,
            priorita: 'bassa'
          });
        }
      }
    });

    setSuggestions({ main, bonus });
  };

  useEffect(() => {
    if (relationships.length > 0) {
      generateSuggestions();
    }
  }, [relationships.length]);

  const getPriorityColor = (priorita: string) => {
    switch (priorita) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'bassa': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityIcon = (priorita: string) => {
    switch (priorita) {
      case 'alta': return '🔴';
      case 'media': return '🟡';
      case 'bassa': return '🟢';
      default: return '⚪';
    }
  };

  if (relationships.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🤖</span>
            <span>Suggerimenti AI per le tue Relazioni</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Task intelligenti basati sulle tue relazioni esistenti
          </p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700 p-2 text-xl"
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Generazione suggerimenti AI...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Task Prioritari */}
              {suggestions.main.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>⭐</span>
                    <span>Task Prioritari</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{suggestions.main.length}</span>
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {suggestions.main.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border-2 border-purple-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{task.task}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Per: {task.relazione}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getPriorityColor(task.priorita)}`}>
                            {getPriorityIcon(task.priorita)} {task.priorita.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <span className="font-semibold">Motivo:</span> {task.motivo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Bonus */}
              {suggestions.bonus.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>Task Bonus</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{suggestions.bonus.length}</span>
                  </h4>
                  <div className="space-y-2">
                    {suggestions.bonus.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:shadow transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">{task.task}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Per: {task.relazione}</div>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getPriorityColor(task.priorita)}`}>
                            {getPriorityIcon(task.priorita)} {task.priorita.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {task.motivo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.main.length === 0 && suggestions.bonus.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm text-gray-600">Tutte le tue relazioni sono ben gestite!</p>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={loading}
                  className="text-xs sm:text-sm"
                >
                  🔄 Rigenera Suggerimenti
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
