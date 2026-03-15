import { useState, useEffect, useRef } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    Animated, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFinance } from '../context/FinanceContext';
import { Colors } from '../constants/Colors';
import { Currency } from '@controlados/shared';
import NumericKeyboard, { formatAmountDisplay, parseRawAmount } from './NumericKeyboard';

type Props = { visible: boolean; onClose: () => void };

const QUICK_INSTALLMENTS = [1, 3, 6, 12, 18, 24];

export default function ExpenseFormModal({ visible, onClose }: Props) {
    const { addExpense, categories, cards, selectedMonth, suggestCategory } = useFinance();

    // ── Estado del formulario ──────────────────────────────────────────
    const [rawAmount, setRawAmount]       = useState('');
    const [currency, setCurrency]         = useState<Currency>('ARS');
    const [description, setDescription]  = useState('');
    const [date, setDate]                 = useState('');
    const [categoryId, setCategoryId]     = useState<string | null>(null);
    const [cardId, setCardId]             = useState<string | null>(null);
    const [installments, setInstallments] = useState(1);
    const [recurring, setRecurring]       = useState(false);
    const [loading, setLoading]           = useState(false);

    // ── Fase: 'amount' (teclado custom) | 'details' (formulario) ──────
    const [phase, setPhase] = useState<'amount' | 'details'>('amount');
    const slideAnim = useRef(new Animated.Value(0)).current;

    const goToDetails = () => {
        setPhase('details');
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 9 }).start();
    };
    const goToAmount = () => {
        setPhase('amount');
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 9 }).start();
    };

    // ── Auto-sugerir categoría ─────────────────────────────────────────
    useEffect(() => {
        if (description.length > 2) {
            const suggested = suggestCategory(description, 'expense');
            if (suggested) setCategoryId(suggested);
        }
    }, [description]);

    // ── Reset al abrir ─────────────────────────────────────────────────
    useEffect(() => {
        if (visible) {
            const today = new Date();
            const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setRawAmount(''); setCurrency('ARS'); setDescription(''); setDate(d);
            setCategoryId(null); setCardId(null); setInstallments(1); setRecurring(false);
            setPhase('amount');
            slideAnim.setValue(0);
        }
    }, [visible]);

    // ── Submit ─────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!description.trim()) { Alert.alert('Error', 'Ingresá una descripción'); return; }
        const parsedAmount = parseRawAmount(rawAmount);
        if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }

        setLoading(true);
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const monthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
            await addExpense({
                description: description.trim(),
                amount: parsedAmount,
                date,
                categoryId: categoryId ?? undefined,
                cardId: cardId ?? undefined,
                installments: recurring ? 1 : installments,
                currentInstallment: 1,
                installmentAmount: installments > 1
                    ? parseFloat((parsedAmount / installments).toFixed(2))
                    : parsedAmount,
                currency,
                recurring: recurring || undefined,
                monthYear,
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
        } catch {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'No se pudo guardar el gasto');
        } finally {
            setLoading(false);
        }
    };

    const expenseCategories = categories.filter(
        c => c.isActive !== false && (c.type === 'expense' || c.type === 'both')
    );
    const parsedAmount = parseRawAmount(rawAmount);
    const hasAmount = parsedAmount > 0;

    // ── Animación slide ─────────────────────────────────────────────────
    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -400],
    });

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>

                    {/* ── HEADER ──────────────────────────────────────── */}
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        {phase === 'details' ? (
                            <TouchableOpacity onPress={goToAmount} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={styles.headerBack}>‹ Monto</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.headerBtn} />
                        )}

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Nuevo gasto</Text>
                            <View style={styles.stepDots}>
                                <View style={[styles.dot, phase === 'amount' && styles.dotActive]} />
                                <View style={[styles.dot, phase === 'details' && styles.dotActive]} />
                            </View>
                        </View>

                        <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={styles.headerClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── DISPLAY DE MONTO (siempre visible) ──────────── */}
                    <TouchableOpacity
                        style={[styles.amountDisplay, phase === 'amount' && styles.amountDisplayActive]}
                        onPress={goToAmount}
                        activeOpacity={phase === 'details' ? 0.7 : 1}
                    >
                        <Text style={[styles.amountText, !hasAmount && styles.amountPlaceholder]}>
                            {formatAmountDisplay(rawAmount, currency)}
                        </Text>
                        {phase === 'details' && installments > 1 && (
                            <Text style={styles.amountSub}>
                                {installments} cuotas de {currency === 'USD' ? 'U$D ' : '$'}
                                {(parsedAmount / installments).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </Text>
                        )}
                        {phase === 'details' && (
                            <Text style={styles.amountEdit}>Tocar para editar</Text>
                        )}
                    </TouchableOpacity>

                    {/* ── FASE AMOUNT: teclado custom ──────────────────── */}
                    {phase === 'amount' && (
                        <NumericKeyboard
                            value={rawAmount}
                            onChange={setRawAmount}
                            currency={currency}
                            onToggleCurrency={() => setCurrency(c => c === 'ARS' ? 'USD' : 'ARS')}
                            onConfirm={goToDetails}
                        />
                    )}

                    {/* ── FASE DETAILS: formulario ─────────────────────── */}
                    {phase === 'details' && (
                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Descripción */}
                            <Text style={styles.label}>¿En qué gastaste?</Text>
                            <TextInput
                                style={styles.input}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Supermercado, Netflix, Uber..."
                                placeholderTextColor={Colors.textMuted}
                                autoFocus
                                returnKeyType="done"
                            />

                            {/* Fecha */}
                            <Text style={styles.label}>Fecha</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                            />

                            {/* Tipo */}
                            <Text style={styles.label}>Tipo</Text>
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

                            {/* Cuotas */}
                            {!recurring && (
                                <>
                                    <Text style={styles.label}>Cuotas</Text>
                                    <View style={styles.installmentsRow}>
                                        {QUICK_INSTALLMENTS.map(n => (
                                            <TouchableOpacity
                                                key={n}
                                                style={[styles.installChip, installments === n && styles.installChipActive]}
                                                onPress={() => setInstallments(n)}
                                            >
                                                <Text style={[styles.installChipText, installments === n && styles.installChipTextActive]}>
                                                    {n === 1 ? 'Contado' : `${n}x`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Categoría — grid 4 columnas */}
                            <Text style={styles.label}>Categoría</Text>
                            <View style={styles.categoryGrid}>
                                <TouchableOpacity
                                    style={[styles.categoryItem, !categoryId && styles.categoryItemActive]}
                                    onPress={() => setCategoryId(null)}
                                >
                                    <View style={[styles.categoryIcon, !categoryId && { backgroundColor: Colors.primary + '20' }]}>
                                        <Text style={styles.categoryEmoji}>✦</Text>
                                    </View>
                                    <Text style={[styles.categoryLabel, !categoryId && { color: Colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                                        Ninguna
                                    </Text>
                                </TouchableOpacity>
                                {expenseCategories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoryItem, categoryId === cat.id && styles.categoryItemActive]}
                                        onPress={() => setCategoryId(cat.id)}
                                    >
                                        <View style={[
                                            styles.categoryIcon,
                                            { backgroundColor: cat.color + '20' },
                                            categoryId === cat.id && { backgroundColor: cat.color + '35' },
                                        ]}>
                                            <Text style={styles.categoryEmoji}>{cat.icon ?? '📁'}</Text>
                                        </View>
                                        <Text style={[
                                            styles.categoryLabel,
                                            categoryId === cat.id && { color: cat.color, fontWeight: '700' },
                                        ]} numberOfLines={1}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Tarjeta */}
                            {cards.length > 0 && (
                                <>
                                    <Text style={styles.label}>Tarjeta</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.pillsRow}>
                                            <TouchableOpacity
                                                style={[styles.pill, !cardId && styles.pillActive]}
                                                onPress={() => setCardId(null)}
                                            >
                                                <Text style={[styles.pillText, !cardId && styles.pillTextActive]}>💵 Efectivo</Text>
                                            </TouchableOpacity>
                                            {cards.map(card => (
                                                <TouchableOpacity
                                                    key={card.id}
                                                    style={[styles.pill, cardId === card.id && { backgroundColor: card.color + '25', borderColor: card.color }]}
                                                    onPress={() => setCardId(card.id)}
                                                >
                                                    <Text style={[styles.pillText, cardId === card.id && { color: card.color, fontWeight: '700' }]}>
                                                        💳 {card.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </>
                            )}

                            <View style={{ height: 16 }} />
                        </ScrollView>
                    )}

                    {/* ── FOOTER con botón guardar (solo en details) ─── */}
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
                                        <View style={styles.submitInner}>
                                            <Text style={styles.submitText}>Guardar gasto</Text>
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
    sheet: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
        overflow: 'hidden',
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerBtn: { width: 70 },
    headerBack: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
    headerClose: { fontSize: 16, color: Colors.textSecondary, textAlign: 'right' },
    headerCenter: { alignItems: 'center', gap: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    stepDots: { flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
    dotActive: { backgroundColor: Colors.primary, width: 18 },

    amountDisplay: {
        alignItems: 'center', paddingVertical: 20,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    amountDisplayActive: { backgroundColor: Colors.primary + '08' },
    amountText: {
        fontSize: 44, fontWeight: '800', color: Colors.text,
        letterSpacing: -1,
        fontVariant: ['tabular-nums'] as any,
    },
    amountPlaceholder: { color: Colors.border },
    amountSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
    amountEdit: { fontSize: 11, color: Colors.primary, marginTop: 6, fontWeight: '600' },

    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },

    label: {
        fontSize: 11, fontWeight: '700', color: Colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.7,
        marginTop: 16, marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: Colors.text,
    },

    segmented: {
        flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.border,
    },
    segment: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: Colors.background },
    segmentActive: { backgroundColor: Colors.primary },
    segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    segmentTextActive: { color: '#fff' },

    installmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    installChip: {
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    },
    installChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    installChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    installChipTextActive: { color: '#fff' },

    categoryGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    categoryItem: {
        width: '22%', alignItems: 'center', gap: 5,
        paddingVertical: 10, borderRadius: 12,
        borderWidth: 1, borderColor: 'transparent',
    },
    categoryItemActive: {
        backgroundColor: Colors.primary + '08',
        borderColor: Colors.primary + '30',
    },
    categoryIcon: {
        width: 48, height: 48, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.background,
    },
    categoryEmoji: { fontSize: 22 },
    categoryLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', fontWeight: '500' },

    pillsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    pill: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    },
    pillActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
    pillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    pillTextActive: { color: Colors.primary, fontWeight: '700' },

    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1, borderTopColor: Colors.border,
        backgroundColor: Colors.card,
    },
    submitBtn: {
        backgroundColor: Colors.primary, borderRadius: 14,
        paddingVertical: 15, alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitInner: { alignItems: 'center', gap: 2 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    submitAmount: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
});
