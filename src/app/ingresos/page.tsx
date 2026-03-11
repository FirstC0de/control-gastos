'use client';

import { useState } from 'react';
import IncomesTab from './IncomesTab';
import BudgetsTab from './BudgetsTab';
import AppShell from '../components/AppShell';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'incomes' | 'budgets'>('incomes');

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión Financiera</h1>
          <p className="text-sm text-slate-500 mt-1">Administrá tus ingresos y presupuestos</p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
          {(['incomes', 'budgets'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab === 'incomes' ? '💰 Ingresos' : '📊 Presupuestos'}
            </button>
          ))}
        </div>

        {activeTab === 'incomes' && <IncomesTab />}
        {activeTab === 'budgets' && <BudgetsTab />}
      </div>
    </AppShell>
  );
}
