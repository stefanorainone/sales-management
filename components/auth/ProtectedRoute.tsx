'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

// DEMO MODE: Set to true to bypass Firebase auth for UI testing
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // In DEMO MODE, just render children without auth checks
  if (DEMO_MODE) {
    return <>{children}</>;
  }

  // Normal auth flow
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
