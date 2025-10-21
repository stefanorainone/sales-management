'use client';

import { Card, Badge, Button, Input, Modal, Select } from '@/components/ui';
import { useState } from 'react';
import { useClients } from '@/lib/hooks/useClients';
import { ClientForm } from '@/components/clients/ClientForm';
import type { Client } from '@/types';

export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || client.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateClient = async (data: Partial<Client>) => {
    await addClient(data as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    setIsModalOpen(false);
  };

  const handleUpdateClient = async (data: Partial<Client>) => {
    if (selectedClient) {
      await updateClient(selectedClient.id, data);
      setIsModalOpen(false);
      setSelectedClient(undefined);
    }
  };

  const statusCounts = {
    total: clients.length,
    hot: clients.filter(c => c.priority === 'hot').length,
    qualified: clients.filter(c => c.status === 'qualified').length,
    new: clients.filter(c => c.status === 'new').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento clienti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clienti & Leads</h1>
          <p className="text-gray-600 mt-2">{clients.length} clienti totali</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Nuovo Lead</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Totale Leads</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.total}</div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Hot Leads</div>
          <div className="text-2xl font-bold text-danger mt-1">{statusCounts.hot}</div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Qualified</div>
          <div className="text-2xl font-bold text-success mt-1">{statusCounts.qualified}</div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Nuovi (Oggi)</div>
          <div className="text-2xl font-bold text-primary mt-1">{statusCounts.new}</div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <Input
              placeholder="Cerca per nome, azienda o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
          </Select>
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">Tutte le priorità</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-gray-900">Nome</th>
                <th className="pb-3 font-semibold text-gray-900">Azienda</th>
                <th className="pb-3 font-semibold text-gray-900">Contatti</th>
                <th className="pb-3 font-semibold text-gray-900">Status</th>
                <th className="pb-3 font-semibold text-gray-900">Priorità</th>
                <th className="pb-3 font-semibold text-gray-900">Fonte</th>
                <th className="pb-3 font-semibold text-gray-900"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="py-3 text-gray-600">{client.company || '-'}</td>
                  <td className="py-3">
                    <div className="text-sm">
                      <div>{client.email}</div>
                      {client.phone && <div className="text-gray-500">{client.phone}</div>}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={client.status === 'qualified' ? 'success' : 'warning'} size="sm">
                      {client.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        client.priority === 'hot' ? 'hot' :
                        client.priority === 'warm' ? 'warning' : 'cold'
                      }
                      size="sm"
                    >
                      {client.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-gray-600">{client.source || '-'}</td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClient(client);
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(undefined);
        }}
        title={selectedClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
      >
        <ClientForm
          client={selectedClient}
          onSubmit={selectedClient ? handleUpdateClient : handleCreateClient}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedClient(undefined);
          }}
        />
      </Modal>
    </div>
  );
}
