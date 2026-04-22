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
}
