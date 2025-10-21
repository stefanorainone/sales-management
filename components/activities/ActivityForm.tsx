'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { Activity } from '@/types';

interface ActivityFormProps {
  activity?: Activity;
  onSubmit: (data: Partial<Activity>) => Promise<void>;
  onCancel: () => void;
}

export function ActivityForm({ activity, onSubmit, onCancel }: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: activity?.type || 'call' as Activity['type'],
    title: activity?.title || '',
    description: activity?.description || '',
    clientId: activity?.clientId || '',
    dealId: activity?.dealId || '',
    status: activity?.status || 'pending' as Activity['status'],
    scheduledAt: activity?.scheduledAt ? new Date(activity.scheduledAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Activity['type'] })}
            required
          >
            <option value="call">📞 Chiamata</option>
            <option value="email">✉️ Email</option>
            <option value="meeting">📅 Meeting</option>
            <option value="demo">🎯 Demo</option>
            <option value="task">✅ Task</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titolo *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="es. Chiamata Beta SRL"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Data e Ora *</label>
        <input
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
          <Input
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            placeholder="ID cliente (opzionale)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deal ID</label>
          <Input
            value={formData.dealId}
            onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
            placeholder="ID deal (opzionale)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Dettagli dell'attività..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="flex-1">
          Annulla
        </Button>
        <Button type="submit" variant="primary" disabled={loading} className="flex-1">
          {loading ? 'Salvataggio...' : activity ? 'Aggiorna' : 'Crea Attività'}
        </Button>
      </div>
    </form>
  );
}
