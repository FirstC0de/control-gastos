export const parseAmount = (str: string): number =>
    parseFloat(str.replace(/\u2212/g, '-').replace(/\./g, '').replace(',', '.')) || 0;

export const cleanDesc = (desc: string): string =>
    desc
        .replace(/MERPAGO\*/i, 'MercadoPago - ')
        .replace(/PVS\*/i, 'PedidosYa - ')
        .replace(/DLO\*/i, '')
        .replace(/AMZN\*/i, 'Amazon - ')
        .replace(/\*+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
