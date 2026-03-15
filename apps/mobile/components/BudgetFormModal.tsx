import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '@controlados/shared';
import { Colors } from '../constants/Colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  editing?: Budget | null;
};

export default function BudgetFormModal({ visible, onClose, editing }: Props) {
  const { categories, addBudget, updateBudget, selectedMonth } = useFinance();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId ?? null);
      setRecurring(editing.recurring ?? true);
      setAlertThreshold(String(editing.alertThreshold ?? 80));
    } else {
      setName('');
      setAmount('');
      setCategoryId(null);
      setRecurring(true);
      setAlertThreshold('80');
    }
  }, [editing, visible]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresá un nombre'); return; }
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(amountNum) || amountNum <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        amount: amountNum,
        categoryId: categoryId || null,
        period: 'monthly' as const,
        recurring,
        monthYear: recurring ? undefined : selectedMonth,
        alertThreshold: parseInt(alertThreshold) || 80,
      };
      if (editing) {
        await updateBudget(editing.id, data);
      } else {
        await addBudget(data);
      }
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.save, loading && { opacity: 0.4 }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Supermercado, Salidas..."
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          {/* Monto */}
          <Text style={styles.label}>Límite mensual ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {/* Alerta */}
          <Text style={styles.label}>Alerta al llegar al (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="80"
            placeholderTextColor={Colors.textMuted}
            value={alertThreshold}
            onChangeText={setAlertThreshold}
            keyboardType="numeric"
          />

          {/* Recurrente */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Repetir cada mes</Text>
              <Text style={styles.switchSub}>Se aplica a todos los meses</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Categoría */}
          <Text style={styles.label}>Categoría (opcional)</Text>
          <View style={styles.categoryGrid}>
            <TouchableOpacity
              style={[styles.categoryChip, !categoryId && styles.categoryChipActive]}
              onPress={() => setCategoryId(null)}
            >
              <Text style={[styles.categoryChipText, !categoryId && styles.categoryChipTextActive]}>
                Sin categoría
              </Text>
            </TouchableOpacity>
            {expenseCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cancel: { fontSize: 16, color: Colors.textSecondary },
  save: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  body: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: Colors.text,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16,
  },
  switchSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: 13, color: Colors.text },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  categoryEmoji: { fontSize: 14 },
});
