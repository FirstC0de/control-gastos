import { ImportSummary, ParsedExpense } from './types';
import { parseAmount, cleanDesc } from './helpers';

const MONTH_MAP: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'setiembre': '09', 'octubre': '10',
    'noviembre': '11', 'diciembre': '12',
    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'sep': '09', 'set': '09', 'oct': '10', 'nov': '11', 'dic': '12',
    'enero.': '01', 'febrero.': '02', 'marzo.': '03', 'abril.': '04',
    'mayo.': '05', 'junio.': '06', 'julio.': '07', 'agosto.': '08',
    'setiem.': '09', 'noviem.': '11', 'diciem.': '12', 'octubre.': '10',
};

// Formato Santander: DD MES  NN COMPROBANTE * DESCRIPCION  [C.XX/XX]  MONTO
// NN = primeros 2 dígitos del comprobante (pdf.js los separa como item independiente)
const lineWithDate = /^(\d{1,2})\s+([A-Za-záéíóúñÁÉÍÓÚÑ]+\.?)\s+\d{1,2}\s+(\d{5,})\s+[*K]\s+(.+?)\s{2,}(?:C\.(\d{2}\/\d{2})\s+)?([\d.,]+,\d{2})(?:\s+([\d.,]+,\d{2}))?$/;
const lineNoDate  = /^(\d{1,2})\s+(\d{5,})\s+[*K]\s+(.+?)\s{2,}(?:C\.(\d{2}\/\d{2})\s+)?([\d.,]+,\d{2})(?:\s+([\d.,]+,\d{2}))?$/;
const lineUSD     = /^(\d{1,2})\s+([A-Za-záéíóúñÁÉÍÓÚÑ]+\.?)\s+\d{1,2}\s+(\w+)\s+[EK*]\s+(.+?)\s+USD\s+([\d.,]+)\s+([\d.,]+)$/;

