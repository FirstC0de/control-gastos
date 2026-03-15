import { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Pressable, Platform, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Expense, Income } from '@controlados/shared';
import { useFinance } from '../context/FinanceContext';

type Transaction =
    | { kind: 'expense'; data: Expense }
    | { kind: 'income'; data: Income };

type Props = {
    transaction: Transaction | null;
    onClose: () => void;
    onDeleted?: () => void;
};

const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

const fmtAmount = (amount: number, currency: string = 'ARS') =>
    currency === 'USD'
        ? `U$D ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        : `$${amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export default function TransactionDetailSheet({ transaction, onClose, onDeleted }: Props) {
    const { deleteExpense, deleteIncome, categories } = useFinance();
    const slideY = useRef(new Animated.Value(600)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const isOpen = transaction !== null;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideY, { toValue: 600, duration: 260, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }, [isOpen]);

    if (!transaction) return null;

    const isExpense = transaction.kind === 'expense';
    const data = transaction.data;
    const accentColor = isExpense ? Colors.danger : Colors.secondary;
    const cat = isExpense
        ? categories.find(c => c.id === (data as Expense).categoryId)
        : categories.find(c => c.id === (data as Income).categoryId);

    const handleDelete = () => {
        Alert.alert(
            'Eliminar transacción',
            `¿Eliminar "${isExpense ? (data as Expense).description : (data as Income).name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        if (isExpense) await deleteExpense(data.id);
                        else await deleteIncome(data.id);
                        onDeleted?.();
                        onClose();
                    },
                },
            ],
        );
    };

    const expense = isExpense ? (data as Expense) : null;
    const income = !isExpense ? (data as Income) : null;
    const title = expense?.description ?? income?.name ?? '';
    const amount = data.amount;
    const currency = (data as any).currency ?? 'ARS';
    const dateStr = data.date;

    return (
        <>
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, { opacity: backdropOpacity }]}
                pointerEvents={isOpen ? 'auto' : 'none'}
            >
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.kindBadge, { backgroundColor: accentColor + '18' }]}>
                        <Text style={[styles.kindText, { color: accentColor }]}>
                            {isExpense ? '💸 Gasto' : '💰 Ingreso'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.amountSection}>
                    <Text style={[styles.amount, { color: accentColor }]}>
                        {isExpense ? '-' : '+'}{fmtAmount(amount, currency)}
                    </Text>
                    <Text style={styles.title}>{title}</Text>
                </View>

                {/* Details */}
                <View style={styles.details}>
                    <Row label="Fecha" value={fmtDate(dateStr)} />

                    {cat && (
                        <Row
                            label="Categoría"
                            value={`${cat.icon ?? '📁'} ${cat.name}`}
                            valueColor={cat.color}
                        />
                    )}

                    {expense && expense.installments && expense.installments > 1 && (
                        <Row
                            label="Cuotas"
                            value={`${expense.currentInstallment ?? 1} de ${expense.installments}`}
                            valueColor={Colors.primary}
                        />
                    )}

                    {expense?.recurring && (
                        <Row label="Recurrente" value="↻ Sí, se repite mensualmente" valueColor={Colors.secondary} />
                    )}

                    {income?.type && (
                        <Row
                            label="Tipo"
                            value={income.type === 'monthly' ? '📅 Mensual' : income.type === 'sales' ? '🛒 Ventas' : '✦ Otro'}
                        />
                    )}

                    {currency === 'USD' && (
                        <Row label="Moneda" value="🇺🇸 Dólar (USD)" valueColor={Colors.secondary} />
                    )}
                </View>

                {/* Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
                        <Text style={styles.deleteBtnText}>🗑 Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </>
    );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        zIndex: 101,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 20,
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center', marginTop: 10,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    kindBadge: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
    },
    kindText: { fontSize: 13, fontWeight: '700' },
    closeBtn: {
        width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.background, borderRadius: 15,
    },
    closeBtnText: { fontSize: 14, color: Colors.textSecondary },

    amountSection: {
        alignItems: 'center', paddingVertical: 20,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        marginHorizontal: 20,
    },
    amount: { fontSize: 42, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
    title: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center' },

    details: {
        paddingHorizontal: 20, paddingTop: 8, gap: 2,
    },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    rowLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
    rowValue: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right', flex: 1, marginLeft: 16 },

    footer: { paddingHorizontal: 20, paddingTop: 20 },
    actionBtn: {
        borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    },
    deleteBtn: { backgroundColor: Colors.danger + '15', borderWidth: 1, borderColor: Colors.danger + '40' },
    deleteBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
