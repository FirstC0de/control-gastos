import { useEffect, useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { AutoSavingRule, Income } from '@controlados/shared';

export interface RecurringSuggestion {
  income: Income;
  rule: AutoSavingRule;
  savingName: string;
}

const DEBUG_DATE = process.env.NEXT_PUBLIC_DEBUG_DATE;

function getLsKey(monthKey: string, ruleId: string, incomeId: string) {
  // In debug mode use a separate namespace so testing never pollutes real data
  const prefix = DEBUG_DATE ? `autoSaving_debug_${DEBUG_DATE}` : 'autoSaving';
  return `${prefix}_${monthKey}_${ruleId}_${incomeId}`;
}

function getNow() {
  const debugDate = process.env.NEXT_PUBLIC_DEBUG_DATE;
  return debugDate ? new Date(debugDate) : new Date();
}

function getCurrentMonthKey() {
  const now = getNow();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useRecurringAutoSaving() {
  const { monthlyIncomes, autoSavingRules, savings, applyAutoSaving } = useFinance();
  const [queue, setQueue] = useState<RecurringSuggestion[]>([]);
  // Only build the queue once per session (when data first loads)
  const checked = useRef(false);

  useEffect(() => {
    // Wait until we have actual data loaded
    if (checked.current) return;
    if (monthlyIncomes.length === 0 && autoSavingRules.length === 0) return;

    checked.current = true;

    const now = getNow();
    const today = now.getDate();
    const monthKey = getCurrentMonthKey();

    const pending: RecurringSuggestion[] = [];

    for (const income of monthlyIncomes) {
      if (!income.recurring) continue;

      // Only trigger when the recurring day has arrived this month
      const recurringDay = income.recurringDay
        ?? new Date(income.date + 'T12:00:00').getDate();
      if (today < recurringDay) continue;

      // Find a matching active rule that shows the toast (askEveryTime = true)
      const rule = autoSavingRules.find(
        r => r.isActive && r.askEveryTime && r.categoryId === income.categoryId
      );
      if (!rule) continue;

      // Skip if already prompted this month
      if (localStorage.getItem(getLsKey(monthKey, rule.id, income.id))) continue;

      const saving = savings.find(s => s.id === rule.targetSavingId);
      pending.push({
        income,
        rule,
        savingName: saving?.name ?? rule.targetSavingName ?? 'Cuenta de ahorro',
      });
    }

    if (pending.length > 0) {
      // Mark as shown immediately so that navigating between pages doesn't re-trigger the same toast
      for (const item of pending) {
        localStorage.setItem(getLsKey(monthKey, item.rule.id, item.income.id), '1');
      }
      setQueue(pending);
    }
  }, [monthlyIncomes, autoSavingRules, savings]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = queue[0] ?? null;

  const accept = async () => {
    if (!current) return;
    const monthKey = getCurrentMonthKey();
    localStorage.setItem(getLsKey(monthKey, current.rule.id, current.income.id), '1');
    await applyAutoSaving(current.income, current.rule, 'accepted');
    setQueue(prev => prev.slice(1));
  };

  const decline = () => {
    if (!current) return;
    const monthKey = getCurrentMonthKey();
    localStorage.setItem(getLsKey(monthKey, current.rule.id, current.income.id), '1');
    applyAutoSaving(current.income, current.rule, 'declined').catch(console.error);
    setQueue(prev => prev.slice(1));
  };

  return { current, accept, decline, total: queue.length };
}
