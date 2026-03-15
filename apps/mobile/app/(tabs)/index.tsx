import { useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Colors } from '../../constants/Colors';
import { SkeletonHeroCard, SkeletonChip, SkeletonList } from '../../components/Skeleton';

const fmtARS = (n: number) =>
    `$${Math.round(Math.abs(n)).toLocaleString('es-AR')}`;

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DashboardScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const {
        getTotalIncome, getTotalExpenses, getBalance,
        monthlyExpenses, monthlyIncomes,
        selectedMonth, setSelectedMonth,
        savings, getPortfolioSummary,
        cards, dataLoading,
    } = useFinance();
    const { blue, loading: rateLoading, refresh: refreshRate } = useExchangeRate();

    const balance = getBalance();
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const isPositive = balance >= 0;
    const savings_total = savings.reduce((s, sv) => s + (sv.balance ?? 0), 0);
    const portfolio = getPortfolioSummary();
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1)
        .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        const { year, month } = selectedMonth;
        setSelectedMonth(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
    };
    const nextMonth = () => {
        const { year, month } = selectedMonth;
        setSelectedMonth(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
    };

    const onRefresh = useCallback(async () => {
        await refreshRate();
    }, [refreshRate]);

    // Últimos movimientos (gastos + ingresos mezclados, ordenados por fecha desc)
    const recent = [
        ...monthlyExpenses.slice(0, 8).map(e => ({ ...e, _kind: 'expense' as const })),
        ...monthlyIncomes.slice(0, 3).map(i => ({ ...i, _kind: 'income' as const })),
    ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);

    const nextClosingCard = cards.reduce<{ name: string; day: number } | null>((found, c) => {
        const today = new Date().getDate();
        const diff = c.closingDay >= today ? c.closingDay - today : 31 - today + c.closingDay;
        if (!found || diff < (found.day - new Date().getDate())) return { name: c.name, day: c.closingDay };
        return found;
    }, null);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={rateLoading} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
            {/* Greeting */}
            <View style={styles.greeting}>
                <View>
                    <Text style={styles.greetingHello}>Hola, {user?.displayName?.split(' ')[0] ?? 'hola'} 👋</Text>
                    <Text style={styles.greetingDate}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.avatarBtn}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Hero Card */}
            {dataLoading ? <SkeletonHeroCard /> : <View style={[styles.heroCard, { backgroundColor: isPositive ? Colors.primaryDark : '#7f1d1d' }]}>
                {/* Month selector */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.monthArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthLabel} numberOfLines={1}>{monthLabel}</Text>
                    <TouchableOpacity onPress={nextMonth} style={styles.monthBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.monthArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.heroLabel}>Balance del mes</Text>
                <Text style={styles.heroAmount}>
                    {isPositive ? '' : '-'}{fmtARS(balance)}
                </Text>

                <View style={styles.heroRow}>
                    <View style={styles.heroChip}>
                        <Text style={styles.heroChipLabel}>↑ Ingresos</Text>
                        <Text style={styles.heroChipValue}>{fmtARS(totalIncome)}</Text>
                    </View>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
                        <Text style={styles.heroChipLabel}>↓ Gastos</Text>
                        <Text style={styles.heroChipValue}>{fmtARS(totalExpenses)}</Text>
                    </View>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                        <Text style={styles.heroChipLabel}>Ahorro</Text>
                        <Text style={[styles.heroChipValue, { color: savingsRate >= 20 ? '#6ee7b7' : savingsRate >= 0 ? '#fff' : '#fca5a5' }]}>
                            {savingsRate}%
                        </Text>
                    </View>
                </View>

                {blue && (
                    <Text style={styles.blueRate}>USD blue: ${blue.toLocaleString('es-AR')}</Text>
                )}
            </View>}

            {/* Quick chips grid */}
            {dataLoading ? (
                <View style={styles.chipsGrid}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonChip key={i} />)}
                </View>
            ) : <View style={styles.chipsGrid}>
                <QuickChip
                    emoji="💸" label="Gastos" sub={`${monthlyExpenses.length} este mes`}
                    color={Colors.danger} onPress={() => router.push('/(tabs)/gastos')}
                />
                <QuickChip
                    emoji="💰" label="Ingresos" sub={fmtARS(totalIncome)}
                    color={Colors.secondary} onPress={() => router.push('/(tabs)/ingresos')}
                />
                <QuickChip
                    emoji="🏦" label="Ahorros" sub={`${fmtARS(savings_total)}`}
                    color="#8b5cf6" onPress={() => router.push('/(tabs)/ahorros')}
                />
                <QuickChip
                    emoji="📊" label="Presupuestos" sub="Ver estado"
                    color={Colors.primary} onPress={() => router.push('/(tabs)/presupuestos')}
                />
                <QuickChip
                    emoji="💳" label="Tarjetas" sub={`${cards.length} activas`}
                    color="#0ea5e9" onPress={() => router.push('/(tabs)/tarjetas')}
                />
                <QuickChip
                    emoji="📈" label="Inversiones" sub={`$${Math.round(portfolio.grandTotal).toLocaleString('es-AR')}`}
                    color={Colors.warning} onPress={() => router.push('/(tabs)/inversiones')}
                />
            </View>}

            {/* Últimos movimientos */}
            {dataLoading ? (
                <View style={[styles.section, { marginTop: 20 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Últimos movimientos</Text>
                    </View>
                    <SkeletonList rows={5} />
                </View>
            ) : recent.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Últimos movimientos</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/gastos')}>
                            <Text style={styles.seeAll}>Ver todos →</Text>
                        </TouchableOpacity>
                    </View>

                    {recent.map((item, i) => {
                        const isIncome = item._kind === 'income';
                        const isLast = i === recent.length - 1;
                        return (
                            <View key={item.id} style={[styles.txRow, isLast && styles.txRowLast]}>
                                <View style={[styles.txDot, { backgroundColor: isIncome ? Colors.secondary : Colors.danger }]} />
                                <View style={styles.txInfo}>
                                    <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                                    <Text style={styles.txDate}>
                                        {new Date(item.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                        {isIncome ? '' : ` · ${(item as any).currency ?? 'ARS'}`}
                                    </Text>
                                </View>
                                <Text style={[styles.txAmount, { color: isIncome ? Colors.secondary : Colors.text }]}>
                                    {isIncome ? '+' : '-'}{fmtARS(item.amount)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {!dataLoading && recent.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>Sin movimientos este mes</Text>
                    <Text style={styles.emptySub}>Tocá el botón + para registrar tu primer gasto o ingreso</Text>
                </View>
            )}

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

function QuickChip({ emoji, label, sub, color, onPress }: {
    emoji: string; label: string; sub: string; color: string; onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={onPress}
        >
            <View style={[styles.chipIcon, { backgroundColor: color + '15' }]}>
                <Text style={styles.chipEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.chipLabel}>{label}</Text>
            <Text style={styles.chipSub} numberOfLines={1}>{sub}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 32 },

    greeting: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    },
    greetingHello: { fontSize: 22, fontWeight: '700', color: Colors.text },
    greetingDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
    avatarBtn: { padding: 2 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    heroCard: {
        marginHorizontal: 16, borderRadius: 20, padding: 20,
        shadowColor: Colors.primaryDark, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    monthBtn: { padding: 4 },
    monthArrow: { fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    monthLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize', flex: 1, textAlign: 'center' },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
    heroAmount: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 16 },
    heroRow: { flexDirection: 'row', gap: 8 },
    heroChip: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12, padding: 10, alignItems: 'center',
    },
    heroChipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 3, fontWeight: '500' },
    heroChipValue: { fontSize: 13, color: '#fff', fontWeight: '700' },
    blueRate: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 12, textAlign: 'center' },

    chipsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
        paddingHorizontal: 16, marginTop: 16,
    },
    chip: {
        width: '30.5%', backgroundColor: Colors.card, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: Colors.border,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    chipPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
    chipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    chipEmoji: { fontSize: 20 },
    chipLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    chipSub: { fontSize: 11, color: Colors.textMuted },

    section: {
        marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.card,
        borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

    txRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    txRowLast: { borderBottomWidth: 0 },
    txDot: { width: 8, height: 8, borderRadius: 4 },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
    txDate: { fontSize: 12, color: Colors.textMuted, marginTop: 1, textTransform: 'capitalize' },
    txAmount: { fontSize: 14, fontWeight: '700' },

    emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
