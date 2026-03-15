import { useState, useEffect } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFinance } from '../context/FinanceContext';
import { Colors } from '../constants/Colors';
import { Currency } from '@controlados/shared';
import NumericKeyboard, { formatAmountDisplay, parseRawAmount } from './NumericKeyboard';

type Props = { visible: boolean; onClose: () => void };

const INCOME_TYPES = [
    { value: 'monthly', label: '📅 Mensual' },
    { value: 'sales',   label: '🛒 Ventas'  },
    { value: 'other',   label: '✦ Otro'     },
] as const;

export default function IncomeFormModal({ visible, onClose }: Props) {
    const { addIncome, categories, selectedMonth } = useFinance();

    const [rawAmount, setRawAmount]   = useState('');
    const [currency, setCurrency]     = useState<Currency>('ARS');
    const [name, setName]             = useState('');
    const [date, setDate]             = useState('');
    const [type, setType]             = useState<'monthly' | 'sales' | 'other'>('monthly');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [recurring, setRecurring]   = useState(false);
    const [loading, setLoading]       = useState(false);
    const [phase, setPhase]           = useState<'amount' | 'details'>('amount');

    useEffect(() => {
        if (visible) {
            const today = new Date();
            const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setRawAmount(''); setCurrency('ARS'); setName(''); setDate(d);
            setType('monthly'); setCategoryId(null); setRecurring(false);
            setPhase('amount');
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Ingresá un nombre'); return; }
        const parsedAmount = parseRawAmount(rawAmount);
        if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }

        setLoading(true);
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await addIncome({
                name: name.trim(), amount: parsedAmount, date, type,
                categoryId: categoryId ?? undefined, currency, recurring: recurring || undefined,
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
        } catch {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'No se pudo guardar el ingreso');
        } finally {
            setLoading(false);
        }
    };

    const incomeCategories = categories.filter(
        c => c.isActive !== false && (c.type === 'income' || c.type === 'both')
    );
    const parsedAmount = parseRawAmount(rawAmount);
    const hasAmount = parsedAmount > 0;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        {phase === 'details' ? (
                            <TouchableOpacity onPress={() => setPhase('amount')} style={styles.headerBtn}>
                                <Text style={styles.headerBack}>‹ Monto</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.headerBtn} />
                        )}
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Nuevo ingreso</Text>
                            <View style={styles.stepDots}>
                                <View style={[styles.dot, phase === 'amount' && styles.dotActive]} />
                                <View style={[styles.dot, phase === 'details' && styles.dotActive]} />
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                            <Text style={styles.headerClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Display monto */}
                    <TouchableOpacity
                        style={[styles.amountDisplay, phase === 'amount' && styles.amountDisplayActive]}
                        onPress={() => setPhase('amount')}
                        activeOpacity={phase === 'details' ? 0.7 : 1}
                    >
                        <Text style={[styles.amountText, !hasAmount && styles.amountPlaceholder]}>
                            {formatAmountDisplay(rawAmount, currency)}
                        </Text>
                        {phase === 'details' && (
                            <Text style={styles.amountEdit}>Tocar para editar</Text>
                        )}
                    </TouchableOpacity>

                    {/* Fase: teclado */}
                    {phase === 'amount' && (
                        <NumericKeyboard
                            value={rawAmount}
                            onChange={setRawAmount}
                            currency={currency}
                            onToggleCurrency={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                            onConfirm={() => setPhase('details')}
                        />
                    )}

                    {/* Fase: detalles */}
                    {phase === 'details' && (
                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.label}>¿De dónde viene?</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Sueldo, Freelance, Alquiler..."
                                placeholderTextColor={Colors.textMuted}
                                autoFocus
                                returnKeyType="done"
                            />

                            <Text style={styles.label}>Fecha</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Tipo</Text>
                            <View style={styles.typeRow}>
                                {INCOME_TYPES.map(t => (
                                    <TouchableOpacity
                                        key={t.value}
                                        style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                                        onPress={() => setType(t.value)}
                                    >
                                        <Text style={[styles.typeText, type === t.value && styles.typeTextActive]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.segmented}>
                                <TouchableOpacity
                                    style={[styles.segment, !recurring && styles.segmentActive]}
                                    onPress={() => setRecurring(false)}
                                >
                                    <Text style={[styles.segmentText, !recurring && styles.segmentTextActive]}>Puntual</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segment, recurring && styles.segmentActive]}
                                    onPress={() => setRecurring(true)}
                                >
                                    <Text style={[styles.segmentText, recurring && styles.segmentTextActive]}>↻ Recurrente</Text>
                                </TouchableOpacity>
                            </View>

                            {incomeCategories.length > 0 && (
                                <>
                                    <Text style={styles.label}>Categoría</Text>
                                    <View style={styles.categoryGrid}>
                                        <TouchableOpacity
                                            style={[styles.categoryItem, !categoryId && styles.categoryItemActive]}
                                            onPress={() => setCategoryId(null)}
                                        >
                                            <View style={[styles.categoryIcon, !categoryId && { backgroundColor: Colors.secondary + '20' }]}>
                                                <Text style={styles.categoryEmoji}>✦</Text>
                                            </View>
                                            <Text style={[styles.categoryLabel, !categoryId && { color: Colors.secondary, fontWeight: '700' }]} numberOfLines={1}>
                                                Ninguna
                                            </Text>
                                        </TouchableOpacity>
                                        {incomeCategories.map(cat => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[styles.categoryItem, categoryId === cat.id && styles.categoryItemActive]}
                                                onPress={() => setCategoryId(cat.id)}
                                            >
                                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                                    <Text style={styles.categoryEmoji}>{cat.icon ?? '📁'}</Text>
                                                </View>
                                                <Text style={[styles.categoryLabel, categoryId === cat.id && { color: cat.color, fontWeight: '700' }]} numberOfLines={1}>
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <View style={{ height: 16 }} />
                        </ScrollView>
                    )}

                    {phase === 'details' && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.submitBtn, (!hasAmount || loading) && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={!hasAmount || loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : (
                                        <View style={{ alignItems: 'center', gap: 2 }}>
                                            <Text style={styles.submitText}>Guardar ingreso</Text>
                                            <Text style={styles.submitAmount}>{formatAmountDisplay(rawAmount, currency)}</Text>
                                        </View>
                                    )
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '95%', overflow: 'hidden' },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerBtn: { width: 70 },
    headerBack: { fontSize: 15, color: Colors.secondary, fontWeight: '600' },
    headerClose: { fontSize: 16, color: Colors.textSecondary, textAlign: 'right' },
    headerCenter: { alignItems: 'center', gap: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    stepDots: { flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
    dotActive: { backgroundColor: Colors.secondary, width: 18 },
    amountDisplay: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background },
    amountDisplayActive: { backgroundColor: Colors.secondary + '08' },
    amountText: { fontSize: 44, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
    amountPlaceholder: { color: Colors.border },
    amountEdit: { fontSize: 11, color: Colors.secondary, marginTop: 6, fontWeight: '600' },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 16, marginBottom: 8 },
    input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    typeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, alignItems: 'center' },
    typeChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
    typeText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    typeTextActive: { color: '#fff' },
    segmented: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
    segment: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: Colors.background },
    segmentActive: { backgroundColor: Colors.secondary },
    segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    segmentTextActive: { color: '#fff' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryItem: { width: '22%', alignItems: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    categoryItemActive: { backgroundColor: Colors.secondary + '08', borderColor: Colors.secondary + '30' },
    categoryIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
    categoryEmoji: { fontSize: 22 },
    categoryLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },
    footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card },
    submitBtn: { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    submitAmount: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
});
