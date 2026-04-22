'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useFinance } from '../../context/FinanceContext';
import { Expense, Card } from '@controlados/shared';
import { parseStatement, ImportSummary } from '../../lib/parsers';
import CategorySelector from '../categories/CategorySelector';

const CARD_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

const emptyCardForm = (): Omit<Card, 'id'> => ({
    name: '', color: '#6366f1', lastFour: '', closingDay: 15, dueDay: 5,
});

export default function PDFImporter({ onClose }: { onClose?: () => void }) {
    const { addExpense, addCard, cards, expenses, selectedMonth, updateCard } = useFinance();

    const [step, setStep] = useState<'upload' | 'review' | 'importing' | 'done'>('upload');
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [selectedCard, setSelectedCard] = useState('');
    const [progress, setProgress] = useState(0);
    const [importResult, setImportResult] = useState<{ cash: number; installments: number; errors: number } | null>(null);
    const [itemCategories, setItemCategories] = useState<Record<number, string | null>>({});
    const [bulkCategory, setBulkCategory] = useState<string | null>(null);
    const [updateCardDates, setUpdateCardDates] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Mini-modal para agregar tarjeta ───────────────────
    const [showAddCard, setShowAddCard] = useState(false);
    const [cardForm, setCardForm] = useState<Omit<Card, 'id'>>(emptyCardForm());
    const [savingCard, setSavingCard] = useState(false);

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardForm.name) return;
        setSavingCard(true);
        try {
            const newCard = await addCard(cardForm);
            setSelectedCard(newCard.id);
            setCardForm(emptyCardForm());
            setShowAddCard(false);
            toast.success(`Tarjeta "${newCard.name}" creada`);
        } catch {
            toast.error('Error al crear la tarjeta');
        } finally {
            setSavingCard(false);
        }
    };

    const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
    const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

    // ── Extraer texto con pdf.js ──────────────────────────
    const extractPDFText = async (file: File): Promise<string> => {
        const pdfjsLib = await import('pdfjs-dist');

        // Safari iOS < 15 no soporta ES module workers (.mjs como classic worker falla).
        // Si el browser no soporta module workers, usar fake worker (main thread).
        const supportsModuleWorker = (() => {
            try { new Worker('data:text/javascript,', { type: 'module' }); return true; }
            catch { return false; }
        })();

        if (supportsModuleWorker) {
            const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.toString();
        } else {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }

        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            const itemsByY: Record<number, { x: number; str: string }[]> = {};
            for (const item of content.items as any[]) {
                const y = Math.round(item.transform[5]);
                if (!itemsByY[y]) itemsByY[y] = [];
                itemsByY[y].push({ x: item.transform[4], str: item.str });
            }

            const sortedYs = Object.keys(itemsByY).map(Number).sort((a, b) => b - a);
            for (const y of sortedYs) {
                const line = itemsByY[y].sort((a, b) => a.x - b.x).map(i => i.str).join('  ');
                if (line.trim()) fullText += line + '\n';
            }
        }

        return fullText;
    };

    const handleFile = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Solo se aceptan archivos PDF.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            setLoadingMsg('Extrayendo texto del PDF...');
            const text = await extractPDFText(file);

            if (!text.trim()) throw new Error('El PDF no contiene texto extraíble.');

            setLoadingMsg('Analizando resumen...');
            const parsed = parseStatement(text);

            if (!parsed) throw new Error('No se reconoció el formato del resumen. Bancos soportados: Galicia, BBVA, Santander, ICBC y Provincia.');
            if (parsed.items.length === 0) throw new Error('No se encontraron transacciones en el resumen.');

            const importAbsMonth = selectedMonth.year * 12 + selectedMonth.month;

            const itemsWithDupes = parsed.items.map(item => {
                const isItemInstallment = (item.installments ?? 1) > 1;

                const isDuplicate = expenses.some(e => {
                    const isExpenseInstallment = (e.installments ?? 1) > 1;

                    if (!isItemInstallment && !isExpenseInstallment) {
                        // Contado: filtrar primero por mes seleccionado.
                        // Un contado de un mes anterior NUNCA es duplicado del mes en curso,
                        // aunque tenga el mismo comprobante (es el mismo resumen, diferente período).
                        const eKey = e.monthYear ?? e.date.substring(0, 7);
                        const [eY, eM] = eKey.split('-');
                        const eAbsMonth = parseInt(eY) * 12 + (parseInt(eM) - 1);
                        if (eAbsMonth !== importAbsMonth) return false;
                        // Mismo mes: comprobante tiene prioridad, sino descripción+monto+fecha
                        if (item.comprobante && e.comprobante && e.comprobante === item.comprobante) return true;
                        return (
                            e.description === item.description &&
                            e.amount === item.amount &&
                            e.date === item.date
                        );
                    }

                    if (isItemInstallment && isExpenseInstallment) {
                        // Cuotas: buscar en todos los meses para detectar la misma compra
                        // aunque venga con diferente número de cuota (ej: 16/18 vs 17/18).
                        // El comprobante también aplica globalmente para cuotas.
                        if (item.comprobante && e.comprobante && e.comprobante === item.comprobante) return true;
                        if (e.installments !== item.installments) return false;
                        const eInstAmt    = e.installmentAmount ?? parseFloat((e.amount / e.installments!).toFixed(2));
                        const itemInstAmt = item.installmentAmount ?? item.amount;
                        if (Math.abs(eInstAmt - itemInstAmt) > 0.5) return false;
                        if (e.description.trim().toLowerCase() !== item.description.trim().toLowerCase()) return false;
                        // Calcular el mes de la cuota 1 para ambos y comparar
                        const eBaseKey = e.monthYear ?? e.date.substring(0, 7);
                        const [eYStr, eMStr] = eBaseKey.split('-');
                        const eFirstAbsMonth   = parseInt(eYStr) * 12 + (parseInt(eMStr) - 1) - ((e.currentInstallment ?? 1) - 1);
                        const itemFirstAbsMonth = importAbsMonth - ((item.currentInstallment ?? 1) - 1);
                        return eFirstAbsMonth === itemFirstAbsMonth;
                    }

                    return false;
                });
                return { ...item, duplicate: isDuplicate, selected: !isDuplicate };
            });

            setSummary({ ...parsed, items: itemsWithDupes });
            setItemCategories({});
            setBulkCategory(null);
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'No se pudo procesar el PDF.');
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    const toggleItem = (index: number) => {
        if (!summary) return;
        setSummary({ ...summary, items: summary.items.map((item, i) => i === index ? { ...item, selected: !item.selected } : item) });
    };

    const toggleAll = (val: boolean) => {
        if (!summary) return;
        setSummary({ ...summary, items: summary.items.map(i => ({ ...i, selected: val })) });
    };

    const handleImport = async () => {
        if (!summary) return;
        const toImport = summary.items.filter(i => i.selected);
        if (toImport.length === 0) return;

        setStep('importing');
        setProgress(0);

        const selectedIndices = summary.items.reduce<number[]>((acc, item, i) => {
            if (item.selected) acc.push(i);
            return acc;
        }, []);

        let importedCash = 0;
        let importedInstallments = 0;
        const errors: string[] = [];

        for (let i = 0; i < toImport.length; i++) {
            const item = toImport[i];
            const originalIndex = selectedIndices[i];
            const importMonthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
            try {
                await addExpense({
                    description: item.description,
                    amount: item.amount,
                    date: item.date,
                    cardId: selectedCard || undefined,
                    categoryId: itemCategories[originalIndex] ?? undefined,
                    installments: item.installments,
                    currentInstallment: item.currentInstallment,
                    installmentAmount: item.installmentAmount,
                    currency: item.currency,
                    comprobante: item.comprobante || undefined,
                    monthYear: importMonthYear,
                } as Omit<Expense, 'id'>, { silent: true });

                if ((item.installments ?? 1) > 1) importedInstallments++;
                else importedCash++;
            } catch {
                errors.push(item.description);
            }
            setProgress(Math.round(((i + 1) / toImport.length) * 100));
        }

        // Actualizar fechas de la tarjeta si el usuario lo pidió
        if (updateCardDates && selectedCard && summary.closingDate) {
            const card = cards.find(c => c.id === selectedCard);
            if (card) {
                const newClosingDay = new Date(summary.closingDate + 'T12:00:00').getDate();
                const newDueDay    = summary.dueDate
                    ? new Date(summary.dueDate + 'T12:00:00').getDate()
                    : card.dueDay;

                const prevHistory = card.closingHistory ?? [];
                const newRecord = {
                    closingDate: summary.closingDate,
                    ...(summary.dueDate ? { dueDate: summary.dueDate } : {}),
                    source: 'pdf_import' as const,
                };
                // Mantener máximo 3 registros (más reciente al final)
                const newHistory = [...prevHistory, newRecord].slice(-3);

                await updateCard(selectedCard, {
                    closingDay: newClosingDay,
                    dueDay: newDueDay,
                    closingHistory: newHistory,
                });
            }
        } else if (selectedCard && summary.closingDate) {
            // Aunque no actualice los días, siempre guarda en el historial
            const card = cards.find(c => c.id === selectedCard);
            if (card) {
                const prevHistory = card.closingHistory ?? [];
                const newRecord = {
                    closingDate: summary.closingDate,
                    ...(summary.dueDate ? { dueDate: summary.dueDate } : {}),
                    source: 'pdf_import' as const,
                };
                const newHistory = [...prevHistory, newRecord].slice(-3);
                await updateCard(selectedCard, { closingHistory: newHistory });
            }
        }

        setImportResult({ cash: importedCash, installments: importedInstallments, errors: errors.length });

        // Notificación única al final
        const dupCount = summary.items.filter(i => i.duplicate && !i.selected).length;
        const parts: string[] = [];
        if (importedCash > 0) parts.push(`${importedCash} de contado`);
        if (importedInstallments > 0) parts.push(`${importedInstallments} en cuotas`);

        const successMsg = `✅ ${importedCash + importedInstallments} gasto${importedCash + importedInstallments !== 1 ? 's' : ''} importado${importedCash + importedInstallments !== 1 ? 's' : ''} (${parts.join(' · ')})`;

        if (errors.length === 0) {
            toast.success(successMsg + (dupCount > 0 ? ` · ${dupCount} duplicado${dupCount !== 1 ? 's' : ''} omitido${dupCount !== 1 ? 's' : ''}` : ''), { duration: 6000 });
        } else {
            toast.warning(`${successMsg} · ${errors.length} error${errors.length !== 1 ? 'es' : ''}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '…' : ''}`, { duration: 8000 });
        }

        setStep('done');
    };

    const resetToUpload = () => {
        setStep('upload');
        setSummary(null);
        setImportResult(null);
        setItemCategories({});
        setBulkCategory(null);
        setUpdateCardDates(false);
    };

    const selectedCount = summary?.items.filter(i => i.selected).length ?? 0;
    const card = cards.find(c => c.id === selectedCard);

    // ── Render ────────────────────────────────────────────
    return (
        <>
        <div className="bg-white rounded-2xl border border-slate-200">

            {/* Header */}
            <div className="relative flex items-center justify-end mx-0 px-6 py-4 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
                <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-indigo-900 tracking-tight whitespace-nowrap">
                    Importar resumen de tarjeta
                </h2>
                {onClose && (
                    <button onClick={onClose}
                        className="relative z-10 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white/70 rounded-lg transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <div className="p-6">

                {/* STEP: upload */}
                {step === 'upload' && (
                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>Tarjeta destino</label>
                            {cards.length === 0 ? (
                                <button type="button" onClick={() => setShowAddCard(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-600 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Agregar tarjeta
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className={inputClass}>
                                        <option value="">Sin tarjeta específica</option>
                                        {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setShowAddCard(true)}
                                        title="Agregar tarjeta"
                                        className="shrink-0 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-colors">
                                        +
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => !loading && fileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                                loading ? 'border-indigo-300 bg-indigo-50 cursor-wait' : 'border-slate-200 hover:border-indigo-400 cursor-pointer'
                            }`}
                        >
                            {loading ? (
                                <div className="space-y-3">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-sm font-medium text-indigo-700">{loadingMsg}</p>
                                    <p className="text-xs text-indigo-400">Esto puede tardar unos segundos...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-5xl mb-3">📄</div>
                                    <p className="text-sm font-medium text-slate-700">Arrastrá el PDF acá o hacé click para seleccionar</p>
                                    <p className="text-xs text-slate-400 mt-2">Galicia · BBVA · Santander · ICBC · Provincia</p>
                                </>
                            )}
                            <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                                <span className="text-rose-500 shrink-0">⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                            <p className={labelClass}>Bancos soportados</p>
                            <div className="flex flex-wrap gap-2">
                                {['Galicia', 'BBVA', 'Santander', 'ICBC', 'Provincia'].map(b => (
                                    <span key={b} className="px-2 py-1 bg-white border border-slate-200 text-xs text-slate-600 rounded-lg">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP: review */}
                {step === 'review' && summary && (
                    <div className="space-y-4">

                        {/* Info banco detectado */}
                        <div className="bg-indigo-50 rounded-xl px-4 py-3 space-y-3">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Resumen detectado</p>
                                    <p className="text-sm font-bold text-indigo-900 mt-0.5">{summary.bank} · {summary.cardType}</p>
                                    <p className="text-xs text-indigo-400 mt-0.5">{summary.period}</p>
                                </div>
                                <div className="flex gap-4 text-right">
                                    {summary.totalARS > 0 && (
                                        <div>
                                            <p className="text-xs text-indigo-400">Total ARS</p>
                                            <p className="text-sm font-bold text-indigo-800 font-mono">
                                                ${summary.totalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                    {summary.totalUSD > 0 && (
                                        <div>
                                            <p className="text-xs text-indigo-400">Total USD</p>
                                            <p className="text-sm font-bold text-indigo-800 font-mono">
                                                U$D {summary.totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-indigo-100 pt-3">
                                <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1.5">Asociar a tarjeta</label>
                                {cards.length === 0 ? (
                                    <button type="button" onClick={() => setShowAddCard(true)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-600 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60 rounded-xl transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Agregar tarjeta
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm border border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="">Sin tarjeta específica</option>
                                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowAddCard(true)}
                                            title="Agregar tarjeta"
                                            className="shrink-0 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 rounded-xl transition-colors">
                                            +
                                        </button>
                                    </div>
                                )}
                                {!selectedCard && (
                                    <p className="text-xs text-amber-600 mt-1.5">⚠️ Sin tarjeta seleccionada, los gastos no aparecerán en el resumen por tarjeta.</p>
                                )}
                            </div>
                        </div>

                        {/* Banner fechas detectadas */}
                        {summary.closingDate && (() => {
                            const selCard = cards.find(c => c.id === selectedCard);
                            const pdfClosingDay = new Date(summary.closingDate + 'T12:00:00').getDate();
                            const pdfDueDay     = summary.dueDate ? new Date(summary.dueDate + 'T12:00:00').getDate() : null;
                            const datesMatch    = selCard && selCard.closingDay === pdfClosingDay && (!pdfDueDay || selCard.dueDay === pdfDueDay);
                            return (
                                <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sky-500 text-base">📅</span>
                                        <p className="text-sm font-semibold text-sky-800">Fechas detectadas en el resumen</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-sky-700 font-mono">
                                        <span>Cierre: <strong>{new Date(summary.closingDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                                        {summary.dueDate && (
                                            <span>Vencimiento: <strong>{new Date(summary.dueDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                                        )}
                                    </div>
                                    {selCard && !datesMatch && (
                                        <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
                                            <input
                                                type="checkbox"
                                                checked={updateCardDates}
                                                onChange={e => setUpdateCardDates(e.target.checked)}
                                                className="mt-0.5 accent-sky-600"
                                            />
                                            <span className="text-xs text-sky-700">
                                                Actualizar <strong>{selCard.name}</strong> con estas fechas
                                                {selCard.closingDay !== pdfClosingDay && (
                                                    <span className="text-sky-400"> (cierre: día {selCard.closingDay} → día {pdfClosingDay})</span>
                                                )}
                                                {pdfDueDay && selCard.dueDay !== pdfDueDay && (
                                                    <span className="text-sky-400"> (vto: día {selCard.dueDay} → día {pdfDueDay})</span>
                                                )}
                                            </span>
                                        </label>
                                    )}
                                    {selCard && datesMatch && (
                                        <p className="text-xs text-emerald-600">Las fechas coinciden con tu configuración.</p>
                                    )}
                                    {!selCard && (
                                        <p className="text-xs text-sky-500">Seleccioná una tarjeta para comparar con tu configuración.</p>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Banner duplicados */}
                        {summary.items.some(i => i.duplicate) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                                <span className="text-amber-500 shrink-0">⚠️</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">
                                        {summary.items.filter(i => i.duplicate).length} gasto{summary.items.filter(i => i.duplicate).length !== 1 ? 's' : ''} ya importado{summary.items.filter(i => i.duplicate).length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">Están deseleccionados automáticamente. Podés reimportarlos seleccionándolos manualmente.</p>
                                </div>
                            </div>
                        )}

                        {/* Controles bulk */}
                        <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={() => toggleAll(true)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
                                        Seleccionar todo
                                    </button>
                                    <button onClick={() => toggleAll(false)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
                                        Ninguno
                                    </button>
                                </div>
                                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                                    {selectedCount} de {summary.items.length} seleccionados
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider shrink-0">Categoría de los seleccionados</span>
                                <CategorySelector
                                    value={bulkCategory}
                                    onChange={id => {
                                        setBulkCategory(id);
                                        if (!summary) return;
                                        setItemCategories(prev => {
                                            const next = { ...prev };
                                            summary.items.forEach((item, i) => { if (item.selected) next[i] = id; });
                                            return next;
                                        });
                                    }}
                                    categoryType="expense"
                                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    showManageButton={false}
                                />
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-110 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-linear-to-r from-indigo-50 to-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="w-10 px-3 py-3" />
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Fecha</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Descripción</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider">Cuota</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Categoría</th>
                                        <th className="px-3 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {summary.items.map((item, i) => (
                                        <tr key={i} onClick={() => toggleItem(i)}
                                            className={`cursor-pointer transition-colors ${
                                                item.selected ? 'bg-white hover:bg-indigo-50/40' : 'bg-slate-50 opacity-40 hover:opacity-60'
                                            }`}>
                                            <td className="px-3 py-3 text-center">
                                                <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center transition-colors ${
                                                    item.selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                                }`}>
                                                    {item.selected && <span className="text-white text-xs leading-none">✓</span>}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(item.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900 truncate max-w-55">{item.description}</p>
                                                    {item.duplicate && (
                                                        <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Duplicado</span>
                                                    )}
                                                </div>
                                                {item.comprobante && <p className="text-xs text-slate-400">#{item.comprobante}</p>}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {item.installments > 1 ? (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full whitespace-nowrap">
                                                        {item.currentInstallment}/{item.installments}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">Contado</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                                <CategorySelector
                                                    value={itemCategories[i] ?? null}
                                                    onChange={id => setItemCategories(prev => ({ ...prev, [i]: id }))}
                                                    categoryType="expense"
                                                    className="w-36 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    showManageButton={false}
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-semibold font-mono whitespace-nowrap"
                                                style={{ color: item.currency === 'USD' ? '#059669' : '#0f172a' }}>
                                                {item.currency === 'USD' ? 'U$D ' : '$'}
                                                {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Acciones */}
                        <div className="flex justify-between items-center pt-1">
                            <button onClick={resetToUpload}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                ← Volver
                            </button>
                            <button onClick={handleImport} disabled={selectedCount === 0}
                                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors">
                                Importar {selectedCount} gasto{selectedCount !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: importing */}
                {step === 'importing' && (
                    <div className="py-16 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-medium text-slate-700">Guardando gastos...</p>
                        <div className="w-48 bg-slate-100 rounded-full h-2 mx-auto">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-slate-400">{progress}%</p>
                    </div>
                )}

                {/* STEP: done */}
                {step === 'done' && importResult && (
                    <div className="py-12 text-center space-y-5">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-900">
                                {importResult.cash + importResult.installments} gasto{importResult.cash + importResult.installments !== 1 ? 's' : ''} importado{importResult.cash + importResult.installments !== 1 ? 's' : ''}
                            </p>
                            {card && <p className="text-sm text-slate-500 mt-1">Asociados a {card.name}</p>}
                        </div>
                        {/* Desglose */}
                        <div className="bg-slate-50 rounded-xl px-5 py-4 text-sm text-left space-y-2 max-w-xs mx-auto">
                            {importResult.cash > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Contado</span>
                                    <span className="font-semibold text-slate-800">{importResult.cash}</span>
                                </div>
                            )}
                            {importResult.installments > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">En cuotas</span>
                                    <span className="font-semibold text-slate-800">{importResult.installments}</span>
                                </div>
                            )}
                            {summary?.items.filter(i => i.duplicate).length ? (
                                <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="text-amber-600">Duplicados omitidos</span>
                                    <span className="font-semibold text-amber-700">{summary.items.filter(i => i.duplicate).length}</span>
                                </div>
                            ) : null}
                            {importResult.errors > 0 && (
                                <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="text-rose-600">Errores</span>
                                    <span className="font-semibold text-rose-700">{importResult.errors}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center gap-3 pt-1">
                            <button onClick={resetToUpload}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                Importar otro
                            </button>
                            {onClose && (
                                <button onClick={onClose}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
                                    Cerrar
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* ── Modal: Agregar tarjeta ──────────────────────────────────── */}
        {showAddCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Nueva tarjeta</h3>
                        <button onClick={() => setShowAddCard(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleAddCard} className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className={labelClass}>Nombre *</label>
                                <input type="text" value={cardForm.name} autoFocus required
                                    onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                                    className={inputClass} placeholder="Visa Galicia" />
                            </div>
                            <div>
                                <label className={labelClass}>Últimos 4 dígitos</label>
                                <input type="text" inputMode="numeric" value={cardForm.lastFour || ''}
                                    onChange={e => setCardForm({ ...cardForm, lastFour: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    onFocus={e => e.target.select()}
                                    style={{ fontSize: '16px' }}
                                    className={inputClass} placeholder="1234" maxLength={4} />
                            </div>
                            <div>
                                <label className={labelClass}>Día cierre</label>
                                <input type="text" inputMode="numeric" value={cardForm.closingDay || ''}
                                    onChange={e => setCardForm({ ...cardForm, closingDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                                    onFocus={e => e.target.select()}
                                    style={{ fontSize: '16px' }}
                                    className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Día vencimiento</label>
                                <input type="text" inputMode="numeric" value={cardForm.dueDay || ''}
                                    onChange={e => setCardForm({ ...cardForm, dueDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                                    onFocus={e => e.target.select()}
                                    style={{ fontSize: '16px' }}
                                    className={inputClass} />
                            </div>
                        </div>

                        {/* Color */}
                        <div>
                            <label className={labelClass}>Color</label>
                            <div className="flex gap-2">
                                {CARD_COLORS.map(color => (
                                    <button key={color} type="button"
                                        onClick={() => setCardForm({ ...cardForm, color })}
                                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                            cardForm.color === color ? 'border-slate-800 scale-110' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: color }} />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="rounded-xl px-4 py-3 text-white flex justify-between items-center"
                            style={{ background: `linear-gradient(135deg, ${cardForm.color}, ${cardForm.color}99)` }}>
                            <p className="text-sm font-semibold">{cardForm.name || 'Nombre tarjeta'}</p>
                            {cardForm.lastFour && (
                                <p className="text-xs font-mono opacity-80">•••• {cardForm.lastFour}</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setShowAddCard(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={savingCard || !cardForm.name}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors">
                                {savingCard ? 'Guardando...' : 'Crear tarjeta'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
