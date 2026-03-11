'use client';

import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SummaryCard from './components/SummaryCard';

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Dashboard />
        <ExpenseForm />
        <ExpenseList />
      </div>
      <div className="lg:col-span-1">
        <SummaryCard />
      </div>
    </div>
  );
}