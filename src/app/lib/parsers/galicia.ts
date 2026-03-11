import { ImportSummary, ParsedExpense } from './types';
import { parseAmount, cleanDesc } from './helpers';

const formatGaliciaDate = (raw: string): string => {
    const [day, month, year] = raw.split('-');
    return `20${year}-${month}-${day}`;
};

// Formato: DD-MM-YY  *  DESCRIPCION  [CC/TT]  COMPROBANTE  MONTO  [USD]
export const parseGaliciaVisa = (text: string): ImportSummary => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: ParsedExpense[] = [];
    let inDetalle = false;
    let period = '';

    for (const line of lines) {
        if (line.match(/\d{2}-\w+-\d{2}/)) { period = line; break; }
    }

    const txRegex = /^(\d{2}-\d{2}-\d{2})\s+[*K]\s+(.+?)\s{2,}(\d{2}\/\d{2})\s+(\d{5,})\s+([\d.,]+)(?:\s+([\d.,]+))?$/;
    const txRegexNoInst = /^(\d{2}-\d{2}-\d{2})\s+[*K]\s+(.+?)\s{2,}(\d{5,})\s+([\d.,]+)(?:\s+([\d.,]+))?$/;

    for (const line of lines) {
        if (line.includes('DETALLE DEL CONSUMO')) { inDetalle = true; continue; }
        if (!inDetalle) continue;
        if (/^(FECHA|CONSOLIDADO|SALDO|TASAS|PAGO|LÍMITE|TOTAL)/i.test(line)) continue;

        let match = txRegex.exec(line);
        if (match) {
            const [, rawDate, desc, cuota, comprobante, amountStr, usdStr] = match;
            const usdAmount = usdStr ? parseAmount(usdStr) : 0;
            const isUSD = usdAmount > 0;
            const amount = isUSD ? usdAmount : parseAmount(amountStr);
            if (!amount) continue;
            const [cur, tot] = cuota.split('/').map(Number);
            items.push({
                date: formatGaliciaDate(rawDate),
                description: cleanDesc(desc),
                amount,
                installments: tot,
                currentInstallment: cur,
                installmentAmount: amount,
                comprobante,
                currency: isUSD ? 'USD' : 'ARS',
                selected: true,
            });
            continue;
        }

        match = txRegexNoInst.exec(line);
        if (match) {
            const [, rawDate, desc, comprobante, amountStr, usdStr] = match;
            const usdAmount = usdStr ? parseAmount(usdStr) : 0;
            const isUSD = usdAmount > 0;
            const amount = isUSD ? usdAmount : parseAmount(amountStr);
            if (!amount) continue;
            items.push({
                date: formatGaliciaDate(rawDate),
                description: cleanDesc(desc),
                amount,
                installments: 1,
                currentInstallment: 1,
                installmentAmount: amount,
                comprobante,
                currency: isUSD ? 'USD' : 'ARS',
                selected: true,
            });
        }
    }

    const totalARS = items.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
    const totalUSD = items.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);
    return { bank: 'Banco Galicia', cardType: 'Visa', period, totalARS, totalUSD, items };
};

// Dos secciones: "DETALLE DEL CONSUMO" (contado) y "CUOTA DEL MES" (cuotas)
export const parseGaliciaMaster = (text: string): ImportSummary => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: ParsedExpense[] = [];
    let section: 'none' | 'contado' | 'cuotas' = 'none';
    let period = '';

    for (const line of lines) {
        if (line.match(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i)) {
            period = line; break;
        }
    }

    const monthMap: Record<string, string> = {
        ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
        jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
    };

    const parseMasterDate = (raw: string): string => {
        const m = raw.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
        if (!m) return new Date().toISOString().split('T')[0];
        const month = monthMap[m[2].toLowerCase()] || '01';
        return `20${m[3]}-${month}-${m[1]}`;
    };

    const contadoRegex = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s{2,}(\d{4,})\s+([\d.,]+)(?:\s+([\d.,]+))?$/;
    const cuotaRegex = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+(\d{2}\/\d{2})\s+(\d{4,})\s+([\d.,]+)(?:\s+([\d.,]+))?$/;

    for (const line of lines) {
        if (/DETALLE DEL CONSUMO/i.test(line)) { section = 'contado'; continue; }
        if (/CUOTA DEL MES/i.test(line)) { section = 'cuotas'; continue; }
        if (/SUBTOTAL|TOTAL A PAGAR|CUOTAS A VENCER/i.test(line)) { section = 'none'; continue; }
        if (section === 'none') continue;
        if (/^(FECHA|REFERENCIA|COMPROBANTE|PESOS|DÓLARES)/i.test(line)) continue;

        if (section === 'cuotas') {
            const match = cuotaRegex.exec(line);
            if (match) {
                const [, rawDate, desc, cuota, comprobante, amountStr] = match;
                const isUSD = /USD/i.test(desc);
                const amount = parseAmount(amountStr);
                if (!amount) continue;
                const [cur, tot] = cuota.split('/').map(Number);
                items.push({
                    date: parseMasterDate(rawDate),
                    description: cleanDesc(desc),
                    amount,
                    installments: tot,
                    currentInstallment: cur,
                    installmentAmount: amount,
                    comprobante,
                    currency: isUSD ? 'USD' : 'ARS',
                    selected: true,
                });
            }
            continue;
        }

        if (section === 'contado') {
            const match = contadoRegex.exec(line);
            if (match) {
                const [, rawDate, desc, comprobante, amountStr] = match;
                // USD: la descripción contiene "USD" y la columna PESOS está vacía
                const isUSD = /USD/i.test(desc);
                const amount = parseAmount(amountStr);
                if (!amount) continue;
                items.push({
                    date: parseMasterDate(rawDate),
                    description: cleanDesc(desc),
                    amount,
                    installments: 1,
                    currentInstallment: 1,
                    installmentAmount: amount,
                    comprobante,
                    currency: isUSD ? 'USD' : 'ARS',
                    selected: true,
                });
            }
        }
    }

    const totalARS = items.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
    const totalUSD = items.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);
    return { bank: 'Banco Galicia', cardType: 'Mastercard', period, totalARS, totalUSD, items };
};
