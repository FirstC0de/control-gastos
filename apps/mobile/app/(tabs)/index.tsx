import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Colors } from '../../constants/Colors';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { getTotalIncome, getTotalExpenses, getBalance, monthlyExpenses, selectedMonth, setSelectedMonth } = useFinance();
  const { blue } = useExchangeRate();

  const balance = getBalance();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const isPositive = balance >= 0;

  const prevMonth = () => {
    const { year, month } = selectedMonth;
    if (month === 0) setSelectedMonth({ year: year - 1, month: 11 });
    else setSelectedMonth({ year, month: month - 1 });
  };

  const nextMonth = () => {
    const { year, month } = selectedMonth;
    if (month === 11) setSelectedMonth({ year: year + 1, month: 0 });
    else setSelectedMonth({ year, month: month + 1 });
  };

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navegador de mes */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: isPositive ? Colors.primaryDark : '#7f1d1d' }]}>
        <Text style={styles.balanceLabel}>Balance del mes</Text>
        <Text style={styles.balanceAmount}>{fmt(balance)}</Text>
        {blue && (
          <Text style={styles.blueRate}>USD blue: ${blue.toLocaleString('es-AR')}</Text>
        )}
      </View>

      {/* Ingresos / Gastos */}
      <View style={styles.row}>
        <SummaryTile label="Ingresos" value={fmt(totalIncome)} color={Colors.secondary} />
        <SummaryTile label="Gastos" value={fmt(totalExpenses)} color={Colors.danger} />
      </View>

      {/* Últimos gastos */}
      {monthlyExpenses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos gastos</Text>
          {monthlyExpenses.slice(0, 5).map(e => (
            <View key={e.id} style={styles.expenseRow}>
              <Text style={styles.expenseDesc} numberOfLines={1}>{e.description}</Text>
              <Text style={styles.expenseAmount}>{fmt(e.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthBtn: { padding: 8 },
  monthBtnText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
  monthLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  balanceCard: {
    borderRadius: 12, padding: 20, alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700' },
  blueRate: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  tileValue: { fontSize: 16, fontWeight: '700' },
  section: { backgroundColor: Colors.card, borderRadius: 10, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  expenseRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  expenseDesc: { flex: 1, fontSize: 14, color: Colors.text, marginRight: 8 },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  logoutBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: Colors.textMuted, fontSize: 14 },
});
