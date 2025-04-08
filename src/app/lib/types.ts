export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  };
  
  export type Income = {
    id: string;
    amount: number;
    month: string; // Formato "YYYY-MM"
  };