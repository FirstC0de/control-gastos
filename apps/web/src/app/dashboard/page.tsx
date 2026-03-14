'use client';

import AppShell from '../components/AppShell';
import Dashboard from '../components/Dashboard';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import SummaryCard from '../components/SummaryCard';
import CardSummaryPDF from '../components/cards/CardSummaryPDF';
import SavingsDashboardWidget from '../components/savings/SavingsDashboardWidget';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <Dashboard />
          <ExpenseForm />
          <ExpenseList />
        </div>
        <div className="xl:col-span-1 space-y-6 min-w-0">
          <SummaryCard />
          <SavingsDashboardWidget />
          <CardSummaryPDF />
        </div>
      </div>
    </AppShell>
  );
}
