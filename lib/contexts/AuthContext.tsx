'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User as AppUser } from '@/types';

// DEMO MODE: Set to true to bypass Firebase auth for UI testing
const DEMO_MODE = true;

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In DEMO MODE, provide mock user immediately
  if (DEMO_MODE) {
    const mockUser: AppUser = {
      id: 'demo-user-123',
      email: 'admin@vr.com',
      displayName: 'Admin VR',
      role: 'admin', // Changed to admin for testing admin dashboard
      team: 'Management',
      createdAt: new Date(),
    };

    return (
      <AuthContext.Provider
        value={{
          user: mockUser,
          loading: false,
          signIn: async () => {
            console.log('DEMO MODE: signIn called');
          },
          signUp: async () => {
            console.log('DEMO MODE: signUp called');
          },
          signOut: async () => {
            console.log('DEMO MODE: signOut called');
          },
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  // Normal Firebase auth flow
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as AppUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<AppUser>
  ) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const newUser: AppUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: userData.displayName || '',
      role: userData.role || 'seller',
      team: userData.team || 'default',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUser(newUser);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
