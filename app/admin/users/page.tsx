'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  team: string;
  createdAt: Date;
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('seller');
  const [team, setTeam] = useState('sales');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];

      setUsers(usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err: any) {
      setError('Errore nel caricamento utenti: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
          team,
          requestingUserId: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`Utente ${displayName} creato con successo!`);
      setShowCreateForm(false);

      // Reset form
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('seller');
      setTeam('sales');

      // Reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Errore nella creazione utente');
    } finally {
      setCreating(false);
    }
  };


  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDisplayName(user.displayName);
    setEmail(user.email);
    setRole(user.role);
    setTeam(user.team);
    setPassword(''); // Reset password field
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          displayName,
          email,
          role,
          team,
          ...(password ? { password } : {}), // Only include password if provided
          requestingUserId: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess(`✅ Utente ${displayName} aggiornato con successo!`);
      setEditingUser(null);

      // Reset form
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('seller');
      setTeam('sales');

      // Reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Errore nell\'aggiornamento utente');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ Sei sicuro di voler eliminare l'utente ${userName}?\n\nQuesta azione non può essere annullata e rimuoverà anche tutti i dati associati all'utente.`)) {
      return;
    }

    setDeleting(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestingUserId: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess(`✅ Utente ${userName} eliminato con successo!`);

      // Reload users
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Errore nell\'eliminazione utente');
    } finally {
      setDeleting(null);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="bg-red-50 border-red-200">
          <div className="text-center text-red-700">
            <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
            <p>Solo gli amministratori possono accedere a questa pagina.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Gestione Utenti</h1>
          <p className="text-gray-600 mt-1">Crea e gestisci gli account dei venditori</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Annulla' : '+ Nuovo Utente'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Crea Nuovo Utente</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@azienda.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruolo *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="seller">Venditore</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team
                </label>
                <Input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Sales, Marketing, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={creating}
                className="flex-1"
              >
                {creating ? 'Creazione in corso...' : 'Crea Utente'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Annulla
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">✏️ Modifica Utente</h2>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@azienda.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuova Password <span className="text-gray-500 font-normal">(lascia vuoto per non modificare)</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruolo *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="seller">Venditore</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team
                </label>
                <Input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Sales, Marketing, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={updating}
                className="flex-1"
              >
                {updating ? 'Aggiornamento in corso...' : 'Aggiorna Utente'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingUser(null);
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                  setRole('seller');
                  setTeam('sales');
                }}
              >
                Annulla
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Utenti Registrati ({users.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Caricamento...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessun utente trovato. Crea il primo utente!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ruolo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Team</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Creato</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.displayName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'team_leader'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : user.role === 'team_leader' ? 'Team Leader' : 'Venditore'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.team}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditUser(user)}
                          disabled={deleting === user.id}
                        >
                          ✏️ Modifica
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteUser(user.id, user.displayName)}
                          disabled={deleting === user.id}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        >
                          {deleting === user.id ? '⏳ Eliminando...' : '🗑️ Elimina'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Informazioni</h3>
            <p className="text-sm text-gray-700">
              Solo gli amministratori possono creare nuovi account. I venditori potranno
              accedere con le credenziali fornite ma non potranno registrarsi autonomamente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
