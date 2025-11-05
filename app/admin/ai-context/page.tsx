'use client';

import { useState, useEffect } from 'react';
import type { AIContext, User } from '@/types';

export default function AIContextAdminPage() {
  const [sellers, setSellers] = useState<User[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [context, setContext] = useState<AIContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [sellerName, setSellerName] = useState('');
  const [sellerStrengths, setSellerStrengths] = useState<string[]>([]);
  const [sellerWeaknesses, setSellerWeaknesses] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [specificInstructions, setSpecificInstructions] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [industryKnowledge, setIndustryKnowledge] = useState('');
  const [companyGuidelines, setCompanyGuidelines] = useState('');

  // Load sellers list
  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const response = await fetch('/api/admin/sellers');
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
    }
  };

  // Load context when seller is selected
  useEffect(() => {
    if (selectedSeller) {
      loadContext();
    }
  }, [selectedSeller]);

  const loadContext = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ai-context?userId=${selectedSeller}`);
      if (response.ok) {
        const data: AIContext = await response.json();
        setContext(data);

        // Popola i form fields
        setSellerName(data.sellerName || '');
        setSellerStrengths(data.customContext?.sellerStrengths || []);
        setSellerWeaknesses(data.customContext?.sellerWeaknesses || []);
        setLearningGoals(data.customContext?.learningGoals || []);
        setSpecificInstructions(data.customContext?.specificInstructions || '');
        setCommunicationStyle(data.customContext?.communicationStyle || 'Professionale e di supporto');
        setIndustryKnowledge(data.customContext?.industryKnowledge || '');
        setCompanyGuidelines(data.customContext?.companyGuidelines || '');
      }
    } catch (error) {
      console.error('Error loading context:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSeller) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSeller,
          sellerName,
          customContext: {
            sellerStrengths,
            sellerWeaknesses,
            learningGoals,
            specificInstructions,
            communicationStyle,
            industryKnowledge,
            companyGuidelines,
          },
        }),
      });

      if (response.ok) {
        alert('✅ Contesto AI salvato con successo!');
        loadContext(); // Ricarica per aggiornare version number
      } else {
        alert('❌ Errore nel salvare il contesto');
      }
    } catch (error) {
      console.error('Error saving context:', error);
      alert('❌ Errore nel salvare il contesto');
    } finally {
      setSaving(false);
    }
  };

  const addToList = (list: string[], setList: (list: string[]) => void, value: string) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
    }
  };

  const removeFromList = (list: string[], setList: (list: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Gestione Contesto AI Venditori
        </h1>
        <p className="text-gray-600">
          Personalizza il contesto che l'AI usa per rispondere alle domande di ogni venditore.
          Include task completati, note, file caricati e impostazioni personalizzate.
        </p>
      </div>

      {/* Seller Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleziona Venditore
        </label>
        <select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">-- Seleziona un venditore --</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.displayName} ({seller.email})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento contesto...</p>
        </div>
      )}

      {!loading && selectedSeller && context && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Statistiche Automatiche</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Task Completati</div>
                <div className="text-2xl font-bold text-blue-600">
                  {context.stats?.totalTasksCompleted || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Tasso di Successo</div>
                <div className="text-2xl font-bold text-green-600">
                  {context.stats?.successRate || 0}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Durata Media</div>
                <div className="text-2xl font-bold text-purple-600">
                  {context.stats?.averageDuration || 0} min
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Ultimo Aggiornamento</div>
                <div className="text-sm font-medium text-gray-700">
                  {context.lastTaskAddedAt
                    ? new Date(context.lastTaskAddedAt).toLocaleDateString('it-IT')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Context Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✏️ Contesto Personalizzato</h2>

            {/* Seller Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Venditore
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="es: Mario Rossi"
              />
            </div>

            {/* Seller Strengths */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💪 Punti di Forza
              </label>
              <div className="space-y-2">
                {sellerStrengths.map((strength, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={strength}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                    />
                    <button
                      onClick={() => removeFromList(sellerStrengths, setSellerStrengths, index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-strength"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="es: Ottimo nell'ascolto attivo"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addToList(sellerStrengths, setSellerStrengths, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-strength') as HTMLInputElement;
                      addToList(sellerStrengths, setSellerStrengths, input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Weaknesses */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📉 Aree di Miglioramento
              </label>
              <div className="space-y-2">
                {sellerWeaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={weakness}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                    />
                    <button
                      onClick={() => removeFromList(sellerWeaknesses, setSellerWeaknesses, index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-weakness"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="es: Tende a parlare troppo"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addToList(sellerWeaknesses, setSellerWeaknesses, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-weakness') as HTMLInputElement;
                      addToList(sellerWeaknesses, setSellerWeaknesses, input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>

            {/* Learning Goals */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Obiettivi di Apprendimento
              </label>
              <div className="space-y-2">
                {learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={goal}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                    />
                    <button
                      onClick={() => removeFromList(learningGoals, setLearningGoals, index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-goal"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="es: Migliorare gestione obiezioni sul prezzo"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addToList(learningGoals, setLearningGoals, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-goal') as HTMLInputElement;
                      addToList(learningGoals, setLearningGoals, input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>

            {/* Specific Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Istruzioni Specifiche per questo Venditore
              </label>
              <textarea
                value={specificInstructions}
                onChange={(e) => setSpecificInstructions(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="es: Questo venditore lavora principalmente con scuole superiori. Ha bisogno di supporto nella gestione dei contatti con i presidi."
              />
            </div>

            {/* Communication Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Stile di Comunicazione AI
              </label>
              <textarea
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="es: Usa un tono incoraggiante e motivante. Fornisci esempi pratici e concreti."
              />
            </div>

            {/* Industry Knowledge */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏢 Conoscenze Specifiche del Settore
              </label>
              <textarea
                value={industryKnowledge}
                onChange={(e) => setIndustryKnowledge(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="es: Settore scuole: PNSD, PON, bandi ministeriali. Conosce budget tipici per scuole di diversi gradi."
              />
            </div>

            {/* Company Guidelines */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Linee Guida Aziendali
              </label>
              <textarea
                value={companyGuidelines}
                onChange={(e) => setCompanyGuidelines(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="es: Sempre chiedere budget prima di inviare proposta. Non promettere sconti >15% senza approvazione. Follow-up entro 48h da ogni incontro."
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={loadContext}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                🔄 Ricarica
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '💾 Salvataggio...' : '💾 Salva Contesto AI'}
              </button>
            </div>
          </div>

          {/* Recent Tasks Preview */}
          {context.completedTasks && context.completedTasks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📝 Ultimi Task Completati (Top 5)
              </h2>
              <div className="space-y-4">
                {context.completedTasks.slice(0, 5).map((task, index) => (
                  <div key={task.taskId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(task.completedAt).toLocaleDateString('it-IT')} •
                          {task.outcome === 'success' ? ' ✅ Successo' :
                           task.outcome === 'partial' ? ' ⚠️ Parziale' :
                           task.outcome === 'failed' ? ' ❌ Fallito' : ' ⏭️ No Answer'}
                        </p>
                      </div>
                      {task.actualDuration && (
                        <span className="text-sm text-gray-500">⏱️ {task.actualDuration} min</span>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Note:</strong> {task.notes.slice(0, 150)}
                        {task.notes.length > 150 && '...'}
                      </p>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <p className="text-sm text-blue-600">
                        📎 {task.attachments.length} file caricato/i
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
