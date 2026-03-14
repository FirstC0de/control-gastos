import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Colors } from '../constants/Colors';
import { Currency } from '@controlados/shared';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const INCOME_TYPES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'sales',   label: 'Ventas' },
  { value: 'other',   label: 'Otro' },
] as const;

export default function IncomeFormModal({ visible, onClose }: Props) {
  const { addIncome, categories, selectedMonth } = useFinance();

  const defaultDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState<'monthly' | 'sales' | 'other'>('monthly');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setAmount('');
      setCurrency('ARS');
      setDate(`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`);
      setType('monthly');
      setCategoryId(null);
      setRecurring(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresá un nombre'); return; }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }

    setLoading(true);
    try {
      await addIncome({
        name: name.trim(),
        amount: parsedAmount,
        date,
        type,
        categoryId: categoryId ?? undefined,
        currency,
        recurring: recurring || undefined,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el ingreso');
    } finally {
      setLoading(false);
    }
  };

  const incomeCategories = categories.filter(
    c => c.isActive !== false && (c.type === 'income' || c.type === 'both')
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo ingreso</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Sueldo, Freelance..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Monto *</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'ARS' && styles.currencyBtnActive]}
                onPress={() => setCurrency('ARS')}
              >
                <Text style={[styles.currencyText, currency === 'ARS' && styles.currencyTextActive]}>ARS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'USD' && styles.currencyBtnActive]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextActive]}>USD</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.row}>
              {INCOME_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.toggleBtn, type === t.value && styles.toggleBtnActive]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={[styles.toggleText, type === t.value && styles.toggleTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.toggleBtn, !recurring && styles.toggleBtnActive]}
                onPress={() => setRecurring(false)}
              >
                <Text style={[styles.toggleText, !recurring && styles.toggleTextActive]}>Puntual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, recurring && styles.toggleBtnActive]}
                onPress={() => setRecurring(true)}
              >
                <Text style={[styles.toggleText, recurring && styles.toggleTextActive]}>Recurrente</Text>
              </TouchableOpacity>
            </View>

            {incomeCategories.length > 0 && (
              <>
                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  <TouchableOpacity
                    style={[styles.pill, !categoryId && styles.pillActive]}
                    onPress={() => setCategoryId(null)}
                  >
                    <Text style={[styles.pillText, !categoryId && styles.pillTextActive]}>Sin categoría</Text>
                  </TouchableOpacity>
                  {incomeCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.pill, categoryId === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={[styles.pillText, categoryId === cat.id && { color: cat.color, fontWeight: '600' }]}>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Agregar ingreso</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' },
  inputFlex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fafafa' },
  currencyBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  currencyText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  currencyTextActive: { color: '#fff' },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: '#fafafa' },
  toggleBtnActive: { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.secondary },
  pillRow: { flexDirection: 'row', marginBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: '#fafafa' },
  pillActive: { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary },
  pillText: { fontSize: 13, color: Colors.textSecondary },
  pillTextActive: { color: Colors.secondary, fontWeight: '600' },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  submitBtn: { backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
