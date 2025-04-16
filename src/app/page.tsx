'use client';

import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SummaryCard from './components/SummaryCard';
import { useFinance } from './context/FinanceContext';

export default function HomePage() {
  const { 
    expenses, 
    addExpense, 
    updateExpense,
    deleteExpense // Cambiado de handleDelete a deleteExpense
  } = useFinance();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Dashboard 
        />
        
        <ExpenseForm onSubmit={addExpense} />
        
        <ExpenseList 
          expenses={expenses} 
          onUpdate={updateExpense}
          onDelete={deleteExpense} 
          />
      </div>
      
      <div className="lg:col-span-1">
        <SummaryCard/>
      </div>
    </div>
  );
}