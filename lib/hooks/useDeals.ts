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
import type { Deal } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';

// DEMO MODE: Set to true to use mock data instead of Firebase
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Mock data for demo mode - VR Business Specific
const MOCK_DEALS: Deal[] = [
  // SCUOLA - Liceo Da Vinci (meeting done, proposal sent)
  {
    id: '1',
    userId: 'demo-user-123',
    clientId: '1',
    clientName: 'Liceo Scientifico Leonardo da Vinci',
    entityType: 'scuola',
    title: 'Evento VR Scientifico - Liceo Da Vinci Firenze',
    stage: 'proposal_sent',
    priority: 'hot',
    source: 'ai_research',
    serviceType: 'evento_scuola',
    contractType: 'evento_singolo',
    eventDate: '2026-03-15',
    studentCount: 250,
    hoursRequested: 4,
    experiencesSelected: ['Sistema Solare VR', 'Corpo Umano 3D', 'Fisica Quantistica'],
    contractValue: 2800,
    expectedSigningDate: '2025-11-30',
    followUpStrategy: 'Follow-up settimanale con Preside. Enfatizzare valore PCTO e innovazione didattica.',
    relationshipNotes: 'Preside molto tech-friendly. DSGA attento al budget ma favorevole.',
    probability: 85,
    notes: 'Meeting ottimo. Proposta inviata. Attendono approvazione Collegio Docenti prevista fine novembre.',
    createdAt: '2025-09-15T10:00:00.000Z',
    updatedAt: '2025-10-10T15:30:00.000Z',
  },

  // SCUOLA - IC Giovanni XXIII (primo contatto)
  {
    id: '2',
    userId: 'demo-user-123',
    clientId: '2',
    clientName: 'Istituto Comprensivo Giovanni XXIII',
    entityType: 'scuola',
    title: 'Evento VR Scuola Media - IC Giovanni XXIII Roma',
    stage: 'first_contact',
    priority: 'warm',
    source: 'referral',
    serviceType: 'evento_scuola',
    contractType: 'evento_singolo',
    studentCount: 120,
    hoursRequested: 3,
    experiencesSelected: ['Storia Antica Roma', 'Viaggi nello Spazio'],
    expectedSigningDate: '2026-02-28',
    followUpStrategy: 'Schedulare meeting con Dirigente. Portare case study scuola simile.',
    probability: 60,
    notes: 'Primo contatto telefonico positivo. Interessati ma devono verificare budget disponibile.',
    createdAt: '2025-10-05T09:15:00.000Z',
    updatedAt: '2025-10-08T11:20:00.000Z',
  },

  // HOTEL - Grand Hotel Vesuvio (meeting done, alta probabilità)
  {
    id: '3',
    userId: 'demo-user-123',
    clientId: '3',
    clientName: 'Grand Hotel Vesuvio',
    entityType: 'hotel',
    title: 'Postazione VR Lobby - Grand Hotel Vesuvio Napoli',
    stage: 'verbal_agreement',
    priority: 'hot',
    source: 'cold_call',
    serviceType: 'postazione_hotel',
    contractType: 'abbonamento_annuale',
    installationDate: '2026-03-20',
    contractDurationMonths: 12,
    expectedSigningDate: '2025-11-15',
    followUpStrategy: 'Preparare contratto revenue share. GM vuole installazione pre-Pasqua.',
    relationshipNotes: 'GM entusiasta. Focus su esperienza premium per ospiti luxury.',
    probability: 90,
    notes: 'GM ha dato ok verbale. Vuole postazione in lobby con esperienze Napoli/Pompei/Costiera. Firma prevista metà novembre.',
    createdAt: '2025-09-20T14:30:00.000Z',
    updatedAt: '2025-10-12T16:45:00.000Z',
  },

  // HOTEL - Bella Vista Amalfi (prospect, da contattare)
  {
    id: '4',
    userId: 'demo-user-123',
    clientId: '4',
    clientName: 'Hotel Bella Vista Amalfi',
    entityType: 'hotel',
    title: 'Postazione VR - Hotel Bella Vista Amalfi',
    stage: 'prospect',
    priority: 'warm',
    source: 'ai_research',
    serviceType: 'postazione_hotel',
    contractType: 'abbonamento_annuale',
    contractDurationMonths: 12,
    followUpStrategy: 'Prima chiamata per presentazione. Enfatizzare zero costi fissi.',
    probability: 40,
    notes: 'AI individuato. Hotel boutique 4 stelle costa amalfitana. Da contattare proprietario.',
    createdAt: '2025-10-14T10:00:00.000Z',
    updatedAt: '2025-10-14T10:00:00.000Z',
  },

  // MUSEO - Leonardo3 (contacted, schedulare meeting)
  {
    id: '5',
    userId: 'demo-user-123',
    clientId: '5',
    clientName: 'Museo Leonardo3',
    entityType: 'museo_privato',
    title: 'Postazione VR Interattiva - Museo Leonardo3 Milano',
    stage: 'meeting_scheduled',
    priority: 'warm',
    source: 'event',
    serviceType: 'postazione_museo',
    contractType: 'abbonamento_annuale',
    installationDate: '2026-01-15',
    contractDurationMonths: 24,
    expectedSigningDate: '2025-12-20',
    followUpStrategy: 'Meeting schedulato 25 ottobre. Preparare demo esperienze Leonardo/Invenzioni.',
    relationshipNotes: 'Direttore molto tech-oriented. Museo già innovativo.',
    probability: 70,
    notes: 'Conosciuti a fiera Milano. Meeting fissato per 25 ottobre. Molto interessati a postazione complementare.',
    createdAt: '2025-09-28T11:00:00.000Z',
    updatedAt: '2025-10-16T09:30:00.000Z',
  },

  // COMUNE - Assisi (proposal sent, under review giunta)
  {
    id: '6',
    userId: 'demo-user-123',
    clientId: '6',
    clientName: 'Comune di Assisi',
    entityType: 'comune',
    title: 'Esperienza 360 Basiliche + Postazione InfoPoint - Assisi',
    stage: 'under_review',
    priority: 'hot',
    source: 'referral',
    serviceType: 'esperienza_comune',
    contractType: 'sviluppo_custom',
    experienceTheme: 'Basiliche Francescane e Centro Storico UNESCO',
    shootingRequired: true,
    eventPlanned: true,
    eventDate2: '2026-04-10',
    installationLocation: 'Ufficio Informazioni Turistiche - Piazza del Comune',
    contractValue: 18500,
    budgetApprovalDate: '2025-10-25',
    expectedSigningDate: '2025-11-10',
    followUpStrategy: 'Giunta decide 25 ottobre. Follow-up il 26. Offrirsi per supporto documentazione.',
    relationshipNotes: 'Assessore Turismo molto favorevole. Sindaco supporta progetto.',
    probability: 80,
    notes: 'Proposta completa inviata. Include: sviluppo esperienza 360 (6 location), postazione InfoPoint, evento inaugurale. Giunta approva il 25 ottobre.',
    createdAt: '2025-08-10T10:00:00.000Z',
    updatedAt: '2025-10-15T17:00:00.000Z',
  },

  // COMUNE - Matera (prospect, nuovo)
  {
    id: '7',
    userId: 'demo-user-123',
    clientId: '7',
    clientName: 'Comune di Matera',
    entityType: 'comune',
    title: 'Esperienza VR Sassi + Postazione - Matera',
    stage: 'prospect',
    priority: 'warm',
    source: 'ai_research',
    serviceType: 'esperienza_comune',
    contractType: 'sviluppo_custom',
    experienceTheme: 'Sassi di Matera - Patrimonio UNESCO',
    shootingRequired: true,
    eventPlanned: false,
    followUpStrategy: 'Primo contatto con Assessore Turismo. Enfatizzare case study Assisi/San Gimignano.',
    probability: 35,
    notes: 'AI individuato. Enorme potenziale. Capitale Europea Cultura 2019. Da contattare.',
    createdAt: '2025-10-16T09:00:00.000Z',
    updatedAt: '2025-10-16T09:00:00.000Z',
  },

  // COMUNE - San Gimignano (cliente attivo)
  {
    id: '8',
    userId: 'demo-user-123',
    clientId: '8',
    clientName: 'Comune di San Gimignano',
    entityType: 'comune',
    title: 'Postazione VR Torri Medievali - San Gimignano [ATTIVO]',
    stage: 'active',
    priority: 'hot',
    source: 'referral',
    serviceType: 'postazione_comune',
    contractType: 'abbonamento_annuale',
    experienceTheme: 'Torri Medievali e Centro Storico',
    shootingRequired: false,
    installationLocation: 'Piazza del Duomo',
    contractDurationMonths: 12,
    closedDate: '2024-03-15T10:00:00.000Z',
    followUpStrategy: 'Check-in mensile. Raccogliere dati utilizzo. Preparare renewal per marzo 2026.',
    relationshipNotes: 'Cliente molto soddisfatto. Ottimo per referenze. Ha fatto referenza per Assisi.',
    probability: 100,
    notes: 'Cliente attivo dal marzo 2024. Postazione in Piazza Duomo. Ottimi risultati. Renewal previsto marzo 2026.',
    createdAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2025-10-10T14:00:00.000Z',
  },

  // COMUNE - San Gimignano RENEWAL
  {
    id: '9',
    userId: 'demo-user-123',
    clientId: '8',
    clientName: 'Comune di San Gimignano',
    entityType: 'comune',
    title: 'Rinnovo Contratto 2026-2027 - San Gimignano',
    stage: 'renewal_period',
    priority: 'warm',
    source: 'referral',
    serviceType: 'postazione_comune',
    contractType: 'abbonamento_annuale',
    contractDurationMonths: 12,
    expectedSigningDate: '2026-02-28',
    followUpStrategy: 'Contattare a gennaio 2026 per rinnovo. Proporre upgrade esperienze.',
    relationshipNotes: 'Ottimo rapporto. Probabile rinnovo automatico.',
    probability: 95,
    notes: 'Contratto scade marzo 2026. Monitorare per renewal anticipato.',
    createdAt: '2025-10-01T10:00:00.000Z',
    updatedAt: '2025-10-01T10:00:00.000Z',
  },
];

