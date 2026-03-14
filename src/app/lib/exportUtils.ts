import type { Expense, Income, Category, Card, BudgetStatus } from './types';

// ─── PDF Tarjeta (cuotas + proyección) ───────────────────────────────────────

type InstallmentSummary = {
  cashItems: Expense[];
  installmentItems: (Expense & { currentInstallment: number })[];
};

type ProjectionItem = {
  label: string; year: number; month: number;
  total: number; cash: number; installments: number;
};

export async function generateCardPDF(params: {
  cards: Card[];
  selectedCardId: string | 'all';
  summary: InstallmentSummary;
  projection: ProjectionItem[];
}): Promise<void> {
  const { cards, selectedCardId, summary, projection } = params;
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const now = new Date();
  const selectedCard = cards.find(c => c.id === selectedCardId);
  const monthLabel = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  const { cashItems, installmentItems } = summary;
  const totalCash = cashItems.reduce((s, e) => s + e.amount, 0);
  const totalInstallments = installmentItems.reduce((s, e) => s + (e.installmentAmount ?? 0), 0);
  const totalMonth = totalCash + totalInstallments;

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Gastos', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${selectedCard ? selectedCard.name : 'Todas las tarjetas'} · ${monthLabel}`, 14, 25);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del mes', 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Concepto', 'Monto']],
    body: [
      ['Gastos de contado', `$${fmt(totalCash)}`],
      ['Cuotas del mes',    `$${fmt(totalInstallments)}`],
      ['TOTAL A PAGAR',     `$${fmt(totalMonth)}`],
    ],
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [238, 242, 255];
      }
    },
  });

  let y = (doc as any).lastAutoTable.finalY + 10;

  if (cashItems.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos de contado', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Descripción', 'Monto total']],
      body: cashItems.map(e => [e.description, `$${fmt(e.amount)}`]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (installmentItems.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos en cuotas', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Descripción', 'Monto total', 'Cuota mensual', 'Cuota']],
      body: installmentItems.map(e => [
        e.description,
        `$${fmt(e.amount)}`,
        `$${fmt(e.installmentAmount ?? 0)}`,
        `${e.currentInstallment}/${e.installments}`,
      ]),
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Proyección próximos 6 meses', 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [['Mes', 'Contado', 'Cuotas', 'Total']],
    body: projection.map(p => [
      p.label,
      `$${fmt(p.cash)}`,
      `$${fmt(p.installments)}`,
      `$${fmt(p.total)}`,
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} · Página ${i} de ${pageCount}`, 14, 290);
  }

  const slug = selectedCard?.name.replace(/\s/g, '-') || 'tarjetas';
  doc.save(`resumen-${slug}-${now.getMonth() + 1}-${now.getFullYear()}.pdf`);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

function escapeCSV(v: string | number): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escapeCSV(r[h] ?? '')).join(',')),
  ].join('\n');

  // BOM para que Excel abra correctamente con tildes
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Armado de filas para CSV ─────────────────────────────────────────────────

export type ExportRow = {
  Fecha: string;
  Descripcion: string;
  Categoria: string;
  Monto: number;
  Tipo: string;
  Tarjeta: string;
  Cuotas: string;
  Moneda: string;
};

export function buildExportRows(params: {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  cards: Card[];
  includeExpenses: boolean;
  includeIncomes: boolean;
}): ExportRow[] {
  const { expenses, incomes, categories, cards, includeExpenses, includeIncomes } = params;
  const getCat = (id?: string | null) => categories.find(c => c.id === id)?.name ?? 'Sin categoria';
  const getCard = (id?: string | null) => (id ? (cards.find(c => c.id === id)?.name ?? '') : '');

  const rows: ExportRow[] = [];

  if (includeExpenses) {
    expenses.forEach(e => {
      rows.push({
        Fecha: e.date,
        Descripcion: e.description,
        Categoria: getCat(e.categoryId),
        Monto: -Math.abs(e.amount),
        Tipo: 'Gasto',
        Tarjeta: getCard(e.cardId),
        Cuotas:
          e.installments && e.installments > 1
            ? `${e.currentInstallment ?? 1}/${e.installments}`
            : '',
        Moneda: e.currency ?? 'ARS',
      });
    });
  }

  if (includeIncomes) {
    incomes.forEach(i => {
      rows.push({
        Fecha: i.date,
        Descripcion: i.name,
        Categoria: getCat(i.categoryId),
        Monto: i.amount,
        Tipo: 'Ingreso',
        Tarjeta: '',
        Cuotas: '',
        Moneda: i.currency ?? 'ARS',
      });
    });
  }

  rows.sort((a, b) => b.Fecha.localeCompare(a.Fecha));
  return rows;
}

// ─── PDF completo ─────────────────────────────────────────────────────────────

export type PDFSections = {
  summary: boolean;
  categories: boolean;
  expenses: boolean;
  incomes: boolean;
};

const BLUE:  [number, number, number] = [59,  130, 246];
const GREEN: [number, number, number] = [16,  185, 129];
const RED:   [number, number, number] = [239,  68,  68];
const AMBER: [number, number, number] = [245, 158,  11];
const DARK:  [number, number, number] = [15,   23,  42];
const LIGHT: [number, number, number] = [248, 250, 252];

export async function generateFullPDF(params: {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  cards: Card[];
  sections: PDFSections;
  periodLabel: string;
  blue?: number;
}): Promise<void> {
  const { expenses, incomes, categories, cards, sections, periodLabel, blue: blueRate } = params;

  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  const toARS = (amount: number, currency?: string) =>
    currency === 'USD' ? amount * (blueRate || 1) : amount;

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getCat  = (id?: string | null) => categories.find(c => c.id === id)?.name ?? 'Sin categoría';
  const getCard = (id?: string | null) => (id ? (cards.find(c => c.id === id)?.name ?? '-') : '-');

  const totalIncome   = incomes.reduce((s, i) => s + toARS(i.amount, i.currency), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
  const balance       = totalIncome - totalExpenses;

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.circle(21, 20, 9, 'D');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('$', 18.5, 23.5);

  // Título
  doc.setFontSize(17);
  doc.text('Controlados $', 35, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Financiero Mensual', 35, 25);
  doc.text(periodLabel, 35, 32);

  // Fecha generación
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 195, 32, { align: 'right' });

  let y = 50;

  // ── Resumen ejecutivo ──────────────────────────────────────
  if (sections.summary) {
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen ejecutivo', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Monto']],
      body: [
        ['Total ingresos',  `$${fmt(totalIncome)}`],
        ['Total gastos',    `$${fmt(totalExpenses)}`],
        [balance >= 0 ? 'Balance positivo' : 'Balance negativo', `$${fmt(Math.abs(balance))}`],
      ],
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (data.row.index === 0) data.cell.styles.textColor = GREEN;
        if (data.row.index === 1) data.cell.styles.textColor = RED;
        if (data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = balance >= 0 ? [240, 253, 244] : [254, 242, 242];
          data.cell.styles.textColor = balance >= 0 ? GREEN : RED;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Por categoría ──────────────────────────────────────────
  if (sections.categories && expenses.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }

    const catMap = new Map<string, number>();
    expenses.forEach(e => {
      const cat = getCat(e.categoryId);
      catMap.set(cat, (catMap.get(cat) ?? 0) + toARS(e.amount, e.currency));
    });
    const catRows = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => [name, `$${fmt(total)}`]);

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por categoría', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Total']],
      body: catRows,
      headStyles: { fillColor: AMBER, textColor: 255 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Detalle gastos ─────────────────────────────────────────
  if (sections.expenses && expenses.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de gastos', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripción', 'Categoría', 'Tarjeta', 'Cuota', 'Monto']],
      body: expenses.map(e => [
        e.date,
        e.description,
        getCat(e.categoryId),
        getCard(e.cardId),
        e.installments && e.installments > 1
          ? `${e.currentInstallment ?? 1}/${e.installments}`
          : '-',
        `$${fmt(toARS(e.amount, e.currency))}`,
      ]),
      headStyles: { fillColor: RED, textColor: 255 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 16, halign: 'center' },
        5: { halign: 'right', cellWidth: 28 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Detalle ingresos ───────────────────────────────────────
  if (sections.incomes && incomes.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de ingresos', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
      body: incomes.map(i => [
        i.date,
        i.name,
        getCat(i.categoryId),
        `$${fmt(toARS(i.amount, i.currency))}`,
      ]),
      headStyles: { fillColor: GREEN, textColor: 255 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right' } },
    });
  }

  // ── Footer en todas las páginas ────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 284, 210, 284);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Controlados $ — Gestión de gastos personal', 14, 291);
    doc.text(`Página ${i} de ${pageCount}`, 195, 291, { align: 'right' });
  }

  const slug = periodLabel.replace(/\s+/g, '-').toLowerCase();
  doc.save(`reporte-${slug}.pdf`);
}
