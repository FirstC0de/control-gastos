'use client';

import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SummaryCard from './components/SummaryCard';
import { useFinance } from './context/FinanceContext';

export default function HomePage() {
  const { 
    expenses, 
    monthlyIncome, 
    addExpense, 
    updateExpense,
    handleDelete
  } = useFinance();

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balance = monthlyIncome - totalExpenses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Dashboard 
          balance={balance}
          monthlyIncome={monthlyIncome}
          totalExpenses={totalExpenses}
        />
        
        <ExpenseForm onSubmit={addExpense} />
        
        <ExpenseList 
          expenses={expenses} 
          onUpdate={updateExpense}
          onDelete={handleDelete} 
          />
      </div>
      
      <div className="lg:col-span-1">
        <SummaryCard 
          expenses={expenses}
          monthlyIncome={monthlyIncome}
        />
      </div>
    </div>
  );
}