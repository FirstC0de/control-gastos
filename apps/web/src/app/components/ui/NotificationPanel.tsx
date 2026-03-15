'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useNotifications, type AppNotification, type NotificationType } from '../../context/NotificationContext';

const TYPE_LABELS: Record<NotificationType, string> = {
  budget_exceeded:     'Presupuesto excedido',
  budget_warning:      'Alerta de presupuesto',
  card_due:            'Vencimiento de tarjeta',
  card_closing:        'Cierre de tarjeta',
  no_income:           'Sin ingresos',
  fixed_term_expiring: 'Plazo fijo por vencer',
  fixed_term_expired:  'Plazo fijo vencido',
};

const SEVERITY_STYLES = {
  error:   { dot: 'bg-rose-500',  ring: 'border-l-rose-500',  bg: 'bg-rose-50',   text: 'text-rose-700' },
  warning: { dot: 'bg-amber-400', ring: 'border-l-amber-400', bg: 'bg-amber-50',  text: 'text-amber-700' },
  info:    { dot: 'bg-blue-400',  ring: 'border-l-blue-400',  bg: 'bg-blue-50',   text: 'text-blue-700' },
};

function NotificationItem({ n, isRead }: { n: AppNotification; isRead: boolean }) {
  const { markRead, dismiss } = useNotifications();
  const s = SEVERITY_STYLES[n.severity];

  const content = (
    <div
      className={`border-l-4 ${s.ring} px-4 py-3 ${isRead ? 'bg-white' : s.bg} transition-colors`}
      onClick={() => markRead(n.id)}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${s.dot} ${isRead ? 'opacity-30' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isRead ? 'text-slate-600' : 'text-slate-900'}`}>
            {n.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); e.preventDefault(); dismiss(n.id); }}
          className="shrink-0 p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          title="Descartar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return n.href ? (
    <Link href={n.href} className="block cursor-pointer hover:brightness-[0.97] transition">
      {content}
    </Link>
  ) : (
    <div className="cursor-default">{content}</div>
  );
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, readIds, disabledTypes, markAllRead, toggleType } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const allTypes = Object.keys(TYPE_LABELS) as NotificationType[];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel — desktop: right of sidebar | mobile: below top bar */}
      <div
        ref={panelRef}
        className="fixed top-14 left-0 right-0 z-50 flex flex-col bg-white shadow-2xl border border-slate-200
                   lg:top-0 lg:left-60 lg:right-auto lg:w-80 lg:h-full lg:border-l lg:border-slate-200 lg:border-r-0"
        style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="text-sm font-medium">Todo en orden</p>
              <p className="text-xs text-slate-300">No hay notificaciones activas</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem key={n.id} n={n} isRead={readIds.has(n.id)} />
            ))
          )}
        </div>

        {/* Settings — toggle notification types */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-4 bg-slate-50/80">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Tipos de alertas
          </p>
          <div className="space-y-2">
            {allTypes.map(type => {
              const enabled = !disabledTypes.has(type);
              return (
                <label key={type} className="flex items-center justify-between gap-3 cursor-pointer group">
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                    {TYPE_LABELS[type]}
                  </span>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => toggleType(type)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      enabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
