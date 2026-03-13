'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useFinance } from './FinanceContext';

export type NotificationType =
  | 'budget_exceeded'
  | 'budget_warning'
  | 'card_due'
  | 'card_closing'
  | 'no_income';

export type NotificationSeverity = 'error' | 'warning' | 'info';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  href?: string;
};

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  readIds: Set<string>;
  disabledTypes: Set<NotificationType>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  toggleType: (type: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LS_READ = 'ctrl$_notif_read';
const LS_DISMISSED = 'ctrl$_notif_dismissed';
const LS_DISABLED = 'ctrl$_notif_disabled';

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { getBudgetStatus, cards, monthlyIncomes, selectedMonth } = useFinance();

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [disabledTypes, setDisabledTypes] = useState<Set<NotificationType>>(new Set());

  useEffect(() => {
    setReadIds(loadSet(LS_READ));
    setDismissedIds(loadSet(LS_DISMISSED));
    setDisabledTypes(loadSet(LS_DISABLED) as Set<NotificationType>);
  }, []);

  const allNotifications = useMemo((): AppNotification[] => {
    const result: AppNotification[] = [];
    const now = new Date();
    const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

    // Budget notifications
    for (const s of getBudgetStatus()) {
      if (s.status === 'exceeded') {
        result.push({
          id: `budget_exceeded_${s.budget.id}_${monthKey}`,
          type: 'budget_exceeded',
          title: 'Presupuesto excedido',
          message: `"${s.budget.name}" superó el límite en $${(s.spentAmount - s.budgetAmount).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
          severity: 'error',
          href: '/ingresos?tab=budgets',
        });
      } else if (s.status === 'warning') {
        result.push({
          id: `budget_warning_${s.budget.id}_${monthKey}`,
          type: 'budget_warning',
          title: 'Presupuesto al límite',
          message: `"${s.budget.name}" usó el ${s.percentageUsed.toFixed(0)}% del presupuesto`,
          severity: 'warning',
          href: '/ingresos?tab=budgets',
        });
      }
    }

    // Card closing / due date notifications
    const todayDay = now.getDate();
    const cardKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const card of cards) {
      if (card.closingDay >= todayDay && card.closingDay - todayDay <= 3) {
        const diff = card.closingDay - todayDay;
        result.push({
          id: `card_closing_${card.id}_${cardKey}`,
          type: 'card_closing',
          title: 'Cierre de tarjeta próximo',
          message: `${card.name} cierra el día ${card.closingDay}${diff === 0 ? ' (hoy)' : ` (en ${diff} día${diff !== 1 ? 's' : ''})`}`,
          severity: 'info',
        });
      }
      if (card.dueDay >= todayDay && card.dueDay - todayDay <= 3) {
        const diff = card.dueDay - todayDay;
        result.push({
          id: `card_due_${card.id}_${cardKey}`,
          type: 'card_due',
          title: 'Vencimiento de tarjeta próximo',
          message: `${card.name} vence el día ${card.dueDay}${diff === 0 ? ' (hoy)' : ` (en ${diff} día${diff !== 1 ? 's' : ''})`}`,
          severity: 'warning',
        });
      }
    }

    // No income registered this month
    if (monthlyIncomes.length === 0) {
      result.push({
        id: `no_income_${monthKey}`,
        type: 'no_income',
        title: 'Sin ingresos registrados',
        message: `No hay ingresos cargados para ${monthKey}`,
        severity: 'info',
        href: '/ingresos',
      });
    }

    return result;
  }, [getBudgetStatus, cards, monthlyIncomes, selectedMonth]);

  const notifications = useMemo(
    () => allNotifications.filter(n => !dismissedIds.has(n.id) && !disabledTypes.has(n.type)),
    [allNotifications, dismissedIds, disabledTypes],
  );

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSet(LS_READ, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      saveSet(LS_READ, next);
      return next;
    });
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSet(LS_DISMISSED, next);
      return next;
    });
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSet(LS_READ, next);
      return next;
    });
  }, []);

  const toggleType = useCallback((type: NotificationType) => {
    setDisabledTypes(prev => {
      const next = new Set(prev) as Set<NotificationType>;
      if (next.has(type)) next.delete(type);
      else next.add(type);
      saveSet(LS_DISABLED, next);
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, readIds, disabledTypes, markRead, markAllRead, dismiss, toggleType }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
