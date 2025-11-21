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

      // Check if AI returned valid suggestions
      if (data.suggestions &&
          (data.suggestions.main.length > 0 || data.suggestions.bonus.length > 0)) {
        setSuggestions(data.suggestions);
      } else {
        // AI returned empty or invalid suggestions, use manual fallback
        console.log('AI returned empty suggestions, using manual fallback');
        generateManualSuggestions();
      }
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

    // Helper per aggiungere task generici se non raggiungiamo il numero
    const genericMainTasks = [
      { task: 'Rivedere strategia relazioni mensile', motivo: 'Analizzare quali relazioni stanno dando più valore e dove investire tempo.', priorita: 'alta' as const },
      { task: 'Organizzare evento networking', motivo: 'Creare occasioni per far incontrare le tue relazioni e rafforzare il network.', priorita: 'alta' as const },
      { task: 'Aggiornare CRM con ultime note', motivo: 'Mantenere traccia dettagliata delle conversazioni per follow-up più efficaci.', priorita: 'alta' as const },
    ];

    const genericBonusTasks = [
      { task: 'Condividere articolo/risorsa utile', motivo: 'Dare valore proattivamente condividendo contenuti rilevanti per le loro sfide.', priorita: 'media' as const },
      { task: 'Pianificare coffee virtuale informale', motivo: 'Rafforzare relazioni con conversazioni autentiche senza agenda specifica.', priorita: 'media' as const },
      { task: 'Congratularsi per successi recenti', motivo: 'Mostrare interesse genuino celebrando i loro traguardi professionali.', priorita: 'bassa' as const },
      { task: 'Richiedere feedback su tua attività', motivo: 'Coinvolgere le relazioni chiedendo consigli, li fa sentire valorizzati.', priorita: 'bassa' as const },
      { task: 'Fare introduzione strategica', motivo: 'Creare valore connettendo persone del tuo network che potrebbero aiutarsi.', priorita: 'bassa' as const },
    ];

    // Task prioritari
    relationships.forEach((rel) => {
      if (main.length >= 3) return;

      const lastContactDate = new Date(rel.lastContact);
      const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceContact > 21 && rel.importance !== 'low') {
        main.push({
          id: `main-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Contattare ${rel.name} per check-in`,
          motivo: `Non contattato da ${daysSinceContact} giorni. Mantenere la relazione attiva con touch point regolari.`,
          priorita: 'alta'
        });
      } else if (rel.valueBalance === 'do_give_more') {
        main.push({
          id: `main-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Offrire valore a ${rel.name}`,
          motivo: `Bilanciamento valore: stai dando di più. Continuare a dare valore rafforza la relazione.`,
          priorita: 'alta'
        });
      } else if (!rel.nextAction) {
        main.push({
          id: `main-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Definire prossima azione con ${rel.name}`,
          motivo: `Nessuna prossima azione pianificata. Avere un next step chiaro mantiene momentum.`,
          priorita: 'alta'
        });
      } else if (rel.strength === 'weak' && rel.importance !== 'low') {
        main.push({
          id: `main-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Rafforzare relazione con ${rel.name}`,
          motivo: `Relazione debole ma importante. Investire tempo ora per svilupparla.`,
          priorita: 'alta'
        });
      }
    });

    // Completa con task generici se necessario
    while (main.length < 3 && genericMainTasks.length > 0) {
      const genericTask = genericMainTasks.shift()!;
      const randomRel = relationships[Math.floor(Math.random() * relationships.length)];
      main.push({
        id: `main-generic-${main.length}`,
        relazione: randomRel?.name || 'Generale',
        relazioneId: randomRel?.id || 'general',
        ...genericTask
      });
    }

    // Task bonus
    relationships.forEach((rel) => {
      if (bonus.length >= 5) return;

      const lastContactDate = new Date(rel.lastContact);
      const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceContact > 7 && daysSinceContact < 21) {
        bonus.push({
          id: `bonus-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Check-in informale con ${rel.name}`,
          motivo: `Contatto recente ma mantenere momentum con touch point ogni 1-2 settimane.`,
          priorita: 'media'
        });
      } else if (rel.strength === 'developing') {
        bonus.push({
          id: `bonus-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Approfondire relazione con ${rel.name}`,
          motivo: `Relazione in sviluppo. Questo è il momento migliore per investire tempo.`,
          priorita: 'media'
        });
      } else if (rel.category === 'connector') {
        bonus.push({
          id: `bonus-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Richiedere intro a ${rel.name}`,
          motivo: `Connettore nel tuo network. Chiedere presentazioni strategiche a persone chiave.`,
          priorita: 'bassa'
        });
      } else if (rel.category === 'decision_maker') {
        bonus.push({
          id: `bonus-${rel.id}`,
          relazione: rel.name,
          relazioneId: rel.id,
          task: `Proporre collaborazione a ${rel.name}`,
          motivo: `Decision maker. Esplorare opportunità di collaborazione o partnership.`,
          priorita: 'media'
        });
      }
    });

    // Completa con task generici se necessario
    while (bonus.length < 5 && genericBonusTasks.length > 0) {
      const genericTask = genericBonusTasks.shift()!;
      const randomRel = relationships[Math.floor(Math.random() * relationships.length)];
      bonus.push({
        id: `bonus-generic-${bonus.length}`,
        relazione: randomRel?.name || 'Generale',
        relazioneId: randomRel?.id || 'general',
        ...genericTask
      });
    }

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

  // Show widget even if no relationships exist
  if (relationships.length === 0) {
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
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-sm text-gray-600">
            Aggiungi delle relazioni per ricevere suggerimenti AI personalizzati!
          </p>
        </div>
      </Card>
    );
  }

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
