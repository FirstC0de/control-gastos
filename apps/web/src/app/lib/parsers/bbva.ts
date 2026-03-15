import { ImportSummary, ParsedExpense } from './types';
import { parseAmount, cleanDesc } from './helpers';

const monthMap: Record<string, string> = {
    ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
    jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
};

const parseBBVADate = (raw: string): string => {
    const m = raw.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
    if (!m) return new Date().toISOString().split('T')[0];
    const month = monthMap[m[2].toLowerCase()] ?? '01';
    return `20${m[3]}-${month}-${m[1]}`;
};

// El PDF de BBVA extrae cada fila en DOS líneas:
//   Línea 1: DD-MMM-YY  DESCRIPCIÓN [C.XX/YY]  CUPÓN
//   Línea 2: MONTO_PESOS [MONTO_USD]
// Excepción: gastos en USD suelen venir en una sola línea con "USD" antes del cupón.

export const parseBBVA = (text: string): ImportSummary => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: (ParsedExpense & { _net: number })[] = [];
    let period = '';

    for (const line of lines) {
        const m = line.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}/i);
        if (m) { period = line; break; }
    }

    // --- Patrones ---

    // Línea única ARS con cuotas: DD-MMM-YY  DESC  C.XX/YY  COUPON  MONTO
    const arsInstFull = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+C\.(\d{2})\/(\d{2})\s+(\d{5,})\s+([-\u2212]?[\d.,]+)(?:\s+[\d.,]+)?$/;
    // Línea única ARS sin cuotas: DD-MMM-YY  DESC  COUPON  MONTO
    const arsNoInstFull = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+(\d{5,})\s+([-\u2212]?[\d.,]+)(?:\s+[\d.,]+)?$/;

    // Línea única USD: DD-MMM-YY  DESC  USD  AMT  COUPON  AMT
    const usdFull = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+USD\s+([\d.,]+)\s+(\d{5,})\s+([\d.,]+)$/;
    // Línea única USD con cuotas: DD-MMM-YY  DESC  C.XX/YY  USD  AMT  COUPON  AMT
    const usdInstFull = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+C\.(\d{2})\/(\d{2})\s+USD\s+([\d.,]+)\s+(\d{5,})\s+([\d.,]+)$/;

    // Header split (monto en la línea siguiente)
    const hdrInst    = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+C\.(\d{2})\/(\d{2})\s+(\d{5,})$/;
    const hdrNoInst  = /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+(\d{5,})$/;
    // Línea solo con monto (sigue a un header): MONTO_ARS [MONTO_USD]
    const amtLine    = /^([-\u2212]?[\d.,]+)(?:\s+([\d.,]+))?$/;

    // Líneas a ignorar (pagos, totales, encabezados)
    const skipRe = /^(FECHA|NRO\.|TOTAL CONSUMOS|SALDO ACTUAL|Sobre\s*\(|DÓLARES|PESOS|SU PAGO|DEUDA)/i;

    // Línea ARS sin fecha: DESC  COUPON  MONTO  (usa la última fecha vista)
    const arsNoDateFull = /^([A-Za-z][^0-9].+?)\s+(\d{5,})\s+([-\u2212]?[\d.,]+)(?:\s+[\d.,]+)?$/;

    type PendingHeader = {
        date: string; desc: string;
        installments: number; currentInstallment: number;
        coupon: string;
    };
    let pending: PendingHeader | null = null;
    let lastDate = new Date().toISOString().split('T')[0];

    for (const line of lines) {
        if (line.includes('294') || line.includes('MERCADOLIBRE')) {
            console.log('[BBVA] línea MERCADOLIBRE:', JSON.stringify(line), '| pending:', pending?.coupon ?? null);
        }
        if (skipRe.test(line)) { pending = null; continue; }

        // Si hay un header pendiente, la siguiente línea debería ser el monto
        if (pending) {
            const am = amtLine.exec(line);
            if (am) {
                const arsStr = am[1].replace('\u2212', '-');
                const usdStr = am[2];
                const arsAmt = parseAmount(arsStr);
                const usdAmt = usdStr ? parseAmount(usdStr) : 0;
                // Si PESOS es 0 o vacío y hay valor en DÓLARES → es USD
                const isUSD = usdAmt > 0 && (arsAmt === 0);
                const amount = isUSD ? usdAmt : arsAmt;

                if (amount !== 0) {
                    items.push({
                        date: pending.date,
                        description: pending.desc,
                        amount: Math.abs(amount),
                        installments: pending.installments,
                        currentInstallment: pending.currentInstallment,
                        installmentAmount: Math.abs(amount),
                        comprobante: pending.coupon,
                        currency: isUSD ? 'USD' : 'ARS',
                        selected: true,
                        _net: amount,
                    });
                }
                pending = null;
                continue;
            }
            // La línea no era un monto — resetear y procesar como posible nuevo header
            pending = null;
        }

        // Línea única USD con cuotas
        let m = usdInstFull.exec(line);
        if (m) {
            const [, rawDate, desc, curStr, totStr, , cupon, amtStr] = m;
            const amount = parseAmount(amtStr);
            if (amount) items.push({ date: parseBBVADate(rawDate), description: cleanDesc(desc), amount, installments: parseInt(totStr, 10), currentInstallment: parseInt(curStr, 10), installmentAmount: amount, comprobante: cupon, currency: 'USD', selected: true, _net: amount });
            continue;
        }

        // Línea única USD sin cuotas
        m = usdFull.exec(line);
        if (m) {
            const [, rawDate, desc, , cupon, amtStr] = m;
            const amount = parseAmount(amtStr);
            if (amount) items.push({ date: parseBBVADate(rawDate), description: cleanDesc(desc), amount, installments: 1, currentInstallment: 1, installmentAmount: amount, comprobante: cupon, currency: 'USD', selected: true, _net: amount });
            continue;
        }

        // Línea única ARS con cuotas (todo en una línea)
        m = arsInstFull.exec(line);
        if (m) {
            const [, rawDate, desc, curStr, totStr, cupon, amtStr] = m;
            const amount = parseAmount(amtStr);
            lastDate = parseBBVADate(rawDate);
            if (amount !== 0) items.push({ date: lastDate, description: cleanDesc(desc), amount: Math.abs(amount), installments: parseInt(totStr, 10), currentInstallment: parseInt(curStr, 10), installmentAmount: Math.abs(amount), comprobante: cupon, currency: 'ARS', selected: true, _net: amount });
            continue;
        }

        // Línea única ARS sin cuotas (todo en una línea)
        m = arsNoInstFull.exec(line);
        if (m) {
            const [, rawDate, desc, cupon, amtStr] = m;
            const amount = parseAmount(amtStr);
            lastDate = parseBBVADate(rawDate);
            if (amount !== 0) items.push({ date: lastDate, description: cleanDesc(desc), amount: Math.abs(amount), installments: 1, currentInstallment: 1, installmentAmount: Math.abs(amount), comprobante: cupon, currency: 'ARS', selected: true, _net: amount });
            continue;
        }

        // Línea ARS sin fecha (PDF omite la fecha en algunas filas, ej: RAPPIPRO, MERPAGO)
        m = arsNoDateFull.exec(line);
        if (m) {
            const [, desc, cupon, amtStr] = m;
            const amount = parseAmount(amtStr);
            if (amount !== 0) items.push({ date: lastDate, description: cleanDesc(desc), amount: Math.abs(amount), installments: 1, currentInstallment: 1, installmentAmount: Math.abs(amount), comprobante: cupon, currency: 'ARS', selected: true, _net: amount });
            continue;
        }

        // Header con cuotas (monto vendrá en la próxima línea)
        m = hdrInst.exec(line);
        if (m) {
            const [, rawDate, desc, curStr, totStr, coupon] = m;
            lastDate = parseBBVADate(rawDate);
            pending = { date: lastDate, desc: cleanDesc(desc), installments: parseInt(totStr, 10), currentInstallment: parseInt(curStr, 10), coupon };
            continue;
        }

        // Header sin cuotas (monto vendrá en la próxima línea)
        m = hdrNoInst.exec(line);
        if (m) {
            const [, rawDate, desc, coupon] = m;
            // Descartar líneas de ciclo (múltiples fechas) o totales
            if (/\d{2}-[A-Za-z]{3}-\d{2}/.test(desc)) continue;
            lastDate = parseBBVADate(rawDate);
            pending = { date: lastDate, desc: cleanDesc(desc), installments: 1, currentInstallment: 1, coupon };
            continue;
        }
    }

    // Cancelar comprobantes con reversión: cualquier entrada negativa cancela todo el grupo
    const cancelledCupones = new Set<string>();
    for (const item of items) {
        if (item.comprobante && item._net < 0) cancelledCupones.add(item.comprobante);
    }

    console.log('[BBVA] Items parseados:', items.map(i => ({ desc: i.description, cupon: i.comprobante, net: i._net })));
    console.log('[BBVA] Cupones cancelados:', [...cancelledCupones]);

    const filtered: ParsedExpense[] = items
        .filter(item => {
            if (item._net < 0) return false;
            if (!item.comprobante) return true;
            return !cancelledCupones.has(item.comprobante);
        })
        .map(({ _net: _, ...item }) => item);

    console.log('[BBVA] Items finales:', filtered.map(i => ({ desc: i.description, amount: i.amount })));
    console.log('[BBVA] Total ARS:', filtered.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0));

    const totalARS = filtered.filter(i => i.currency === 'ARS').reduce((s, i) => s + i.amount, 0);
    const totalUSD = filtered.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);
    return { bank: 'BBVA', cardType: 'Visa', period, totalARS, totalUSD, items: filtered };
};
