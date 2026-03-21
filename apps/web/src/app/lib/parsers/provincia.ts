import { ImportSummary, ParsedExpense } from './types';
import { parseAmount, cleanDesc } from './helpers';

const monthMap: Record<string, string> = {
    ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
    jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
};

// DD.MM.YY → 20YY-MM-DD
const parseProvinciaDate = (raw: string): string => {
    const [day, month, year] = raw.split('.');
    return `20${year}-${month}-${day}`;
};

// "09 Dic 21" → "2021-12-09"
const parseProvinciaHeaderDate = (raw: string): string | undefined => {
    const m = raw.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/);
    if (!m) return undefined;
    const month = monthMap[m[2].toLowerCase()];
    if (!month) return undefined;
    return `20${m[3]}-${month}-${m[1].padStart(2, '0')}`;
};

// "Cuota 02/12" dentro de la descripción
const cuotaRe = /\s+Cuota\s+(\d{1,2})\/(\d{1,2})/i;

// Con comprobante: DD.MM.YY  NNNNNN*  DESC  MONTO_ARS  [MONTO_USD]
const txWithComp = /^(\d{2}\.\d{2}\.\d{2})\s+(\d{5,6})\*\s+(.+?)\s{2,}([\d.,]+)(?:\s+([\d.,]+))?$/;
// Sin comprobante:  DD.MM.YY  DESC  MONTO_ARS  [MONTO_USD]
const txNoComp   = /^(\d{2}\.\d{2}\.\d{2})\s+(.+?)\s{2,}([\d.,]+)(?:\s+([\d.,]+))?$/;

export const parseProvincia = (text: string): ImportSummary => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: ParsedExpense[] = [];
    let period = '';
    let closingDate: string | undefined;
    let dueDate: string | undefined;

    // ── Fechas de cierre y vencimiento ───────────────────────────────────────
    for (const line of lines) {
        if (!closingDate) {
            const m = line.match(/CIERRE\s+ACTUAL[:\s]+(\d{1,2}\s+[A-Za-z]{3}\s+\d{2})/i);
            if (m) { closingDate = parseProvinciaHeaderDate(m[1]); period = line; }
        }
        if (!dueDate) {
            // "PERIODO VTO: 30 Dic 21" o "VTO. 10 Dic 21"
            const m = line.match(/PERIODO\s+VTO[.:]?\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{2})/i)
                   ?? line.match(/(?<!\w)VTO[.\s:]+(\d{1,2}\s+[A-Za-z]{3}\s+\d{2})/i);
            if (m) dueDate = parseProvinciaHeaderDate(m[1]);
        }
        if (closingDate && dueDate) break;
    }

    // ── Parsear transacciones ─────────────────────────────────────────────────
    let inDetalle = false;
    let pastTotal = false;

    for (const line of lines) {
        if (/DESCRIPCION\s+DE\s+LA\s+OPERACION/i.test(line)) { inDetalle = true; continue; }
        if (/CARGO\s+ACTUAL|^TOTALES?\b/i.test(line))         { pastTotal = true; continue; }
        if (!inDetalle || pastTotal) continue;

        // Ignorar líneas de cabecera / saldo / pago
        if (/^(FECHA|SALDO ANTERIOR|SU PAGO|CIERRE SEMANAL|IMPORTE|DOLARES)/i.test(line)) continue;

        const pushItem = (
            rawDate: string,
            rawDesc: string,
            arsStr: string,
            usdStr: string | undefined,
            comprobante?: string,
        ) => {
            const cuota = cuotaRe.exec(rawDesc);
            const desc  = cuota ? rawDesc.replace(cuotaRe, '').trim() : rawDesc.trim();
            const installments       = cuota ? parseInt(cuota[2]) : 1;
            const currentInstallment = cuota ? parseInt(cuota[1]) : 1;

            const arsAmt = parseAmount(arsStr);
            const usdAmt = usdStr ? parseAmount(usdStr) : 0;
            // USD: la columna pesos es 0 y hay valor en dólares
            const isUSD  = usdAmt > 0 && arsAmt === 0;
            const amount = isUSD ? usdAmt : arsAmt;
            if (amount <= 0) return;

            items.push({
                date: parseProvinciaDate(rawDate),
                description: cleanDesc(desc),
                amount,
                installments,
                currentInstallment,
                installmentAmount: amount,
                comprobante,
                currency: isUSD ? 'USD' : 'ARS',
                selected: true,
            });
        };

        let m = txWithComp.exec(line);
        if (m) { pushItem(m[1], m[3], m[4], m[5], m[2]); continue; }

        m = txNoComp.exec(line);
        if (m) { pushItem(m[1], m[2], m[3], m[4]); }
    }

    const totalARS = items.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
    const totalUSD = items.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);
    return { bank: 'Banco Provincia', cardType: 'Visa', period, totalARS, totalUSD, items, closingDate, dueDate };
};
