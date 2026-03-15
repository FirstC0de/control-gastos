import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Income } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import IncomeFormModal from '../../components/IncomeFormModal';

const TYPE_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  sales:   'Ventas',
  other:   'Otro',
};

const fmt = (n: number, currency: 'ARS' | 'USD' = 'ARS') =>
  currency === 'USD'
    ? `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export default function IngresosScreen() {
  const { monthlyIncomes, deleteIncome, categories } = useFinance();
  const { blue } = useExchangeRate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() =>
    search
      ? monthlyIncomes.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
      : monthlyIncomes,
    [monthlyIncomes, search]
  );

  const total = useMemo(() =>
    filtered.reduce((sum, i) => {
      const amt = i.currency === 'USD' ? i.amount * (blue || 1) : i.amount;
      return sum + amt;
    }, 0),
    [filtered, blue]
  );

  const getCat = (id?: string | null) => categories.find(c => c.id === id);

  const confirmDelete = (income: Income) => {
    Alert.alert(
      'Eliminar ingreso',
      `¿Eliminar "${income.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteIncome(income.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Income }) => {
    const cat = getCat(item.categoryId);
    const isUSD = item.currency === 'USD';

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onLongPress={() => confirmDelete(item)}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{cat?.icon || '💰'}</Text>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.metaDate}>
              {new Date(item.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{TYPE_LABELS[item.type] || item.type}</Text>
            </View>
            {cat && (
              <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
                <Text style={[styles.catText, { color: cat.color }]}>{cat.name}</Text>
              </View>
            )}
            {item.recurring && (
              <View style={styles.recurBadge}>
                <Text style={styles.recurText}>↻</Text>
              </View>
            )}
          </View>
        </View>

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
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ingresos..."
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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'Sin resultados' : 'No hay ingresos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Probá con otra búsqueda' : 'Tocá + para registrar un ingreso'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <IncomeFormModal visible={showForm} onClose={() => setShowForm(false)} />
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
    backgroundColor: Colors.secondary + '15', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.secondary + '30',
  },
  totalText: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  listContent: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card,
  },
  itemPressed: { backgroundColor: '#f0fdf4' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 18 },
  itemContent: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  metaDate: { fontSize: 12, color: Colors.textMuted },
  typeBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  catText: { fontSize: 11, fontWeight: '600' },
  recurBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  recurText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  amountCol: { alignItems: 'flex-end', marginLeft: 8, flexShrink: 0 },
  amount: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  amountUSD: { color: '#0d9488' },
  amountARS: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.secondary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
