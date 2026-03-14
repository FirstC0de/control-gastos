'use client';

import { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Expense } from '../../lib/types';
import { parseStatement, ImportSummary } from '../../lib/parsers';
import CategorySelector from '../categories/CategorySelector';



export default function PDFImporter({ onClose }: { onClose?: () => void }) {
    const { addExpense, cards, expenses, selectedMonth } = useFinance();

    const [step, setStep] = useState<'upload' | 'review' | 'importing' | 'done'>('upload');
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [selectedCard, setSelectedCard] = useState('');
    const [progress, setProgress] = useState(0);
    const [itemCategories, setItemCategories] = useState<Record<number, string | null>>({});
    const [bulkCategory, setBulkCategory] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
    const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

    // ── Extraer texto con pdf.js ──────────────────────────
    const extractPDFText = async (file: File): Promise<string> => {
        const pdfjsLib = await import('pdfjs-dist');
        const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.toString();

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

            if (!parsed) throw new Error('No se reconoció el formato del resumen. Bancos soportados: Galicia, BBVA y Santander.');
            if (parsed.items.length === 0) throw new Error('No se encontraron transacciones en el resumen.');

            const importAbsMonth = selectedMonth.year * 12 + selectedMonth.month;

            const itemsWithDupes = parsed.items.map(item => {
                const isDuplicate = expenses.some(e => {
                    if (item.comprobante && e.comprobante && e.comprobante === item.comprobante) return true;
                    if ((item.installments ?? 1) <= 1 && (e.installments ?? 1) <= 1) {
                        return e.description === item.description && e.date === item.date && e.amount === item.amount;
                    }
                    if ((item.installments ?? 1) > 1 && (e.installments ?? 1) > 1) {
                        if (e.installments !== item.installments) return false;
                        const eInstAmt   = e.installmentAmount ?? parseFloat((e.amount / e.installments!).toFixed(2));
                        const itemInstAmt = item.installmentAmount ?? item.amount;
                        if (Math.abs(eInstAmt - itemInstAmt) > 0.5) return false;
                        if (e.description.trim().toLowerCase() !== item.description.trim().toLowerCase()) return false;
                        const eBaseKey = e.monthYear ?? e.date.substring(0, 7);
                        const [eYStr, eMStr] = eBaseKey.split('-');
                        const eFirstAbsMonth = parseInt(eYStr) * 12 + (parseInt(eMStr) - 1) - ((e.currentInstallment ?? 1) - 1);
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

        for (let i = 0; i < toImport.length; i++) {
            const item = toImport[i];
            const originalIndex = selectedIndices[i];
            const importMonthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
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
            } as Omit<Expense, 'id'>);
            setProgress(Math.round(((i + 1) / toImport.length) * 100));
        }

        setStep('done');
    };

    const resetToUpload = () => {
        setStep('upload');
        setSummary(null);
        setItemCategories({});
        setBulkCategory(null);
    };

    const selectedCount = summary?.items.filter(i => i.selected).length ?? 0;
    const card = cards.find(c => c.id === selectedCard);

    // ── Render ────────────────────────────────────────────
    return (
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
                            <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className={inputClass}>
                                <option value="">Sin tarjeta específica</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
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
                                    <p className="text-xs text-slate-400 mt-2">Galicia · BBVA · Santander</p>
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
                                {['Galicia', 'BBVA', 'Santander'].map(b => (
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
                                <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Sin tarjeta específica</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {!selectedCard && (
                                    <p className="text-xs text-amber-600 mt-1.5">⚠️ Sin tarjeta seleccionada, los gastos no aparecerán en el resumen por tarjeta.</p>
                                )}
                            </div>
                        </div>

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
                {step === 'done' && (
                    <div className="py-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-900">
                                {selectedCount} gasto{selectedCount !== 1 ? 's' : ''} importado{selectedCount !== 1 ? 's' : ''}
                            </p>
                            {card && <p className="text-sm text-slate-500 mt-1">Asociados a {card.name}</p>}
                        </div>
                        <div className="flex justify-center gap-3 pt-2">
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
    );
}
