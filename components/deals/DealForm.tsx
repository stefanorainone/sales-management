'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { Deal } from '@/types';

interface DealFormProps {
  deal?: Deal;
  clientId?: string;
  onSubmit: (data: Partial<Deal>) => Promise<void>;
  onCancel: () => void;
}

export function DealForm({ deal, clientId, onSubmit, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    clientId: deal?.clientId || clientId || '',
    stage: deal?.stage || 'lead' as Deal['stage'],
    priority: deal?.priority || 'warm' as Deal['priority'],
    source: deal?.source || 'other' as Deal['source'],
    notes: deal?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titolo Deal *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="es. Vendita Software CRM"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client ID
        </label>
        <Input
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          placeholder="ID del cliente (opzionale)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stage *
          </label>
          <Select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
            required
          >
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorità *
          </label>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Deal['priority'] })}
            required
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fonte
        </label>
        <Select
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value as Deal['source'] })}
        >
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="cold_call">Cold Call</option>
          <option value="event">Event</option>
          <option value="social">Social</option>
          <option value="ai_research">AI Research</option>
          <option value="other">Other</option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Note aggiuntive..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Annulla
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Salvataggio...' : deal ? 'Aggiorna' : 'Crea Deal'}
        </Button>
      </div>
    </form>
  );
}
