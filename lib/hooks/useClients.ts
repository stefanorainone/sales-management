'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Client } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';

// DEMO MODE: Set to true to use mock data instead of Firebase
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Mock data for demo mode - VR Business Specific
const MOCK_CLIENTS: Client[] = [
  // SCUOLE
  {
    id: '1',
    userId: 'demo-user-123',
    entityType: 'scuola',
    name: 'Prof.ssa Maria Lombardi',
    company: 'Liceo Scientifico Leonardo da Vinci',
    email: 'm.lombardi@liceodavinci-fi.edu.it',
    phone: '+39 055 234 5678',
    status: 'qualified',
    priority: 'hot',
    source: 'ai_research',
    studentCount: 850,
    schoolType: 'superiore',
    schoolGrade: 'Tutte le classi',
    decisionMakers: [
      { name: 'Prof.ssa Maria Lombardi', role: 'Preside', email: 'm.lombardi@liceodavinci-fi.edu.it', phone: '+39 055 234 5678', influence: 'decisore' },
      { name: 'Dott. Paolo Ricci', role: 'DSGA', email: 'p.ricci@liceodavinci-fi.edu.it', influence: 'decisore' }
    ],
    budgetCycle: 'Settembre-Giugno',
    bestContactPeriod: 'Settembre-Dicembre (no esami)',
    relationshipStrength: 4,
    lastInteractionType: 'Meeting',
    canBeReference: true,
    tags: ['Firenze', 'STEM', 'Innovazione'],
    notes: 'Molto interessati a esperienze VR scientifiche. Evento previsto per Marzo 2026.',
    createdAt: new Date('2025-09-15').toISOString(),
    updatedAt: new Date('2025-10-10').toISOString(),
    lastContactedAt: new Date('2025-10-10').toISOString(),
  },
  {
    id: '2',
    userId: 'demo-user-123',
    entityType: 'scuola',
    name: 'Prof. Giuseppe Ferretti',
    company: 'Istituto Comprensivo Giovanni XXIII',
    email: 'dirigente@icgiovanni23-rm.edu.it',
    phone: '+39 06 5512 3456',
    status: 'contacted',
    priority: 'warm',
    source: 'referral',
    studentCount: 420,
    schoolType: 'media',
    schoolGrade: 'Classi 2-3',
    decisionMakers: [
      { name: 'Prof. Giuseppe Ferretti', role: 'Dirigente Scolastico', influence: 'decisore' }
    ],
    budgetCycle: 'Anno scolastico',
    bestContactPeriod: 'Ottobre-Novembre',
    relationshipStrength: 2,
    lastInteractionType: 'Chiamata',
    tags: ['Roma', 'Scuola Media'],
    notes: 'Primo contatto. Interessati ma devono verificare budget.',
    createdAt: new Date('2025-10-05').toISOString(),
    updatedAt: new Date('2025-10-08').toISOString(),
    lastContactedAt: new Date('2025-10-08').toISOString(),
  },

  // HOTEL
  {
    id: '3',
    userId: 'demo-user-123',
    entityType: 'hotel',
    name: 'Dott. Andrea Martini',
    company: 'Grand Hotel Vesuvio',
    email: 'gm@grandhotelvesuvio.it',
    phone: '+39 081 764 0044',
    status: 'qualified',
    priority: 'hot',
    source: 'cold_call',
    stars: 5,
    roomCount: 160,
    seasonalPeak: 'Aprile-Ottobre',
    decisionMakers: [
      { name: 'Dott. Andrea Martini', role: 'General Manager', email: 'gm@grandhotelvesuvio.it', influence: 'decisore' },
      { name: 'Sig.ra Elena Conti', role: 'Guest Relations Manager', influence: 'influencer' }
    ],
    bestContactPeriod: 'Gennaio-Marzo (pre-stagione)',
    relationshipStrength: 3,
    lastInteractionType: 'Meeting',
    tags: ['Napoli', '5 stelle', 'Luxury'],
    notes: 'GM molto interessato a postazione VR in lobby. Vuole installazione prima di Pasqua.',
    createdAt: new Date('2025-09-20').toISOString(),
    updatedAt: new Date('2025-10-12').toISOString(),
    lastContactedAt: new Date('2025-10-12').toISOString(),
  },
  {
    id: '4',
    userId: 'demo-user-123',
    entityType: 'hotel',
    name: 'Sig. Marco Bellini',
    company: 'Hotel Bella Vista Amalfi',
    email: 'm.bellini@bellavistaamalfi.com',
    phone: '+39 089 871 243',
    status: 'new',
    priority: 'warm',
    source: 'ai_research',
    stars: 4,
    roomCount: 45,
    seasonalPeak: 'Maggio-Settembre',
    decisionMakers: [
      { name: 'Sig. Marco Bellini', role: 'Proprietario', influence: 'decisore' }
    ],
    bestContactPeriod: 'Febbraio-Aprile',
    relationshipStrength: 1,
    tags: ['Amalfi', '4 stelle', 'Boutique'],
    notes: 'AI individuato. Da contattare per presentazione.',
    createdAt: new Date('2025-10-14').toISOString(),
    updatedAt: new Date('2025-10-14').toISOString(),
  },

  // MUSEI PRIVATI
  {
    id: '5',
    userId: 'demo-user-123',
    entityType: 'museo_privato',
    name: 'Dott.ssa Chiara Rizzo',
    company: 'Museo Leonardo3',
    email: 'c.rizzo@leonardo3.net',
    phone: '+39 02 805 6919',
    status: 'contacted',
    priority: 'warm',
    source: 'event',
    visitorCountYearly: 85000,
    museumType: 'Scienza e Tecnologia',
    decisionMakers: [
      { name: 'Dott.ssa Chiara Rizzo', role: 'Direttore', email: 'c.rizzo@leonardo3.net', influence: 'decisore' }
    ],
    relationshipStrength: 3,
    lastInteractionType: 'Evento',
    tags: ['Milano', 'Tecnologia', 'Innovativo'],
    notes: 'Conosciuti a fiera. Molto interessati a postazione VR complementare alle loro esposizioni.',
    createdAt: new Date('2025-09-28').toISOString(),
    updatedAt: new Date('2025-10-06').toISOString(),
    lastContactedAt: new Date('2025-10-06').toISOString(),
  },

  // COMUNI
  {
    id: '6',
    userId: 'demo-user-123',
    entityType: 'comune',
    name: 'Dott. Stefano Moretti',
    company: 'Comune di Assisi',
    email: 's.moretti@comune.assisi.pg.it',
    phone: '+39 075 813 8680',
    status: 'qualified',
    priority: 'hot',
    source: 'referral',
    population: 28000,
    touristFlowYearly: 5000000,
    province: 'Perugia',
    region: 'Umbria',
    decisionMakers: [
      { name: 'Stefano Proietti', role: 'Sindaco', influence: 'decisore' },
      { name: 'Dott. Stefano Moretti', role: 'Assessore al Turismo', email: 's.moretti@comune.assisi.pg.it', influence: 'decisore' },
      { name: 'Dott.ssa Anna Frascarelli', role: 'Dirigente Ufficio Turismo', influence: 'influencer' }
    ],
    budgetCycle: 'Anno solare',
    bestContactPeriod: 'Settembre-Novembre (preparazione budget)',
    relationshipStrength: 4,
    lastInteractionType: 'Meeting',
    canBeReference: true,
    tags: ['Assisi', 'UNESCO', 'Turismo religioso'],
    notes: 'Progetto esperienza 360 Basiliche + postazione InfoPoint. Giunta approva il 25 ottobre.',
    createdAt: new Date('2025-08-10').toISOString(),
    updatedAt: new Date('2025-10-15').toISOString(),
    lastContactedAt: new Date('2025-10-15').toISOString(),
  },
  {
    id: '7',
    userId: 'demo-user-123',
    entityType: 'comune',
    name: 'Avv. Laura Bianchi',
    company: 'Comune di Matera',
    email: 'turismo@comune.matera.it',
    phone: '+39 0835 241 111',
    status: 'new',
    priority: 'warm',
    source: 'ai_research',
    population: 60000,
    touristFlowYearly: 1200000,
    province: 'Matera',
    region: 'Basilicata',
    decisionMakers: [
      { name: 'Avv. Laura Bianchi', role: 'Assessore Cultura e Turismo', email: 'turismo@comune.matera.it', influence: 'decisore' }
    ],
    budgetCycle: 'Anno solare',
    relationshipStrength: 1,
    tags: ['Matera', 'Capitale Cultura 2019', 'Sassi'],
    notes: 'AI individuato. Potenziale enorme per esperienza VR Sassi.',
    createdAt: new Date('2025-10-16').toISOString(),
    updatedAt: new Date('2025-10-16').toISOString(),
  },
  {
    id: '8',
    userId: 'demo-user-123',
    entityType: 'comune',
    name: 'Dott. Francesco Neri',
    company: 'Comune di San Gimignano',
    email: 'ufficio.turismo@comune.sangimignano.si.it',
    phone: '+39 0577 990 008',
    status: 'customer',
    priority: 'hot',
    source: 'referral',
    population: 7800,
    touristFlowYearly: 2500000,
    province: 'Siena',
    region: 'Toscana',
    decisionMakers: [
      { name: 'Dott. Francesco Neri', role: 'Responsabile Promozione Turistica', email: 'ufficio.turismo@comune.sangimignano.si.it', influence: 'decisore' }
    ],
    relationshipStrength: 5,
    lastInteractionType: 'Check-in',
    canBeReference: true,
    referenceProvidedTo: ['6'], // ha fatto referenza per Assisi
    tags: ['San Gimignano', 'UNESCO', 'Cliente attivo'],
    notes: 'Cliente attivo dal 2024. Postazione attiva in Piazza Duomo. Ottimi risultati.',
    createdAt: new Date('2024-03-15').toISOString(),
    updatedAt: new Date('2025-10-10').toISOString(),
    lastContactedAt: new Date('2025-10-10').toISOString(),
  },
];

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    // DEMO MODE: Use mock data
    if (DEMO_MODE) {
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    // Normal Firebase flow
    const q = query(
      collection(db, 'clients'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Client[];
        setClients(clientsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Add to local state
    if (DEMO_MODE) {
      const newClient: Client = {
        ...clientData,
        id: `demo-${Date.now()}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
      console.log('DEMO MODE: Client added', newClient);
      return newClient.id;
    }

    // Normal Firebase flow
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        userId: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Update in local state
    if (DEMO_MODE) {
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId
            ? { ...client, ...updates, updatedAt: new Date().toISOString() }
            : client
        )
      );
      console.log('DEMO MODE: Client updated', clientId, updates);
      return;
    }

    // Normal Firebase flow
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error updating client:', err);
      throw err;
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Remove from local state
    if (DEMO_MODE) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      console.log('DEMO MODE: Client deleted', clientId);
      return;
    }

    // Normal Firebase flow
    try {
      await deleteDoc(doc(db, 'clients', clientId));
    } catch (err: any) {
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
  };
}