export const parseSantander = (text: string, cardType: 'Visa' | 'American Express'): ImportSummary => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: ParsedExpense[] = [];
    let period = '';
    let lastDate = '';
    let inDetalle = false;

    // ── Detectar año y mes del resumen ───────────────────────────────────────
    // El año base es el del cierre del resumen. Si no se encuentra, usamos hoy.
    let statementYear  = new Date().getFullYear();
    let statementMonth = new Date().getMonth() + 1; // 1-12

    for (const line of lines) {
        // Línea de cierre: "1854 LONGCHAMPS  CIERRE  26  Feb  26  VENCIMIENTO 09 Mar 26"
        // El año aparece como 2 dígitos después del mes (ej: "Feb 26" = Feb 2026)
        const cierreMatch = line.match(/CIERRE\s+\d{1,2}\s+([A-Za-z]+)\s+(\d{2})\s+VENCIMIENTO/i);
        if (cierreMatch) {
            const monthStr = cierreMatch[1].toLowerCase();
            const monthNum = MONTH_MAP[monthStr];
            if (monthNum) {
                statementMonth = parseInt(monthNum);
                statementYear  = 2000 + parseInt(cierreMatch[2]);
                period = line;
                break; // con uno alcanza
            }
        }
    }

    // Fallback: línea de vencimiento con formato DD/MM/YYYY
    if (!period) {
        for (const line of lines) {
            if (/período|vencimiento/i.test(line)) {
                const dm = line.match(/(\d{2})\/(\d{2})\/(20\d{2})/);
                if (dm) {
                    statementMonth = parseInt(dm[2]);
                    statementYear  = parseInt(dm[3]);
                    period = line;
                    break;
                }
            }
        }
    }

    // ── Calcular año de una transacción ──────────────────────────────────────
    // Para cuotas: la cuota `cur` cae en el mes de cierre → la cuota 1 (compra)
    // fue (cur-1) meses antes → calculamos el año exacto sin depender de heurísticas.
    // Para contado: rollover simple (si el mes de la tx es posterior al cierre, año anterior).
    const yearForCuota = (txMonthStr: string, cur: number): number => {
        // cuota `cur` cae en statementMonth/statementYear
        // cuota 1 (compra) = statementYear*12 + statementMonth - cur meses
        const purchaseMonthAbs = statementYear * 12 + (statementMonth - 1) - (cur - 1);
        const calcYear  = Math.floor(purchaseMonthAbs / 12);
        const calcMonth = (purchaseMonthAbs % 12) + 1; // 1-indexed
        const txMonth   = parseInt(txMonthStr);
        // Si el mes calculado coincide con el mes de la línea, el año es exacto
        if (calcMonth === txMonth) return calcYear;
        // Si difiere en 1 (billing empieza el mes siguiente a la compra), ajustar
        const adjMonthAbs = purchaseMonthAbs - 1;
        const adjMonth = (adjMonthAbs % 12) + 1;
        if (adjMonth === txMonth) return Math.floor(adjMonthAbs / 12);
        // Fallback: rollover simple
        return txMonth > statementMonth ? statementYear - 1 : statementYear;
    };

    const yearForContado = (txMonthStr: string): number => {
        const txMonth = parseInt(txMonthStr);
        return txMonth > statementMonth ? statementYear - 1 : statementYear;
    };

    // ── Parsear transacciones ─────────────────────────────────────────────────
    for (const line of lines) {
        if (/SALDO ANTERIOR|SALDO ACTUAL|PAGO\s+MINIMO|EL PRESENTE|IMPUESTO|DB\.RG|PLAN V EN|Tarjeta.*Total/i.test(line)) continue;
        if (/SU\s+PAGO\s+EN\s+PESOS/i.test(line)) continue;
        if (/^(FECHA|COMPROBANTE|REFERENCIA)/i.test(line)) { inDetalle = true; continue; }
        if (!inDetalle) continue;

        // USD explícito
        const usdMatch = lineUSD.exec(line);
        if (usdMatch) {
            const [, day, monthStr, comprobante, desc, , usdAmount] = usdMatch;
            const month = MONTH_MAP[monthStr.toLowerCase()];
            if (month) lastDate = `${yearForContado(month)}-${month}-${day.padStart(2, '0')}`;
            const amount = parseAmount(usdAmount);
            if (amount) {
                items.push({
                    date: lastDate || new Date().toISOString().split('T')[0],
                    description: cleanDesc(desc),
                    amount,
                    installments: 1,
                    currentInstallment: 1,
                    installmentAmount: amount,
                    comprobante,
                    currency: 'USD',
                    selected: true,
                });
            }
            continue;
        }

        // Línea con fecha
        let match = lineWithDate.exec(line);
        if (match) {
            const [, day, monthStr, comprobante, desc, cuota, amountStr, usdStr] = match;
            const month = MONTH_MAP[monthStr.toLowerCase()];
            if (month) {
                let txYear: number;
                if (cuota) {
                    const cur = parseInt(cuota.split('/')[0]);
                    txYear = yearForCuota(month, cur);
                } else {
                    txYear = yearForContado(month);
                }
                lastDate = `${txYear}-${month}-${day.padStart(2, '0')}`;
            }
            const amount = parseAmount(amountStr);
            if (!amount) continue;
            let installments = 1, currentInstallment = 1;
            if (cuota) {
                const [cur, tot] = cuota.split('/').map(Number);
                installments = tot; currentInstallment = cur;
            }
            items.push({
                date: lastDate,
                description: cleanDesc(desc),
                amount,
                installments,
                currentInstallment,
                installmentAmount: amount,
                comprobante,
                currency: usdStr && parseAmount(usdStr) > 0 ? 'USD' : 'ARS',
                selected: true,
            });
            continue;
        }

        // Línea sin fecha (mismo día que la anterior)
        match = lineNoDate.exec(line);
        if (match && lastDate) {
            const [, , comprobante, desc, cuota, amountStr, usdStr] = match;
            const amount = parseAmount(amountStr);
            if (!amount) continue;
            let installments = 1, currentInstallment = 1;
            if (cuota) {
                const [cur, tot] = cuota.split('/').map(Number);
                installments = tot; currentInstallment = cur;
            }
            // Para líneas sin fecha, heredamos lastDate (el año ya fue calculado correctamente)
            items.push({
                date: lastDate,
                description: cleanDesc(desc),
                amount,
                installments,
                currentInstallment,
                installmentAmount: amount,
                comprobante,
                currency: usdStr && parseAmount(usdStr) > 0 ? 'USD' : 'ARS',
                selected: true,
            });
        }
    }

    const totalARS = items.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
    const totalUSD = items.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);

    console.group('🏦 [Santander Parser] Resultado');
    console.log(`📅 statementYear: ${statementYear}, statementMonth: ${statementMonth}`);
    items.forEach((it, i) => console.log(`  [${i}] "${it.description}" | date: ${it.date} | cuota: ${it.currentInstallment}/${it.installments}`));
    console.groupEnd();

    return { bank: 'Santander', cardType, period, totalARS, totalUSD, items };
};
