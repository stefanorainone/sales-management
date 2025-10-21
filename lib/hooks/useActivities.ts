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
import type { Activity } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';

// DEMO MODE: Set to true to use mock data instead of Firebase
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Mock data for demo mode
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    userId: 'demo-user-123',
    type: 'call',
    title: 'Follow-up call con Acme Corp',
    description: 'Discutere proposta e rispondere a domande tecniche',
    clientId: '1',
    dealId: '1',
    status: 'pending',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    createdAt: new Date('2025-10-15').toISOString(),
    updatedAt: new Date('2025-10-15').toISOString(),
  },
  {
    id: '2',
    userId: 'demo-user-123',
    type: 'meeting',
    title: 'Demo meeting con Beta SRL',
    description: 'Presentazione prodotto al team decision makers',
    clientId: '2',
    dealId: '2',
    status: 'pending',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    createdAt: new Date('2025-10-14').toISOString(),
    updatedAt: new Date('2025-10-14').toISOString(),
  },
  {
    id: '3',
    userId: 'demo-user-123',
    type: 'email',
    title: 'Invia proposta a Gamma Inc',
    description: 'Preparare e inviare proposta commerciale personalizzata',
    clientId: '3',
    dealId: '3',
    status: 'completed',
    scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2025-10-13').toISOString(),
    updatedAt: new Date('2025-10-15').toISOString(),
  },
  {
    id: '4',
    userId: 'demo-user-123',
    type: 'demo',
    title: 'Product demo per Delta Ltd',
    description: 'Demo tecnica del prodotto - focus su integrations',
    clientId: '4',
    dealId: '4',
    status: 'pending',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    createdAt: new Date('2025-10-14').toISOString(),
    updatedAt: new Date('2025-10-14').toISOString(),
  },
  {
    id: '5',
    userId: 'demo-user-123',
    type: 'task',
    title: 'Preparare contract per Epsilon SpA',
    description: 'Finalizzare termini contrattuali e inviare per firma',
    clientId: '5',
    dealId: '5',
    status: 'completed',
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2025-10-11').toISOString(),
    updatedAt: new Date('2025-10-12').toISOString(),
  },
  {
    id: '6',
    userId: 'demo-user-123',
    type: 'call',
    title: 'Quick check-in con Zeta Corp',
    description: 'Verificare stato decision process',
    clientId: '6',
    status: 'pending',
    scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    createdAt: new Date('2025-10-16').toISOString(),
    updatedAt: new Date('2025-10-16').toISOString(),
  },
];

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // DEMO MODE: Use mock data
    if (DEMO_MODE) {
      setActivities(MOCK_ACTIVITIES);
      setLoading(false);
      return;
    }

    // Normal Firebase flow
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', user.id),
      orderBy('scheduledAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          scheduledAt: doc.data().scheduledAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          completedAt: doc.data().completedAt?.toDate?.()?.toISOString(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Activity[];
        setActivities(activitiesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching activities:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addActivity = async (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Add to local state
    if (DEMO_MODE) {
      const newActivity: Activity = {
        ...activityData,
        id: `demo-${Date.now()}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActivities((prev) => [newActivity, ...prev]);
      console.log('DEMO MODE: Activity added', newActivity);
      return newActivity.id;
    }

    // Normal Firebase flow
    try {
      const docRef = await addDoc(collection(db, 'activities'), {
        ...activityData,
        userId: user.id,
        scheduledAt: activityData.scheduledAt ? Timestamp.fromDate(new Date(activityData.scheduledAt)) : Timestamp.now(),
        completedAt: activityData.completedAt ? Timestamp.fromDate(new Date(activityData.completedAt)) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding activity:', err);
      throw err;
    }
  };

  const updateActivity = async (activityId: string, updates: Partial<Activity>) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Update in local state
    if (DEMO_MODE) {
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? { ...activity, ...updates, updatedAt: new Date().toISOString() }
            : activity
        )
      );
      console.log('DEMO MODE: Activity updated', activityId, updates);
      return;
    }

    // Normal Firebase flow
    try {
      const activityRef = doc(db, 'activities', activityId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.scheduledAt) {
        updateData.scheduledAt = Timestamp.fromDate(new Date(updates.scheduledAt));
      }
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(new Date(updates.completedAt));
      }

      await updateDoc(activityRef, updateData);
    } catch (err: any) {
      console.error('Error updating activity:', err);
      throw err;
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!user) throw new Error('User not authenticated');

    // DEMO MODE: Remove from local state
    if (DEMO_MODE) {
      setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
      console.log('DEMO MODE: Activity deleted', activityId);
      return;
    }

    // Normal Firebase flow
    try {
      await deleteDoc(doc(db, 'activities', activityId));
    } catch (err: any) {
      console.error('Error deleting activity:', err);
      throw err;
    }
  };

  return {
    activities,
    loading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
  };
}
