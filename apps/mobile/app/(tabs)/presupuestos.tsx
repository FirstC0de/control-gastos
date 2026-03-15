import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { BudgetStatus } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import BudgetFormModal from '../../components/BudgetFormModal';

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

const STATUS_COLOR: Record<string, string> = {
  ok:       Colors.secondary,
  warning:  Colors.warning,
  exceeded: Colors.danger,
};

const STATUS_LABEL: Record<string, string> = {
  ok:       'OK',
  warning:  'Por superar',
  exceeded: 'Excedido',
};

export default function PresupuestosScreen() {
  const { getBudgetStatus, deleteBudget, copyBudgetsFromPreviousMonth, monthlyBudgets } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const statuses = getBudgetStatus();

  const totalBudget = statuses.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent  = statuses.reduce((s, b) => s + b.spentAmount, 0);
  const totalPct    = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleDelete = (bs: BudgetStatus) => {
    Alert.alert(
      'Eliminar presupuesto',
      `¿Eliminar "${bs.budget.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteBudget(bs.budget.id) },
      ]
    );
  };

  const handleCopy = async () => {
    Alert.alert(
      'Copiar presupuestos',
      '¿Copiar los presupuestos del mes anterior a este mes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Copiar', onPress: async () => {
            const n = await copyBudgetsFromPreviousMonth();
            Alert.alert('Listo', n > 0 ? `${n} presupuesto${n > 1 ? 's' : ''} copiado${n > 1 ? 's' : ''}` : 'No hay presupuestos nuevos para copiar');
          },
        },
      ]
    );
  };

  const handleEdit = (bs: BudgetStatus) => {
    setEditing(bs.budget);
    setShowForm(true);
  };

  const renderItem = ({ item }: { item: BudgetStatus }) => {
    const color = STATUS_COLOR[item.status];
    const pct   = Math.min(item.percentageUsed, 100);

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleEdit(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemName} numberOfLines={1}>{item.budget.name}</Text>
            {item.categoryName && (
              <Text style={styles.itemCategory}>{item.categoryName}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.spentText}>
            {fmt(item.spentAmount)} <Text style={styles.ofText}>de {fmt(item.budgetAmount)}</Text>
          </Text>
          <Text style={[styles.remainText, { color: item.remaining < 0 ? Colors.danger : Colors.textSecondary }]}>
            {item.remaining >= 0 ? `Resta ${fmt(item.remaining)}` : `Excedido ${fmt(Math.abs(item.remaining))}`}
          </Text>
        </View>

        {item.budget.recurring && (
          <Text style={styles.recurringBadge}>Mensual</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Resumen total */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total presupuestado</Text>
            <Text style={styles.summaryTotal}>{fmt(totalBudget)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Gastado</Text>
            <Text style={[styles.summaryTotal, { color: totalPct > 100 ? Colors.danger : totalPct > 80 ? Colors.warning : Colors.secondary }]}>
              {fmt(totalSpent)}
            </Text>
          </View>
        </View>

        {totalBudget > 0 && (
          <View style={styles.totalProgressTrack}>
            <View style={[styles.totalProgressBar, {
              width: `${Math.min(totalPct, 100)}%` as any,
              backgroundColor: totalPct > 100 ? Colors.danger : totalPct > 80 ? Colors.warning : Colors.secondary,
            }]} />
          </View>
        )}

        {monthlyBudgets.length > 0 && (
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>Copiar del mes anterior</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={statuses}
        keyExtractor={item => item.budget.id}
        renderItem={renderItem}
        contentContainerStyle={statuses.length === 0 ? styles.emptyContainer : styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Sin presupuestos</Text>
            <Text style={styles.emptySubtitle}>Tocá + para crear un presupuesto mensual</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setShowForm(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <BudgetFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  summaryCard: { backgroundColor: Colors.primaryDark, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 2 },
  summaryTotal: { color: '#fff', fontSize: 22, fontWeight: '700' },
  totalProgressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  totalProgressBar: { height: '100%', borderRadius: 3 },
  copyBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  copyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  listContent: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },

  item: { backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14 },
  itemPressed: { backgroundColor: '#f0f9ff' },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  itemCategory: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },

  progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 3 },

  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spentText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  ofText: { fontWeight: '400', color: Colors.textMuted },
  remainText: { fontSize: 12, fontWeight: '600' },

  recurringBadge: { fontSize: 10, color: Colors.primary, fontWeight: '600', marginTop: 6 },

  separator: { height: 1, backgroundColor: Colors.border },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
