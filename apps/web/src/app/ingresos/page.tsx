'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import IncomesTab from './IncomesTab';
import BudgetsTab from './BudgetsTab';
import AutoSavingTab from './AutoSavingTab';
import AppShell from '../components/AppShell';
import MonthNavigator from '../components/ui/MonthNavigator';

type Tab = 'incomes' | 'budgets' | 'autosaving';

const TAB_CONFIG: { value: Tab; label: string }[] = [
  { value: 'incomes',     label: '💰 Ingresos' },
  { value: 'budgets',     label: '📊 Presupuestos' },
  { value: 'autosaving',  label: '🤖 Ahorro automático' },
];

function FinanceContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('incomes');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'budgets') setActiveTab('budgets');
    if (tab === 'autosaving') setActiveTab('autosaving');
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión Financiera</h1>
            <p className="text-sm text-slate-500 mt-1">Administrá tus ingresos, presupuestos y reglas de ahorro</p>
          </div>
          {activeTab !== 'autosaving' && <MonthNavigator />}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
        {TAB_CONFIG.map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'incomes'    && <IncomesTab />}
      {activeTab === 'budgets'    && <BudgetsTab />}
      {activeTab === 'autosaving' && <AutoSavingTab />}
    </div>
  );
}

export default function FinancePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="h-8" />}>
        <FinanceContent />
      </Suspense>
    </AppShell>
  );
}
