import NextAuth from "next-auth";
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

  declare module "next-auth" {
    interface User {
      id: string;
      // Agrega otros campos personalizados si los necesitas
      role?: string;
    }
  
    interface Session {
      user: User & {
        id: string;
      };
    }
  }