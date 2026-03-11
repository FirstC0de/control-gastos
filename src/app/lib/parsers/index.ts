export type { ParsedExpense, ImportSummary } from './types';

import { ImportSummary } from './types';
import { parseGaliciaVisa, parseGaliciaMaster } from './galicia';
import { parseSantander } from './santander';

export const detectBank = (text: string): 'galicia-visa' | 'galicia-master' | 'santander' | 'unknown' => {
    const t = text.toLowerCase();
    if (t.includes('santander')) return 'santander';
    if (t.includes('galicia')) {
        return (t.includes('cuota del mes') || t.includes('detalle del consumo') && t.includes('subtotal'))
            ? 'galicia-master'
            : 'galicia-visa';
    }
    return 'unknown';
};

export const parseStatement = (text: string): ImportSummary | null => {
    const bank = detectBank(text);

    switch (bank) {
        case 'galicia-visa':   return parseGaliciaVisa(text);
        case 'galicia-master': return parseGaliciaMaster(text);
        case 'santander': {
            const cardType = /american express|amex/i.test(text) ? 'American Express' : 'Visa';
            return parseSantander(text, cardType);
        }
        default: return null;
    }
};
