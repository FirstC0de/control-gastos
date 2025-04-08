type DashboardProps = {
    balance: number;
    monthlyIncome: number;
    totalExpenses: number;
  };
  
  export default function Dashboard({ balance, monthlyIncome, totalExpenses }: DashboardProps) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500">Ingresos</h3>
          <p className="text-2xl font-bold text-green-600">${monthlyIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500">Gastos</h3>
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg shadow ${
          balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-medium">Balance</h3>
          <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
        </div>
      </div>
    );
  }