export function useDeals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDeals([]);
      setLoading(false);
      return;
    }

    // DEMO MODE: Use mock data
    if (DEMO_MODE) {
      setDeals(MOCK_DEALS);
      setLoading(false);
      return;
    }

    // Normal Firebase flow
    const q = query(
      collection(db, 'deals'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dealsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Deal[];
        setDeals(dealsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching deals:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Add to local state
    if (DEMO_MODE) {
      const newDeal: Deal = {
        ...dealData,
        id: `demo-${Date.now()}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDeals((prev) => [newDeal, ...prev]);
      console.log('DEMO MODE: Deal added', newDeal);
      return newDeal.id;
    }

    // Normal Firebase flow
    try {
      const docRef = await addDoc(collection(db, 'deals'), {
        ...dealData,
        userId: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding deal:', err);
      throw err;
    }
  };

  const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Update in local state
    if (DEMO_MODE) {
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId
            ? { ...deal, ...updates, updatedAt: new Date().toISOString() }
            : deal
        )
      );
      console.log('DEMO MODE: Deal updated', dealId, updates);
      return;
    }

    // Normal Firebase flow
    try {
      // Find the deal being updated
      const currentDeal = deals.find(d => d.id === dealId);

      const dealRef = doc(db, 'deals', dealId);
      await updateDoc(dealRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      // Track stage changes as activities
      if (currentDeal && updates.stage && updates.stage !== currentDeal.stage) {
        console.log('🔄 Deal stage changed, creating activity...', {
          from: currentDeal.stage,
          to: updates.stage,
          dealTitle: currentDeal.title,
        });

        // Create activity for proposal sent
        if (updates.stage === 'proposal_sent') {
          await addDoc(collection(db, 'activities'), {
            userId: user.id,
            type: 'proposal',
            title: `Proposta inviata - ${currentDeal.clientName}`,
            description: `Proposta inviata per: ${currentDeal.title}`,
            status: 'completed',
            dealId: dealId,
            dealTitle: currentDeal.title,
            clientName: currentDeal.clientName,
            scheduledAt: Timestamp.now(),
            completedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          console.log('✅ Activity "proposal" created');
        }

        // Create activity for deal won (contract signed)
        if (updates.stage === 'active' || updates.stage === 'won') {
          await addDoc(collection(db, 'activities'), {
            userId: user.id,
            type: 'contract',
            title: `Contratto firmato - ${currentDeal.clientName}`,
            description: `Contratto firmato per: ${currentDeal.title}`,
            status: 'completed',
            dealId: dealId,
            dealTitle: currentDeal.title,
            clientName: currentDeal.clientName,
            contractValue: updates.contractValue || currentDeal.contractValue,
            scheduledAt: Timestamp.now(),
            completedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          console.log('✅ Activity "contract" created');
        }
      }
    } catch (err: any) {
      console.error('Error updating deal:', err);
      throw err;
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Remove from local state
    if (DEMO_MODE) {
      setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
      console.log('DEMO MODE: Deal deleted', dealId);
      return;
    }

    // Normal Firebase flow
    try {
      await deleteDoc(doc(db, 'deals', dealId));
    } catch (err: any) {
      console.error('Error deleting deal:', err);
      throw err;
    }
  };

  return {
    deals,
    loading,
    error,
    addDeal,
    updateDeal,
    deleteDeal,
  };
}
