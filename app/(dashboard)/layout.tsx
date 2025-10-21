import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AIChatWidget } from '@/components/ai/AIChatWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="p-8">{children}</main>
        </div>
        <AIChatWidget />
      </div>
    </ProtectedRoute>
  );
}
