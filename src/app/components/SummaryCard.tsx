import { Expense } from '../lib/types';

type SummaryCardProps = {
  expenses: Expense[];
  monthlyIncome: number;
};

export default function SummaryCard({ expenses, monthlyIncome }: SummaryCardProps) {
  // Calcular gastos por categoría
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Sin categoría';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total de gastos
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Porcentaje del ingreso usado
  const percentageUsed = monthlyIncome > 0 
    ? Math.min(100, (totalExpenses / monthlyIncome) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Resumen Mensual</h2>
      
      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Uso de presupuesto</span>
          <span className="text-sm font-medium">{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              percentageUsed > 80 ? 'bg-red-500' : 
              percentageUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`} 
            style={{ width: `${percentageUsed}%` }}
          ></div>
        </div>
      </div>

      {/* Desglose por categoría */}
      <div className="space-y-4">
        <h3 className="font-medium">Gastos por categoría</h3>
        {Object.entries(expensesByCategory).map(([category, amount]) => (
          <div key={category} className="flex justify-between">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              <span>{category}</span>
            </div>
            <div>
              <span className="font-medium">${amount.toFixed(2)}</span>
              {monthlyIncome > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({(amount / monthlyIncome * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span>Total Gastos:</span>
          <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Ingresos:</span>
          <span className="font-bold text-green-600">${monthlyIncome.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Balance:</span>
          <span className={monthlyIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${(monthlyIncome - totalExpenses).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}