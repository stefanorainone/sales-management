'use client';

import { useState } from 'react';
import { Card, Badge, Button, Select } from '@/components/ui';
import { ChatViewer } from './ChatViewer';
import type { AdminSellerOverview, AICustomInstructions } from '@/types';

interface AdminSellerCardProps {
  seller: AdminSellerOverview;
  onAddInstruction: (userId: string, instructions: string, priority: 'high' | 'medium' | 'low') => Promise<void>;
  onDeleteInstruction: (instructionId: string) => Promise<void>;
  onChatIntervene: (sessionId: string, message: string) => Promise<void>;
}

export function AdminSellerCard({ seller, onAddInstruction, onDeleteInstruction, onChatIntervene }: AdminSellerCardProps) {
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmitInstruction = async () => {
    if (!instructions.trim()) return;

    setLoading(true);
    try {
      await onAddInstruction(seller.user.id, instructions, priority);
      setInstructions('');
      setShowInstructionForm(false);
    } catch (error) {
      console.error('Error adding instruction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (lastActivity?: string) => {
    if (!lastActivity) return 'text-gray-400';
    const hoursSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 1) return 'text-green-600';
    if (hoursSince < 4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'Nessuna attività';
    const hoursSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 1) return 'Attivo ora';
    if (hoursSince < 4) return `${Math.floor(hoursSince)}h fa`;
    return `${Math.floor(hoursSince / 24)}g fa`;
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
        <div className="flex items-center gap-3">
          {seller.user.avatar && (
            <img
              src={seller.user.avatar}
              alt={seller.user.displayName}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg">{seller.user.displayName}</h3>
            <p className="text-sm text-white/80">{seller.user.territory}</p>
          </div>
          <div className={`text-sm font-medium ${getStatusColor(seller.stats.lastActivity)}`}>
            {formatLastActivity(seller.stats.lastActivity)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{seller.stats.activeDeals}</div>
          <div className="text-xs text-gray-600">Deal Attivi</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{seller.stats.dealsWon}</div>
          <div className="text-xs text-gray-600">Deal Vinti</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{seller.stats.tasksToday}</div>
          <div className="text-xs text-gray-600">Task Oggi</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{seller.stats.tasksCompleted}</div>
          <div className="text-xs text-gray-600">Completati</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Tasks */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📋</span>
            <span>Task di Oggi ({seller.todayTasks.length})</span>
          </h4>
          {seller.todayTasks.length > 0 ? (
            <div className="space-y-2">
              {seller.todayTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <Badge
                    variant={
                      task.priority === 'critical'
                        ? 'danger'
                        : task.priority === 'high'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                  >
                    {task.priority}
                  </Badge>
                  <span className={task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}>
                    {task.title}
                  </span>
                  {task.status === 'in_progress' && (
                    <span className="ml-auto text-xs text-green-600 font-medium">In corso...</span>
                  )}
                  {task.status === 'completed' && (
                    <span className="ml-auto text-xs text-gray-500">✓</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nessun task oggi</p>
          )}
        </div>

        {/* Recent Deals */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>🎯</span>
            <span>Deal Recenti</span>
          </h4>
          {seller.recentDeals.length > 0 ? (
            <div className="space-y-2">
              {seller.recentDeals.slice(0, 2).map((deal) => (
                <div key={deal.id} className="flex items-start gap-2 text-sm">
                  <span className="text-lg">
                    {deal.entityType === 'scuola' && '🏫'}
                    {deal.entityType === 'hotel' && '🏨'}
                    {deal.entityType === 'museo_privato' && '🏛️'}
                    {deal.entityType === 'comune' && '🏛️'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{deal.clientName}</p>
                    <p className="text-xs text-gray-600">{deal.title}</p>
                  </div>
                  <Badge
                    variant={
                      deal.stage === 'won'
                        ? 'success'
                        : deal.priority === 'hot'
                        ? 'hot'
                        : deal.priority === 'warm'
                        ? 'warning'
                        : 'cold'
                    }
                    size="sm"
                  >
                    {deal.probability}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nessun deal</p>
          )}
        </div>

        {/* Custom Instructions */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🤖</span>
              <span>Istruzioni AI</span>
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInstructionForm(!showInstructionForm)}
            >
              {showInstructionForm ? 'Annulla' : '+ Aggiungi'}
            </Button>
          </div>

          {/* Existing Instructions */}
          {seller.customInstructions && seller.customInstructions.length > 0 && (
            <div className="space-y-2 mb-3">
              {seller.customInstructions.map((instr) => (
                <div
                  key={instr.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    instr.priority === 'high'
                      ? 'bg-red-50 border-red-500'
                      : instr.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 flex-1">{instr.instructions}</p>
                    <button
                      onClick={() => onDeleteInstruction(instr.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(instr.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add Instruction Form */}
          {showInstructionForm && (
            <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Es: Focus su comuni questa settimana. Priorità: chiudere deal Assisi entro venerdì."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  fullWidth={false}
                  className="flex-1"
                >
                  <option value="high">Alta Priorità</option>
                  <option value="medium">Media Priorità</option>
                  <option value="low">Bassa Priorità</option>
                </Select>
                <Button
                  size="sm"
                  onClick={handleSubmitInstruction}
                  disabled={loading || !instructions.trim()}
                >
                  {loading ? 'Salvataggio...' : 'Salva'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* AI Chat Conversations */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>💬</span>
              <span>Chat AI Coach</span>
              {seller.recentChats && seller.recentChats.length > 0 && (
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                  {seller.recentChats.length}
                </span>
              )}
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChats(!showChats)}
            >
              {showChats ? 'Nascondi' : 'Mostra'}
            </Button>
          </div>

          {showChats && (
            <ChatViewer
              sessions={seller.recentChats || []}
              sellerName={seller.user.displayName}
              onIntervene={onChatIntervene}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
