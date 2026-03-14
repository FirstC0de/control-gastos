import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Expense } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import ExpenseFormModal from '../../components/ExpenseFormModal';

const fmt = (n: number, currency: 'ARS' | 'USD' = 'ARS') =>
  currency === 'USD'
    ? `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export default function GastosScreen() {
  const { monthlyExpenses, deleteExpense, categories } = useFinance();
  const { blue } = useExchangeRate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  const getCat = (id?: string | null) => categories.find(c => c.id === id);

  const confirmDelete = (expense: Expense) => {
    Alert.alert(
      'Eliminar gasto',
      `¿Eliminar "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const cat = getCat(item.categoryId);
    const isUSD = item.currency === 'USD';

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onLongPress={() => confirmDelete(item)}
      >
        {/* Dot de categoría */}
        <View style={[styles.dot, { backgroundColor: cat?.color || Colors.border }]} />

        {/* Info */}
        <View style={styles.itemContent}>
          <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.metaDate}>
              {new Date(item.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </Text>
            {cat && (
              <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
                <Text style={[styles.catText, { color: cat.color }]}>{cat.name}</Text>
              </View>
            )}
            {item.installments && item.installments > 1 && (
              <View style={styles.instBadge}>
                <Text style={styles.instText}>{item.currentInstallment}/{item.installments}</Text>
              </View>
            )}
            {item.recurring && (
              <View style={styles.recurBadge}>
                <Text style={styles.recurText}>↻</Text>
              </View>
            )}
          </View>
        </View>

        {/* Monto */}
        <View style={styles.amountCol}>
          <Text style={[styles.amount, isUSD && styles.amountUSD]}>
            {fmt(item.amount, item.currency as 'ARS' | 'USD')}
          </Text>
          {isUSD && blue && (
            <Text style={styles.amountARS}>≈ ${(item.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda + total */}
      <View style={styles.topBar}>
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
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'Sin resultados' : 'No hay gastos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Probá con otra búsqueda' : 'Tocá + para agregar tu primer gasto'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal de nuevo gasto */}
      <ExpenseFormModal visible={showForm} onClose={() => setShowForm(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  search: { flex: 1, paddingVertical: 9, fontSize: 14, color: Colors.text },
  clearBtn: { fontSize: 14, color: Colors.textMuted, padding: 4 },
  totalPill: {
    backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  totalText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  listContent: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  itemPressed: { backgroundColor: '#f0f4ff' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, flexShrink: 0 },
  itemContent: { flex: 1, minWidth: 0 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  metaDate: { fontSize: 12, color: Colors.textMuted },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  catText: { fontSize: 11, fontWeight: '600' },
  instBadge: { backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  instText: { fontSize: 11, color: '#d97706', fontWeight: '600' },
  recurBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  recurText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  amountCol: { alignItems: 'flex-end', marginLeft: 8, flexShrink: 0 },
  amount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  amountUSD: { color: Colors.secondary },
  amountARS: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 38 },
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
