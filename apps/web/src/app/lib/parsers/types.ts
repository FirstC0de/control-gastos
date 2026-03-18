export interface ParsedExpense {
    date: string;
    description: string;
    amount: number;
    installments: number;
    currentInstallment: number;
    installmentAmount: number;
    comprobante?: string;
    currency: 'ARS' | 'USD';
    selected: boolean;
    duplicate?: boolean;
}

export interface ImportSummary {
    bank: string;
    cardType: string;
    period: string;
    totalARS: number;
    totalUSD: number;
    items: ParsedExpense[];
    /** Fecha real de cierre extraída del encabezado del resumen ("YYYY-MM-DD") */
    closingDate?: string;
    /** Fecha de vencimiento extraída del encabezado del resumen ("YYYY-MM-DD") */
    dueDate?: string;
}
