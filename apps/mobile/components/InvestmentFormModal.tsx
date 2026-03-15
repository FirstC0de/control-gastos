import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Investment, InvestmentType } from '@controlados/shared';
import { Colors } from '../constants/Colors';

const TYPES: { value: InvestmentType; label: string; emoji: string }[] = [
  { value: 'stock',  label: 'Acción',  emoji: '📈' },
  { value: 'cedear', label: 'CEDEAR',  emoji: '🌎' },
  { value: 'bond',   label: 'Bono',    emoji: '📄' },
  { value: 'crypto', label: 'Cripto',  emoji: '₿'  },
  { value: 'other',  label: 'Otro',    emoji: '💼' },
];

type Props = { visible: boolean; onClose: () => void; editing?: Investment | null };

export default function InvestmentFormModal({ visible, onClose, editing }: Props) {
  const { addInvestment, updateInvestment } = useFinance();
  const [name, setName]                 = useState('');
  const [ticker, setTicker]             = useState('');
  const [type, setType]                 = useState<InvestmentType>('stock');
  const [currency, setCurrency]         = useState<'ARS' | 'USD'>('ARS');
  const [quantity, setQuantity]         = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes]               = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setTicker(editing.ticker ?? ''); setType(editing.type);
      setCurrency(editing.currency as 'ARS' | 'USD'); setQuantity(String(editing.quantity));
      setPurchasePrice(String(editing.purchasePrice)); setCurrentPrice(String(editing.currentPrice));
      setPurchaseDate(editing.purchaseDate); setNotes(editing.notes ?? '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setName(''); setTicker(''); setType('stock'); setCurrency('ARS');
      setQuantity(''); setPurchasePrice(''); setCurrentPrice(''); setPurchaseDate(today); setNotes('');
    }
  }, [editing, visible]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresá el nombre'); return; }
    const q = parseFloat(quantity.replace(',', '.'));
    const pp = parseFloat(purchasePrice.replace(',', '.'));
    const cp = parseFloat(currentPrice.replace(',', '.'));
    if (isNaN(q) || q <= 0) { Alert.alert('Error', 'Cantidad inválida'); return; }
    if (isNaN(pp) || pp <= 0) { Alert.alert('Error', 'Precio de compra inválido'); return; }
    if (isNaN(cp) || cp < 0) { Alert.alert('Error', 'Precio actual inválido'); return; }
    if (!purchaseDate) { Alert.alert('Error', 'Ingresá la fecha de compra'); return; }

    setLoading(true);
    try {
      const data = {
        name: name.trim(), ticker: ticker.trim().toUpperCase() || undefined,
        type, currency, quantity: q, purchasePrice: pp, currentPrice: cp,
        purchaseDate, notes: notes.trim() || undefined, createdAt: new Date().toISOString(),
      };
      editing ? await updateInvestment(editing.id, data) : await addInvestment(data);
      onClose();
    } catch { Alert.alert('Error', 'No se pudo guardar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={styles.title}>{editing ? 'Editar inversión' : 'Nueva inversión'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}><Text style={[styles.save, loading && { opacity: 0.4 }]}>Guardar</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.value} style={[styles.typeChip, type === t.value && styles.typeChipActive]} onPress={() => setType(t.value)}>
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} placeholder="YPF, Apple, Bitcoin..." placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />

          <Text style={styles.label}>Ticker (opcional)</Text>
          <TextInput style={styles.input} placeholder="YPFD, AAPL, BTC..." placeholderTextColor={Colors.textMuted} value={ticker} onChangeText={setTicker} autoCapitalize="characters" />

          <Text style={styles.label}>Moneda</Text>
          <View style={styles.segmented}>
            {(['ARS', 'USD'] as const).map(c => (
              <TouchableOpacity key={c} style={[styles.segment, currency === c && styles.segmentActive]} onPress={() => setCurrency(c)}>
                <Text style={[styles.segmentText, currency === c && styles.segmentTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Cantidad</Text>
              <TextInput style={styles.input} placeholder="10" placeholderTextColor={Colors.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Fecha compra</Text>
              <TextInput style={styles.input} placeholder="2024-01-01" placeholderTextColor={Colors.textMuted} value={purchaseDate} onChangeText={setPurchaseDate} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Precio compra</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Precio actual</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={currentPrice} onChangeText={setCurrentPrice} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Notas..." placeholderTextColor={Colors.textMuted} value={notes} onChangeText={setNotes} multiline />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cancel: { fontSize: 16, color: Colors.textSecondary },
  save: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  body: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontSize: 13, color: Colors.text },
  typeLabelActive: { color: '#fff', fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.card },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  segmentTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
