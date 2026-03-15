import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Saving } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import SavingFormModal from '../../components/SavingFormModal';

const TYPE_ICONS: Record<string, string> = {
  account: '🏦',
  cash:    '💵',
  wallet:  '👛',
  goal:    '🎯',
};

const TYPE_LABELS: Record<string, string> = {
  account: 'Cuenta',
  cash:    'Efectivo',
  wallet:  'Billetera',
  goal:    'Meta',
};

const fmt = (n: number, currency: 'ARS' | 'USD' = 'ARS') =>
  currency === 'USD'
    ? `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export default function AhorrosScreen() {
  const { savings, deleteSaving, getSavingsSummary } = useFinance();
  const { blue } = useExchangeRate();
  const [showForm, setShowForm] = useState(false);

  const summary = getSavingsSummary();

  const confirmDelete = (saving: Saving) => {
    Alert.alert(
      'Eliminar ahorro',
      `¿Eliminar "${saving.name}"? Se perderá el historial de transacciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteSaving(saving.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Saving }) => {
    const isGoal = item.type === 'goal' && item.goalAmount;
    const progress = isGoal ? Math.min(item.balance / item.goalAmount!, 1) : null;
    const valueInARS = item.currency === 'USD' ? item.balance * (blue || 1) : item.balance;

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onLongPress={() => confirmDelete(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: item.color + '25' }]}>
          <Text style={styles.icon}>{TYPE_ICONS[item.type] || '💰'}</Text>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.itemMeta}>
            <View style={[styles.typeBadge, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.typeText, { color: item.color }]}>{TYPE_LABELS[item.type]}</Text>
            </View>
            {item.institution && (
              <Text style={styles.institution}>{item.institution}</Text>
            )}
          </View>

          {/* Barra de progreso para metas */}
          {isGoal && progress !== null && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` as any, backgroundColor: item.color }]} />
              </View>
              <Text style={[styles.progressLabel, { color: item.color }]}>
                {Math.round(progress * 100)}% de {fmt(item.goalAmount!, item.currency as 'ARS' | 'USD')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.amountCol}>
          <Text style={[styles.amount, { color: item.color }]}>
            {fmt(item.balance, item.currency as 'ARS' | 'USD')}
          </Text>
          {item.currency === 'USD' && blue && (
            <Text style={styles.amountARS}>≈ ${valueInARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Resumen total */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total ahorros</Text>
        <Text style={styles.summaryTotal}>
          ${summary.totalConverted.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>ARS</Text>
            <Text style={styles.summaryChipValue}>
              ${summary.totalARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.summaryChipLabel}>USD</Text>
            <Text style={styles.summaryChipValue}>
              U$D {summary.totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={savings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={savings.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyTitle}>Sin ahorros registrados</Text>
            <Text style={styles.emptySubtitle}>Tocá + para agregar una cuenta de ahorro</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <SavingFormModal visible={showForm} onClose={() => setShowForm(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryCard: {
    backgroundColor: Colors.primaryDark, padding: 20,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 4 },
  summaryTotal: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryChip: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  summaryChipLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  summaryChipValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.card,
  },
  itemPressed: { backgroundColor: '#f5f3ff' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 20 },
  itemContent: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  itemMeta: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '600' },
  institution: { fontSize: 12, color: Colors.textMuted },
  progressWrap: { marginTop: 6 },
  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  progressBar: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  amountCol: { alignItems: 'flex-end', marginLeft: 8 },
  amount: { fontSize: 15, fontWeight: '700' },
  amountARS: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 68 },
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
