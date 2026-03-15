import { useState, useMemo, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, Pressable, RefreshControl, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Expense, Income } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import PDFImporterModal from '../../components/PDFImporterModal';
import Toast, { useToast } from '../../components/Toast';
import { SkeletonList } from '../../components/Skeleton';
import TransactionDetailSheet from '../../components/TransactionDetailSheet';

const fmt = (n: number, currency: 'ARS' | 'USD' = 'ARS') =>
    currency === 'USD'
        ? `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

type GroupedItem = { type: 'header'; date: string; label: string } | { type: 'expense'; data: Expense };

export default function GastosScreen() {
    const { monthlyExpenses, deleteExpense, categories, selectedMonth, setSelectedMonth, dataLoading } = useFinance();
    const { blue, loading: rateLoading, refresh: refreshRate } = useExchangeRate();
    const [search, setSearch] = useState('');
    const [showPDF, setShowPDF] = useState(false);
    const [selectedTx, setSelectedTx] = useState<{ kind: 'expense'; data: Expense } | { kind: 'income'; data: Income } | null>(null);
    const { toast, show: showToast, hide: hideToast } = useToast();
    const openSwipeables = useRef<Map<string, Swipeable>>(new Map());

    const filtered = useMemo(() =>
        search
            ? monthlyExpenses.filter(e => e.description.toLowerCase().includes(search.toLowerCase()))
            : monthlyExpenses,
        [monthlyExpenses, search]
    );

    const total = useMemo(() =>
        filtered.reduce((sum, e) => {
            const amt = e.currency === 'USD' ? e.amount * (blue || 1) : e.amount;
            return sum + amt;
        }, 0),
        [filtered, blue]
    );

    // Agrupar por fecha con sticky headers
    const grouped = useMemo<GroupedItem[]>(() => {
        const result: GroupedItem[] = [];
        let lastDate = '';
        const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
        for (const expense of sorted) {
            if (expense.date !== lastDate) {
                lastDate = expense.date;
                const d = new Date(expense.date + 'T12:00:00');
                const today = new Date();
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                let label: string;
                if (d.toDateString() === today.toDateString()) label = 'Hoy';
                else if (d.toDateString() === yesterday.toDateString()) label = 'Ayer';
                else label = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                result.push({ type: 'header', date: expense.date, label });
            }
            result.push({ type: 'expense', data: expense });
        }
        return result;
    }, [filtered]);

    const handleDelete = useCallback(async (expense: Expense) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await deleteExpense(expense.id);
        showToast(`"${expense.description}" eliminado`, 'success');
    }, [deleteExpense, showToast]);

    const onRefresh = useCallback(async () => {
        await refreshRate();
    }, [refreshRate]);

    const closeAllSwipeables = useCallback((exceptId?: string) => {
        openSwipeables.current.forEach((sw, id) => {
            if (id !== exceptId) sw.close();
        });
    }, []);

    const prevMonth = () => {
        const { year, month } = selectedMonth;
        setSelectedMonth(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
    };
    const nextMonth = () => {
        const { year, month } = selectedMonth;
        setSelectedMonth(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
    };
    const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1)
        .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const getCat = (id?: string | null) => categories.find(c => c.id === id);

    const renderRightActions = (expense: Expense, progress: Animated.AnimatedInterpolation<number>) => {
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
        const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });
        return (
            <Animated.View style={[styles.swipeAction, { transform: [{ scale }], opacity }]}>
                <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() => handleDelete(expense)}
                >
                    <Text style={styles.deleteActionIcon}>🗑</Text>
                    <Text style={styles.deleteActionText}>Eliminar</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderItem = ({ item }: { item: GroupedItem }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>{item.label}</Text>
                </View>
            );
        }

        const expense = item.data;
        const cat = getCat(expense.categoryId);
        const isUSD = expense.currency === 'USD';

        return (
            <Swipeable
                ref={ref => {
                    if (ref) openSwipeables.current.set(expense.id, ref);
                    else openSwipeables.current.delete(expense.id);
                }}
                renderRightActions={(progress) => renderRightActions(expense, progress)}
                onSwipeableOpen={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    closeAllSwipeables(expense.id);
                }}
                rightThreshold={60}
                overshootRight={false}
                friction={2}
            >
                <Pressable
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTx({ kind: 'expense', data: expense });
                    }}
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        openSwipeables.current.get(expense.id)?.openRight();
                    }}
                >
                    {/* Color dot de categoría */}
                    <View style={[styles.catDot, { backgroundColor: cat?.color || Colors.border }]}>
                        {cat?.icon ? (
                            <Text style={styles.catEmoji}>{cat.icon}</Text>
                        ) : (
                            <Text style={styles.catEmoji}>💸</Text>
                        )}
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={styles.itemDesc} numberOfLines={1}>{expense.description}</Text>
                        <View style={styles.itemMeta}>
                            {cat && (
                                <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
                                    <Text style={[styles.catText, { color: cat.color }]}>{cat.name}</Text>
                                </View>
                            )}
                            {expense.installments && expense.installments > 1 && (
                                <View style={styles.installBadge}>
                                    <Text style={styles.installText}>{expense.currentInstallment}/{expense.installments}</Text>
                                </View>
                            )}
                            {expense.recurring && (
                                <View style={styles.recurBadge}>
                                    <Text style={styles.recurText}>↻</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.amountCol}>
                        <Text style={[styles.amount, isUSD && styles.amountUSD]}>
                            {fmt(expense.amount, expense.currency as 'ARS' | 'USD')}
                        </Text>
                        {isUSD && blue && (
                            <Text style={styles.amountARS}>≈ ${(expense.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</Text>
                        )}
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.monthArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                    <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.monthArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search + total */}
            <View style={styles.searchBar}>
                <View style={styles.searchWrap}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.search}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Buscar gastos..."
                        placeholderTextColor={Colors.textMuted}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text style={styles.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.totalPill}>
                    <Text style={styles.totalText}>{fmt(total)}</Text>
                </View>
                <TouchableOpacity style={styles.pdfBtn} onPress={() => setShowPDF(true)}>
                    <Text style={styles.pdfBtnText}>📄</Text>
                </TouchableOpacity>
            </View>

            {/* Hint swipe */}
            {!dataLoading && grouped.length > 0 && (
                <View style={styles.hintBar}>
                    <Text style={styles.hintText}>← Deslizá para eliminar · Long press para acciones</Text>
                </View>
            )}

            {/* Skeleton mientras carga */}
            {dataLoading && <SkeletonList rows={7} />}

            {/* Lista */}
            {!dataLoading && <FlatList
                data={grouped}
                keyExtractor={(item, i) => item.type === 'header' ? `h-${item.date}` : `e-${item.data.id}`}
                renderItem={renderItem}
                contentContainerStyle={grouped.length === 0 ? styles.emptyContainer : styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={rateLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>💸</Text>
                        <Text style={styles.emptyTitle}>
                            {search ? 'Sin resultados' : 'No hay gastos este mes'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {search ? 'Probá con otra búsqueda' : 'Usá el botón + para agregar uno'}
                        </Text>
                    </View>
                }
            />}

            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
            <PDFImporterModal visible={showPDF} onClose={() => setShowPDF(false)} />
            <TransactionDetailSheet
                transaction={selectedTx}
                onClose={() => setSelectedTx(null)}
                onDeleted={() => showToast('Transacción eliminada', 'success')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    topBar: {
        backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    monthArrow: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
    monthLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, textTransform: 'capitalize', minWidth: 160, textAlign: 'center' },

    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    searchWrap: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 10,
        borderWidth: 1, borderColor: Colors.border, height: 38,
    },
    searchIcon: { fontSize: 13, marginRight: 6 },
    search: { flex: 1, fontSize: 14, color: Colors.text },
    clearBtn: { fontSize: 14, color: Colors.textMuted, paddingHorizontal: 4 },
    totalPill: {
        backgroundColor: Colors.danger + '15', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.danger + '30',
    },
    totalText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
    pdfBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    pdfBtnText: { fontSize: 18 },

    hintBar: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.background },
    hintText: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

    listContent: { paddingBottom: 100 },
    emptyContainer: { flex: 1, justifyContent: 'center' },

    dateHeader: {
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
        backgroundColor: Colors.background,
    },
    dateHeaderText: {
        fontSize: 12, fontWeight: '700', color: Colors.textMuted,
        textTransform: 'capitalize', letterSpacing: 0.3,
    },

    item: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    itemPressed: { backgroundColor: '#f8fafc' },

    catDot: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    catEmoji: { fontSize: 18 },

    itemContent: { flex: 1, minWidth: 0 },
    itemDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
    itemMeta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
    catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    catText: { fontSize: 11, fontWeight: '600' },
    installBadge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    installText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
    recurBadge: { backgroundColor: Colors.secondary + '15', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    recurText: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },

    amountCol: { alignItems: 'flex-end', flexShrink: 0 },
    amount: { fontSize: 14, fontWeight: '700', color: Colors.text },
    amountUSD: { color: Colors.secondary },
    amountARS: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

    swipeAction: {
        justifyContent: 'center', alignItems: 'flex-end',
        backgroundColor: Colors.background,
    },
    deleteAction: {
        backgroundColor: Colors.danger, width: 80,
        height: '100%', alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    deleteActionIcon: { fontSize: 20 },
    deleteActionText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    empty: { alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
