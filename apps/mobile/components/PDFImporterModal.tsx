import { useState } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFinance } from '../context/FinanceContext';
import { Expense } from '@controlados/shared';
import { extractTextFromPDF } from '../lib/pdfExtractor';
import { parseStatement, ImportSummary, ParsedExpense } from '../lib/parsers';
import { Colors } from '../constants/Colors';

type Props = { visible: boolean; onClose: () => void };
type Step = 'upload' | 'review' | 'importing' | 'done';

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtUSD = (n: number) => `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function PDFImporterModal({ visible, onClose }: Props) {
    const { addExpense, cards, expenses, selectedMonth } = useFinance();

    const [step, setStep] = useState<Step>('upload');
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [selectedCard, setSelectedCard] = useState('');
    const [cardPickerVisible, setCardPickerVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [progress, setProgress] = useState(0);
    const [importedCount, setImportedCount] = useState(0);
    const [error, setError] = useState('');

    const reset = () => {
        setStep('upload'); setSummary(null); setError('');
        setSelectedCard(''); setProgress(0); setImportedCount(0);
    };

    const handleClose = () => { reset(); onClose(); };

    const handlePickPDF = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.[0]) return;
            await processPDF(result.assets[0].uri);
        } catch (e: any) {
            setError('No se pudo abrir el archivo.');
        }
    };

    const processPDF = async (uri: string) => {
        setLoading(true);
        setError('');
        try {
            setLoadingMsg('Extrayendo texto del PDF...');
            const text = await extractTextFromPDF(uri);
            if (!text.trim()) throw new Error('El PDF no contiene texto extraíble.');

            setLoadingMsg('Analizando resumen...');
            const parsed = parseStatement(text);
            if (!parsed) throw new Error('No se reconoció el formato. Bancos soportados: Galicia, BBVA y Santander.');
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
                        const eInstAmt = e.installmentAmount ?? parseFloat((e.amount / e.installments!).toFixed(2));
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
        setSummary({
            ...summary,
            items: summary.items.map((item, i) => i === index ? { ...item, selected: !item.selected } : item),
        });
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

        const importMonthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
        for (let i = 0; i < toImport.length; i++) {
            const item = toImport[i];
            await addExpense({
                description: item.description,
                amount: item.amount,
                date: item.date,
                cardId: selectedCard || undefined,
                installments: item.installments,
                currentInstallment: item.currentInstallment,
                installmentAmount: item.installmentAmount,
                currency: item.currency,
                comprobante: item.comprobante || undefined,
                monthYear: importMonthYear,
            } as Omit<Expense, 'id'>);
            setProgress(Math.round(((i + 1) / toImport.length) * 100));
        }

        setImportedCount(toImport.length);
        setStep('done');
    };

    const selectedCount = summary?.items.filter(i => i.selected).length ?? 0;
    const dupCount = summary?.items.filter(i => i.duplicate).length ?? 0;
    const selectedCardName = cards.find(c => c.id === selectedCard)?.name ?? 'Sin tarjeta';

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <Text style={styles.cancel}>Cerrar</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Importar PDF</Text>
                    <View style={{ width: 55 }} />
                </View>

                {/* UPLOAD */}
                {step === 'upload' && (
                    <ScrollView style={styles.body} contentContainerStyle={{ gap: 16 }}>
                        {/* Tarjeta destino */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Tarjeta destino</Text>
                            <TouchableOpacity style={styles.selector} onPress={() => setCardPickerVisible(true)}>
                                <Text style={styles.selectorText}>{selectedCardName}</Text>
                                <Text style={styles.selectorArrow}>›</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Zona de selección */}
                        <TouchableOpacity
                            style={[styles.dropZone, loading && styles.dropZoneLoading]}
                            onPress={!loading ? handlePickPDF : undefined}
                            disabled={loading}
                        >
                            {loading ? (
                                <View style={{ alignItems: 'center', gap: 12 }}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loadingMsg}>{loadingMsg}</Text>
                                    <Text style={styles.loadingHint}>Esto puede tardar unos segundos...</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.dropIcon}>📄</Text>
                                    <Text style={styles.dropTitle}>Tocá para seleccionar el PDF</Text>
                                    <Text style={styles.dropSub}>Galicia · BBVA · Santander</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {error !== '' && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* REVIEW */}
                {step === 'review' && summary && (
                    <View style={{ flex: 1 }}>
                        {/* Info resumen */}
                        <View style={styles.summaryBanner}>
                            <View>
                                <Text style={styles.summaryBank}>{summary.bank} · {summary.cardType}</Text>
                                <Text style={styles.summaryPeriod}>{summary.period}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                {summary.totalARS > 0 && <Text style={styles.summaryAmt}>{fmt(summary.totalARS)}</Text>}
                                {summary.totalUSD > 0 && <Text style={[styles.summaryAmt, { color: Colors.secondary }]}>{fmtUSD(summary.totalUSD)}</Text>}
                            </View>
                        </View>

                        {/* Tarjeta */}
                        <View style={styles.cardRow}>
                            <Text style={styles.label}>Tarjeta:</Text>
                            <TouchableOpacity onPress={() => setCardPickerVisible(true)} style={styles.cardChip}>
                                <Text style={styles.cardChipText}>{selectedCardName} ›</Text>
                            </TouchableOpacity>
                        </View>

                        {dupCount > 0 && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    ⚠️ {dupCount} gasto{dupCount !== 1 ? 's' : ''} duplicado{dupCount !== 1 ? 's' : ''} (deseleccionado{dupCount !== 1 ? 's' : ''})
                                </Text>
                            </View>
                        )}

                        {/* Controles */}
                        <View style={styles.controls}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={() => toggleAll(true)}>
                                    <Text style={styles.ctrlBtnText}>Todo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={() => toggleAll(false)}>
                                    <Text style={styles.ctrlBtnText}>Ninguno</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.countText}>{selectedCount}/{summary.items.length}</Text>
                        </View>

                        {/* Lista de items */}
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                            {summary.items.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.txRow, !item.selected && styles.txRowDimmed]}
                                    onPress={() => toggleItem(i)}
                                >
                                    <View style={[styles.checkbox, item.selected && styles.checkboxActive]}>
                                        {item.selected && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                                            {item.duplicate && <Text style={styles.dupBadge}>Dup</Text>}
                                        </View>
                                        <Text style={styles.txMeta}>
                                            {item.date}
                                            {item.installments > 1 ? ` · ${item.currentInstallment}/${item.installments} cuotas` : ' · Contado'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.txAmount, item.currency === 'USD' && { color: Colors.secondary }]}>
                                        {item.currency === 'USD' ? fmtUSD(item.amount) : fmt(item.amount)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Botones acción */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity style={styles.backBtn} onPress={reset}>
                                <Text style={styles.backBtnText}>← Volver</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.importBtn, selectedCount === 0 && styles.importBtnDisabled]}
                                onPress={handleImport}
                                disabled={selectedCount === 0}
                            >
                                <Text style={styles.importBtnText}>Importar {selectedCount}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* IMPORTING */}
                {step === 'importing' && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingMsg}>Guardando gastos...</Text>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressBar, { width: `${progress}%` as any }]} />
                        </View>
                        <Text style={styles.progressText}>{progress}%</Text>
                    </View>
                )}

                {/* DONE */}
                {step === 'done' && (
                    <View style={styles.centered}>
                        <View style={styles.successCircle}>
                            <Text style={{ fontSize: 32 }}>✓</Text>
                        </View>
                        <Text style={styles.doneTitle}>{importedCount} gasto{importedCount !== 1 ? 's' : ''} importado{importedCount !== 1 ? 's' : ''}</Text>
                        {selectedCard !== '' && (
                            <Text style={styles.doneSub}>Asociados a {selectedCardName}</Text>
                        )}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity style={styles.backBtn} onPress={reset}>
                                <Text style={styles.backBtnText}>Importar otro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.importBtn} onPress={handleClose}>
                                <Text style={styles.importBtnText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Card picker */}
                <Modal visible={cardPickerVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.pickerOverlay} onPress={() => setCardPickerVisible(false)}>
                        <View style={styles.pickerSheet}>
                            <Text style={styles.pickerTitle}>Seleccionar tarjeta</Text>
                            <TouchableOpacity style={styles.pickerItem} onPress={() => { setSelectedCard(''); setCardPickerVisible(false); }}>
                                <Text style={[styles.pickerItemText, selectedCard === '' && styles.pickerItemActive]}>Sin tarjeta específica</Text>
                            </TouchableOpacity>
                            {cards.map(c => (
                                <TouchableOpacity key={c.id} style={styles.pickerItem} onPress={() => { setSelectedCard(c.id); setCardPickerVisible(false); }}>
                                    <Text style={[styles.pickerItemText, selectedCard === c.id && styles.pickerItemActive]}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title: { fontSize: 17, fontWeight: '700', color: Colors.text },
    cancel: { fontSize: 16, color: Colors.textSecondary, width: 55 },
    body: { flex: 1, padding: 16 },

    section: { gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
    selectorText: { fontSize: 15, color: Colors.text },
    selectorArrow: { fontSize: 18, color: Colors.textMuted },

    dropZone: { backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 48, alignItems: 'center', gap: 8 },
    dropZoneLoading: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
    dropIcon: { fontSize: 48 },
    dropTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
    dropSub: { fontSize: 13, color: Colors.textMuted },
    loadingMsg: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    loadingHint: { fontSize: 12, color: Colors.textMuted },

    errorBox: { backgroundColor: Colors.danger + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.danger + '40' },
    errorText: { fontSize: 13, color: Colors.danger },

    summaryBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryDark, padding: 16 },
    summaryBank: { fontSize: 15, fontWeight: '700', color: '#fff' },
    summaryPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    summaryAmt: { fontSize: 14, fontWeight: '700', color: '#fff' },

    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    cardChip: { backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    cardChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

    warningBox: { marginHorizontal: 12, marginTop: 8, backgroundColor: Colors.warning + '20', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.warning + '40' },
    warningText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },

    controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
    ctrlBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8 },
    ctrlBtnText: { fontSize: 12, fontWeight: '600', color: Colors.text },
    countText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },

    txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    txRowDimmed: { opacity: 0.4 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
    txDesc: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
    txMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
    dupBadge: { fontSize: 10, color: Colors.warning, fontWeight: '700', backgroundColor: Colors.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    actionBar: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
    backBtn: { flex: 1, paddingVertical: 14, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
    importBtn: { flex: 1, paddingVertical: 14, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center' },
    importBtnDisabled: { opacity: 0.4 },
    importBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    progressTrack: { width: 200, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
    progressText: { fontSize: 13, color: Colors.textMuted },

    successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.secondary + '20', alignItems: 'center', justifyContent: 'center' },
    doneTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    doneSub: { fontSize: 14, color: Colors.textMuted },

    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, gap: 4 },
    pickerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerItemText: { fontSize: 15, color: Colors.text },
    pickerItemActive: { color: Colors.primary, fontWeight: '700' },
});
