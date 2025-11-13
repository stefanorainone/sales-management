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

export interface RelationshipNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string; // userId
  createdByName: string;
  createdByRole: 'admin' | 'seller' | 'team_leader';
}

export interface Relationship {
  id: string;
  userId: string;
  name: string;
  company: string;
  role: string;
  strength: 'strong' | 'active' | 'developing' | 'weak' | 'prospective';
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'decision_maker' | 'influencer' | 'champion' | 'gatekeeper' | 'advisor' | 'connector';
  lastContact: string;
  nextAction: string;
  whatICanGive: string[];
  whatICanReceive: string[];
  valueBalance: 'do_give_more' | 'balanced' | 'do_receive_more';
  noteCount: number;
  actionsHistory: RelationshipAction[];
  notes: RelationshipNote[];
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
        console.log('🔄 Relationships updated:', relationshipsData.length, 'relationships');
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
        notes: relationshipData.notes || [],
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

  const completeAction = async (
    relationshipId: string,
    action: string,
    notes?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const relationshipRef = doc(db, 'relationships', relationshipId);
      const relationship = relationships.find(r => r.id === relationshipId);

      if (!relationship) throw new Error('Relationship not found');

      const now = new Date().toISOString();
      const newAction: RelationshipAction = {
        id: Date.now().toString(),
        action,
        completedAt: now,
        ...(notes && { notes }),
      };

      const updatedHistory = [...(relationship.actionsHistory || []), newAction];

      // Create activity in activities collection for analytics
      console.log('🔄 Creating activity in Firestore...', {
        type: 'relationship_action',
        title: `${action} - ${relationship.name}`,
        userId: user.id,
      });

      const activityData = {
        userId: user.id,
        type: 'relationship_action' as const,
        title: `${action} - ${relationship.name}`,
        description: notes || `${action} con ${relationship.name} (${relationship.company})`,
        status: 'completed',
        relationshipId,
        relationshipName: relationship.name,
        relationshipCompany: relationship.company,
        scheduledAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const activityRef = await addDoc(collection(db, 'activities'), activityData);
      console.log('✅ Activity created successfully!', {
        activityId: activityRef.id,
        type: activityData.type,
        title: activityData.title,
      });

      // Update relationship with action
      await updateDoc(relationshipRef, {
        actionsHistory: updatedHistory,
        lastContact: now,
        nextAction: '', // Clear next action after completing
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error completing action:', err);
      throw err;
    }
  };

  const addNote = async (relationshipId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');
    if (!content.trim()) throw new Error('Note content cannot be empty');

    try {
      const relationshipRef = doc(db, 'relationships', relationshipId);
      const relationship = relationships.find(r => r.id === relationshipId);

      if (!relationship) throw new Error('Relationship not found');

      const newNote: RelationshipNote = {
        id: Date.now().toString(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.displayName || user.email || 'Unknown',
        createdByRole: user.role || 'seller',
      };

      const updatedNotes = [...(relationship.notes || []), newNote];

      await updateDoc(relationshipRef, {
        notes: updatedNotes,
        noteCount: updatedNotes.length,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error adding note:', err);
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
    addNote,
  };
}
