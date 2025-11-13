'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Relationship } from '@/lib/hooks/useRelationships';

export interface RelationshipWithUser extends Relationship {
  userEmail?: string;
  userName?: string;
}

export function useAdminRelationships() {
  const [relationships, setRelationships] = useState<RelationshipWithUser[]>([]);
  const [users, setUsers] = useState<Record<string, { email: string; displayName: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First, fetch all users to map userId to names
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap: Record<string, { email: string; displayName: string }> = {};
        usersSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          usersMap[doc.id] = {
            email: data.email || 'N/A',
            displayName: data.displayName || data.email || 'Unknown',
          };
        });
        setUsers(usersMap);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();

    // Listen to all relationships (admin can see everything)
    const q = query(
      collection(db, 'relationships'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const relationshipsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const userId = data.userId;
          return {
            id: doc.id,
            ...data,
            userEmail: users[userId]?.email,
            userName: users[userId]?.displayName,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as RelationshipWithUser;
        });
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
  }, [users]);

  // Get recent activity (last 50 actions across all users)
  const recentActivity = relationships
    .flatMap(rel =>
      (rel.actionsHistory || []).map(action => ({
        ...action,
        relationshipId: rel.id,
        relationshipName: rel.name,
        relationshipCompany: rel.company,
        userId: rel.userId,
        userName: users[rel.userId]?.displayName || rel.userId,
        userEmail: users[rel.userId]?.email,
      }))
    )
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 50);

  // Stats
  const stats = {
    totalRelationships: relationships.length,
    totalUsers: Object.keys(users).length,
    actionsToday: recentActivity.filter(a => {
      const today = new Date();
      const actionDate = new Date(a.completedAt);
      return actionDate.toDateString() === today.toDateString();
    }).length,
    strongRelationships: relationships.filter(r => r.strength === 'strong').length,
  };

  const updateRelationship = async (relationshipId: string, updates: Partial<Relationship>) => {
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
    try {
      await deleteDoc(doc(db, 'relationships', relationshipId));
    } catch (err: any) {
      console.error('Error deleting relationship:', err);
      throw err;
    }
  };

  const addNote = async (relationshipId: string, content: string, adminUser: { id: string; displayName: string; email: string; role: string }) => {
    if (!content.trim()) throw new Error('Note content cannot be empty');

    try {
      const relationshipRef = doc(db, 'relationships', relationshipId);
      const relationship = relationships.find(r => r.id === relationshipId);

      if (!relationship) throw new Error('Relationship not found');

      const newNote = {
        id: Date.now().toString(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        createdBy: adminUser.id,
        createdByName: adminUser.displayName || adminUser.email || 'Unknown',
        createdByRole: adminUser.role || 'admin',
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
    users,
    recentActivity,
    stats,
    loading,
    error,
    updateRelationship,
    deleteRelationship,
    addNote,
  };
}
