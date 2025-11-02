import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
