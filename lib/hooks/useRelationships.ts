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
import { useAuth } from '@/lib/contexts/AuthContext';

export interface RelationshipAction {
  id: string;
  action: string;
  completedAt: string;
  notes?: string;
}

export interface Relationship {
  id: string;
  userId: string;
  name: string;
  company: string;
  role: string;
  strength: 'strong' | 'active' | 'developing' | 'weak';
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'decision_maker' | 'influencer' | 'champion' | 'gatekeeper' | 'advisor' | 'connector';
  lastContact: string;
  nextAction: string;
  mutualBenefits: string[];
  valueBalance: 'do_give_more' | 'balanced' | 'do_receive_more';
  noteCount: number;
  actionsHistory: RelationshipAction[];
  createdAt: string;
  updatedAt: string;
}

export function useRelationships() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRelationships([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'relationships'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const relationshipsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Relationship[];
        setRelationships(relationshipsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching relationships:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addRelationship = async (relationshipData: Omit<Relationship, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = await addDoc(collection(db, 'relationships'), {
        ...relationshipData,
        userId: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding relationship:', err);
      throw err;
    }
  };

  const updateRelationship = async (relationshipId: string, updates: Partial<Relationship>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const relationshipRef = doc(db, 'relationships', relationshipId);
      await updateDoc(relationshipRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error updating relationship:', err);
      throw err;
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await deleteDoc(doc(db, 'relationships', relationshipId));
    } catch (err: any) {
      console.error('Error deleting relationship:', err);
      throw err;
    }
  };

  const completeAction = async (relationshipId: string, action: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const relationshipRef = doc(db, 'relationships', relationshipId);
      const relationship = relationships.find(r => r.id === relationshipId);

      if (!relationship) throw new Error('Relationship not found');

      const newAction: RelationshipAction = {
        id: Date.now().toString(),
        action,
        completedAt: new Date().toISOString(),
        notes,
      };

      const updatedHistory = [...(relationship.actionsHistory || []), newAction];

      await updateDoc(relationshipRef, {
        actionsHistory: updatedHistory,
        lastContact: new Date().toISOString(),
        nextAction: '', // Clear next action after completing
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error completing action:', err);
      throw err;
    }
  };

  return {
    relationships,
    loading,
    error,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    completeAction,
  };
}
