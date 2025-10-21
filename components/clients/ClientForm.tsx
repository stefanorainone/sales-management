'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { Client } from '@/types';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: Partial<Client>) => Promise<void>;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    company: client?.company || '',
    status: client?.status || 'new' as Client['status'],
    priority: client?.priority || 'warm' as Client['priority'],
    source: client?.source || 'other' as Client['source'],
    notes: client?.notes || '',
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mario Rossi"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Azienda</label>
          <Input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="mario@acme.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+39 123 456 7890"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Client['status'] })}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Client['priority'] })}
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fonte</label>
          <Select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value as Client['source'] })}
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Note aggiuntive..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="flex-1">
          Annulla
        </Button>
        <Button type="submit" variant="primary" disabled={loading} className="flex-1">
          {loading ? 'Salvataggio...' : client ? 'Aggiorna' : 'Crea Cliente'}
        </Button>
      </div>
    </form>
  );
}
