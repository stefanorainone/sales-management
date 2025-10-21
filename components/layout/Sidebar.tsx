'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const sellerNavItems: NavItem[] = [
  { name: 'I Miei Task', href: '/today', icon: '🎯' },
  { name: 'Clienti', href: '/clients', icon: '👥' },
  { name: 'Attività', href: '/activities', icon: '✅' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Training', href: '/training', icon: '🎓' },
];

const adminOnlyItems: NavItem[] = [
  { name: 'Admin', href: '/admin', icon: '⚙️' },
];

const adminNavItems: NavItem[] = [
  { name: 'Command Center', href: '/admin/dashboard', icon: '🎯' },
  { name: 'Gestione Task', href: '/admin/tasks', icon: '📋' },
  { name: 'AI Config', href: '/admin/ai-config', icon: '🧠' },
];

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // If admin, show seller items + admin items + admin nav items, otherwise just seller items
  const isAdmin = user?.role === 'admin';
  const isAdminPage = pathname.startsWith('/admin');

  // Se siamo in una pagina admin, mostra solo le voci admin
  // Altrimenti mostra le voci seller (anche per admin)
  let navItems = sellerNavItems;
  if (isAdmin) {
    if (isAdminPage) {
      navItems = [...adminNavItems];
    } else {
      navItems = [...sellerNavItems, ...adminOnlyItems];
    }
  }

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Sales CRM</h1>
        <p className="text-xs text-gray-400 mt-1">AI-Powered</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {/* Mostra link per tornare alle vendite se siamo in admin */}
        {isAdmin && isAdminPage && (
          <Link
            href="/today"
            className="flex items-center px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white mb-4 border-b border-gray-700 pb-4"
          >
            <span className="text-xl mr-3">←</span>
            <span className="font-medium">Torna a Vendite</span>
          </Link>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {user?.displayName
              .split(' ')
              .map((n) => n[0])
              .join('') || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-400">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'team_leader' ? 'Team Leader' : 'Venditore'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
