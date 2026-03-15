import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Colors } from '../constants/Colors';
import { Currency, SavingType } from '@controlados/shared';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const TYPES: { value: SavingType; label: string; icon: string }[] = [
  { value: 'account', label: 'Cuenta',     icon: '🏦' },
  { value: 'cash',    label: 'Efectivo',   icon: '💵' },
  { value: 'wallet',  label: 'Billetera',  icon: '👛' },
  { value: 'goal',    label: 'Meta',       icon: '🎯' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function SavingFormModal({ visible, onClose }: Props) {
  const { addSaving } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<SavingType>('account');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [goalAmount, setGoalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(''); setType('account'); setCurrency('ARS');
      setBalance(''); setInstitution(''); setColor(COLORS[0]); setGoalAmount('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresá un nombre'); return; }
    const parsedBalance = parseFloat(balance) || 0;

    setLoading(true);
    try {
      await addSaving({
        name: name.trim(),
        type,
        currency,
        balance: parsedBalance,
        color,
        institution: institution.trim() || undefined,
        goalAmount: type === 'goal' && goalAmount ? parseFloat(goalAmount) : undefined,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo ahorro</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.typeGrid}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeBtn, type === t.value && { backgroundColor: color + '20', borderColor: color }]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, type === t.value && { color, fontWeight: '700' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="Ej: Caja de ahorro Galicia" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Institución</Text>
            <TextInput style={styles.input} value={institution} onChangeText={setInstitution}
              placeholder="Banco, broker, etc." placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Moneda y saldo inicial</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'ARS' && { backgroundColor: color, borderColor: color }]}
                onPress={() => setCurrency('ARS')}
              >
                <Text style={[styles.currencyText, currency === 'ARS' && styles.currencyTextActive]}>ARS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'USD' && { backgroundColor: color, borderColor: color }]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextActive]}>USD</Text>
              </TouchableOpacity>
              <TextInput style={[styles.input, styles.inputFlex]} value={balance} onChangeText={setBalance}
                placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>

            {type === 'goal' && (
              <>
                <Text style={styles.label}>Monto objetivo</Text>
                <TextInput style={styles.input} value={goalAmount} onChangeText={setGoalAmount}
                  placeholder="¿Cuánto querés ahorrar?" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
              </>
            )}

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: color }, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Crear ahorro</Text>}
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
  closeText: { fontSize: 18, color: Colors.textSecondary, padding: 4 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' },
  inputFlex: { flex: 1 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flex: 1, minWidth: '45%', paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: '#fafafa', gap: 4,
  },
  typeIcon: { fontSize: 22 },
  typeLabel: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fafafa' },
  currencyText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  currencyTextActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
