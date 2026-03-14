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

const INSTALLMENT_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24];

export default function ExpenseFormModal({ visible, onClose }: Props) {
  const { addExpense, categories, cards, selectedMonth, suggestCategory } = useFinance();

  const defaultDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [date, setDate] = useState(defaultDate);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-sugerir categoría mientras el usuario escribe
  useEffect(() => {
    if (description.length > 2) {
      const suggested = suggestCategory(description, 'expense');
      if (suggested) setCategoryId(suggested);
    }
  }, [description]);

  // Reset al abrir el modal
  useEffect(() => {
    if (visible) {
      setDescription('');
      setAmount('');
      setCurrency('ARS');
      setDate(`${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`);
      setCategoryId(null);
      setCardId(null);
      setInstallments(1);
      setRecurring(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!description.trim()) { Alert.alert('Error', 'Ingresá una descripción'); return; }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Error', 'Ingresá un monto válido'); return; }

    setLoading(true);
    try {
      const monthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
      await addExpense({
        description: description.trim(),
        amount: parsedAmount,
        date,
        categoryId: categoryId ?? undefined,
        cardId: cardId ?? undefined,
        installments: recurring ? 1 : installments,
        currentInstallment: 1,
        installmentAmount: installments > 1 ? parseFloat((parsedAmount / installments).toFixed(2)) : parsedAmount,
        currency,
        recurring: recurring || undefined,
        monthYear,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = categories.filter(c => c.isActive !== false && (c.type === 'expense' || c.type === 'both'));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo gasto</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

            {/* Descripción */}
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="¿En qué gastaste?"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Monto + Moneda */}
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

            {/* Cuotas / Recurrente toggle */}
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

            {/* Cuotas (solo si no es recurrente) */}
            {!recurring && (
              <>
                <Text style={styles.label}>Cuotas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  {INSTALLMENT_OPTIONS.map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.pill, installments === n && styles.pillActive]}
                      onPress={() => setInstallments(n)}
                    >
                      <Text style={[styles.pillText, installments === n && styles.pillTextActive]}>
                        {n === 1 ? 'Contado' : `${n}x`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {installments > 1 && amount && (
                  <Text style={styles.installmentHint}>
                    {installments} cuotas de {currency === 'USD' ? 'U$D' : '$'}{(parseFloat(amount || '0') / installments).toFixed(2)}
                  </Text>
                )}
              </>
            )}

            {/* Categoría */}
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              <TouchableOpacity
                style={[styles.pill, !categoryId && styles.pillActive]}
                onPress={() => setCategoryId(null)}
              >
                <Text style={[styles.pillText, !categoryId && styles.pillTextActive]}>Sin categoría</Text>
              </TouchableOpacity>
              {expenseCategories.map(cat => (
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

            {/* Tarjeta */}
            {cards.length > 0 && (
              <>
                <Text style={styles.label}>Tarjeta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  <TouchableOpacity
                    style={[styles.pill, !cardId && styles.pillActive]}
                    onPress={() => setCardId(null)}
                  >
                    <Text style={[styles.pillText, !cardId && styles.pillTextActive]}>Efectivo</Text>
                  </TouchableOpacity>
                  {cards.map(card => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.pill, cardId === card.id && { backgroundColor: card.color + '30', borderColor: card.color }]}
                      onPress={() => setCardId(card.id)}
                    >
                      <Text style={[styles.pillText, cardId === card.id && { color: card.color, fontWeight: '600' }]}>
                        {card.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Agregar gasto</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    color: Colors.text, backgroundColor: '#fafafa',
  },
  inputFlex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyBtn: {
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fafafa',
  },
  currencyBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  currencyText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  currencyTextActive: { color: '#fff' },
  toggleBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', backgroundColor: '#fafafa',
  },
  toggleBtnActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },
  pillRow: { flexDirection: 'row', marginBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
    backgroundColor: '#fafafa',
  },
  pillActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  pillText: { fontSize: 13, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary, fontWeight: '600' },
  installmentHint: { fontSize: 12, color: Colors.primary, marginTop: 4, marginBottom: 4 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
