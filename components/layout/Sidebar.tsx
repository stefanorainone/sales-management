'use client';

import React, { useState } from 'react';
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
  { name: 'Relazioni', href: '/relazioni', icon: '🤝' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
];

const adminOnlyItems: NavItem[] = [
  { name: 'Admin', href: '/admin', icon: '⚙️' },
];

const adminNavItems: NavItem[] = [
  { name: 'Command Center', href: '/admin/dashboard', icon: '🎯' },
  { name: 'AI Analytics', href: '/admin/ai-analytics', icon: '🤖' },
  { name: 'Activities Admin', href: '/admin/activities', icon: '📊' },
  { name: 'AI Task Manager', href: '/admin/ai-tasks', icon: '🤖' },
  { name: 'Gestione Utenti', href: '/admin/users', icon: '👥' },
  { name: 'AI Config', href: '/admin/ai-config', icon: '🧠' },
];

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Use internal state if no external control is provided
  const menuOpen = setIsMobileMenuOpen ? isMobileMenuOpen : isOpen;
  const setMenuOpen = setIsMobileMenuOpen || setIsOpen;

  // If admin, show seller items + admin items + admin nav items, otherwise just seller items
  const isAdmin = user?.role === 'admin';
  const isAdminPage = pathname.startsWith('/admin');

  // Se siamo in una pagina admin, mostra solo le voci admin
  // Altrimenti mostra le voci seller (anche per admin)
  let navItems = sellerNavItems;
  if (isAdmin) {
    if (isAdminPage) {
      // In modalità admin: mostra SOLO voci admin
      navItems = [...adminNavItems];
    } else {
      // In modalità seller: mostra voci seller + link per passare ad admin
      navItems = [...sellerNavItems, ...adminOnlyItems];
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {menuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
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
            onClick={() => setMenuOpen(false)}
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
              onClick={() => setMenuOpen(false)}
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
        <div className="flex items-center justify-between">
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
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <span className="text-xl">🚪</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
