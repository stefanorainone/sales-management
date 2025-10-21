'use client';

import { Card, Badge, Button, Modal } from '@/components/ui';
import { useState } from 'react';
import { useDeals } from '@/lib/hooks/useDeals';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DealForm } from '@/components/deals/DealForm';
import type { Deal } from '@/types';

import type { DealStage } from '@/types';

const stages = [
  { id: 'prospect' as DealStage, name: 'Prospect', icon: '🔍', color: 'bg-gray-100' },
  { id: 'first_contact' as DealStage, name: 'Primo Contatto', icon: '📞', color: 'bg-blue-100' },
  { id: 'meeting_scheduled' as DealStage, name: 'Meeting Fissato', icon: '📅', color: 'bg-indigo-100' },
  { id: 'meeting_done' as DealStage, name: 'Meeting Fatto', icon: '🤝', color: 'bg-purple-100' },
  { id: 'proposal_sent' as DealStage, name: 'Proposta Inviata', icon: '📄', color: 'bg-yellow-100' },
  { id: 'under_review' as DealStage, name: 'In Valutazione', icon: '⏳', color: 'bg-orange-100' },
  { id: 'verbal_agreement' as DealStage, name: 'Accordo Verbale', icon: '🤞', color: 'bg-lime-100' },
  { id: 'contract_signing' as DealStage, name: 'Firma Contratto', icon: '✍️', color: 'bg-teal-100' },
  { id: 'won' as DealStage, name: 'Chiuso Vinto', icon: '🎉', color: 'bg-green-100' },
  { id: 'in_delivery' as DealStage, name: 'In Delivery', icon: '🚀', color: 'bg-cyan-100' },
  { id: 'active' as DealStage, name: 'Attivo', icon: '✅', color: 'bg-emerald-100' },
  { id: 'renewal_period' as DealStage, name: 'Da Rinnovare', icon: '🔄', color: 'bg-amber-100' },
  { id: 'lost' as DealStage, name: 'Perso', icon: '❌', color: 'bg-red-100' },
];

export default function PipelinePage() {
  const { user } = useAuth();
  const { deals, loading, addDeal, updateDeal } = useDeals();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>();

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const getPriorityBadge = (priority: 'hot' | 'warm' | 'cold') => {
    const variants = {
      hot: 'hot' as const,
      warm: 'warning' as const,
      cold: 'cold' as const,
    };
    return <Badge variant={variants[priority]} size="sm">{priority.toUpperCase()}</Badge>;
  };

  const handleCreateDeal = async (data: Partial<Deal>) => {
    await addDeal(data as Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>);
    setIsModalOpen(false);
  };

  const handleUpdateDeal = async (data: Partial<Deal>) => {
    if (selectedDeal) {
      await updateDeal(selectedDeal.id, data);
      setIsModalOpen(false);
      setSelectedDeal(undefined);
    }
  };

  const handleAdvanceStage = async (deal: Deal) => {
    const currentIndex = stages.findIndex(s => s.id === deal.stage);
    if (currentIndex < stages.length - 1) {
      await updateDeal(deal.id, { stage: stages[currentIndex + 1].id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-600 mt-2">{deals.length} deals attivi</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                view === 'kanban' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                view === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>+ New Deal</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        /* Kanban View - Horizontal Scroll for 13 stages */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              const stageDeals = getDealsByStage(stage.id);
              return (
                <div key={stage.id} className="w-80 flex-shrink-0">
                  <div className={`${stage.color} rounded-t-lg px-4 py-3 shadow-sm border-b-2 border-gray-300`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{stage.icon}</span>
                        <h3 className="font-bold text-gray-900 text-sm">{stage.name}</h3>
                      </div>
                      <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">{stageDeals.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-3 min-h-[200px]">
                    {stageDeals.map((deal) => (
                      <Card key={deal.id} hover padding={false} className="p-4 cursor-pointer shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 mr-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">
                                {deal.entityType === 'scuola' && '🏫'}
                                {deal.entityType === 'hotel' && '🏨'}
                                {deal.entityType === 'museo_privato' && '🏛️'}
                                {deal.entityType === 'comune' && '🏛️'}
                              </span>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">
                                {deal.clientName}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-snug line-clamp-2">{deal.title}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {getPriorityBadge(deal.priority)}
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded">
                            <span className="text-sm font-medium text-gray-700">
                              {deal.serviceType === 'evento_scuola' && '📚 Evento'}
                              {deal.serviceType === 'postazione_hotel' && '🎮 Postazione'}
                              {deal.serviceType === 'postazione_museo' && '🎮 Postazione'}
                              {deal.serviceType === 'esperienza_comune' && '🎬 Esperienza 360'}
                              {deal.serviceType === 'postazione_comune' && '🎮 InfoPoint'}
                            </span>
                            <span className="text-sm font-bold text-primary">{deal.probability}%</span>
                          </div>
                          {deal.expectedSigningDate && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>📅</span>
                              <span>{new Date(deal.expectedSigningDate).toLocaleDateString('it-IT', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-sm px-3 py-2 font-medium"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setIsModalOpen(true);
                            }}
                          >
                            Apri
                          </Button>
                          {stage.id !== 'won' && stage.id !== 'active' && stage.id !== 'lost' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-3 py-2 font-medium text-sm"
                              onClick={() => handleAdvanceStage(deal)}
                            >
                              Avanza →
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="text-center py-12 text-gray-400 text-sm">
                        Nessun deal
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left">
                  <th className="pb-3 font-semibold text-gray-900">Titolo</th>
                  <th className="pb-3 font-semibold text-gray-900">Stage</th>
                  <th className="pb-3 font-semibold text-gray-900">Priorità</th>
                  <th className="pb-3 font-semibold text-gray-900">Fonte</th>
                  <th className="pb-3 font-semibold text-gray-900"></th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{deal.title}</td>
                    <td className="py-3">
                      <Badge variant="primary" size="sm">
                        {stages.find(s => s.id === deal.stage)?.name}
                      </Badge>
                    </td>
                    <td className="py-3">{getPriorityBadge(deal.priority)}</td>
                    <td className="py-3 text-gray-600">{deal.source || '-'}</td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsModalOpen(true);
                        }}
                      >
                        Modifica
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDeal(undefined);
        }}
        title={selectedDeal ? 'Modifica Deal' : 'Nuovo Deal'}
      >
        <DealForm
          deal={selectedDeal}
          onSubmit={selectedDeal ? handleUpdateDeal : handleCreateDeal}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedDeal(undefined);
          }}
        />
      </Modal>
    </div>
  );
}
