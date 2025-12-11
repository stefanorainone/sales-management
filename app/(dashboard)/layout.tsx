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
        <div className="flex-1 lg:ml-64 min-w-0">
          <main className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-full overflow-x-hidden">{children}</main>
        </div>
        <AIChatWidget />
      </div>
    </ProtectedRoute>
  );
}
