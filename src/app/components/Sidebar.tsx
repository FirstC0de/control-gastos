'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type NavItem = { href: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/ingresos',
    label: 'Finanzas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    href: '/metricas',
    label: 'Métricas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

function SidebarInner({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <Link href="/dashboard" onClick={onLinkClick} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-500 transition-colors">
            <span className="text-white font-bold text-sm">$</span>
          </div>
          <div className="leading-none">
            <span className="text-white font-bold text-sm tracking-tight">Controlados</span>
            <span className="text-blue-400 font-bold text-sm"> $</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Menú</p>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-700/60 space-y-1">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-slate-800/60 mb-2">
            <p className="text-xs text-slate-600 mb-0.5">Sesión activa</p>
            <p className="text-sm text-slate-200 font-medium truncate">
              {user.displayName || user.email}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <svg className="w-5 h-5 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 fixed top-0 left-0 h-full z-40 border-r border-slate-700/50">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700/50 h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">$</span>
          </div>
          <span className="text-white font-bold text-sm">
            Controlados <span className="text-blue-400">$</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 border-r border-slate-700/50 animate-slide-in-left">
            <div className="h-14 flex items-center px-5 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">$</span>
                </div>
                <span className="text-white font-bold text-sm">Controlados <span className="text-blue-400">$</span></span>
              </div>
            </div>
            <div className="h-[calc(100%-3.5rem)]">
              <SidebarInner onLinkClick={() => setMobileOpen(false)} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
