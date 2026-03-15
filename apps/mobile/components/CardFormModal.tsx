import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { Card } from '@controlados/shared';
import { Colors } from '../constants/Colors';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#6366f1','#14b8a6'];

type Props = {
  visible: boolean;
  onClose: () => void;
  editing?: Card | null;
};

export default function CardFormModal({ visible, onClose, editing }: Props) {
  const { addCard, updateCard } = useFinance();
  const [name, setName]           = useState('');
  const [lastFour, setLastFour]   = useState('');
  const [color, setColor]         = useState(COLORS[0]);
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay]       = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setLastFour(editing.lastFour ?? '');
      setColor(editing.color);
      setClosingDay(String(editing.closingDay));
      setDueDay(String(editing.dueDay));
    } else {
      setName(''); setLastFour(''); setColor(COLORS[0]);
      setClosingDay(''); setDueDay('');
    }
  }, [editing, visible]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Ingresá un nombre'); return; }
    const cd = parseInt(closingDay);
    const dd = parseInt(dueDay);
    if (!closingDay || isNaN(cd) || cd < 1 || cd > 31) { Alert.alert('Error', 'Día de cierre inválido (1-31)'); return; }
    if (!dueDay || isNaN(dd) || dd < 1 || dd > 31) { Alert.alert('Error', 'Día de vencimiento inválido (1-31)'); return; }

    setLoading(true);
    try {
      const data = { name: name.trim(), lastFour: lastFour.trim() || undefined, color, closingDay: cd, dueDay: dd };
      editing ? await updateCard(editing.id, data) : await addCard(data);
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarjeta');
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
          <Text style={styles.title}>{editing ? 'Editar tarjeta' : 'Nueva tarjeta'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.save, loading && { opacity: 0.4 }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Preview */}
          <View style={[styles.cardPreview, { backgroundColor: color }]}>
            <Text style={styles.cardPreviewName}>{name || 'Nombre de tarjeta'}</Text>
            <Text style={styles.cardPreviewDigits}>
              {lastFour ? `•••• ${lastFour}` : '•••• ••••'}
            </Text>
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input} placeholder="Visa Galicia, Mastercard HSBC..."
            placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName}
          />

          <Text style={styles.label}>Últimos 4 dígitos (opcional)</Text>
          <TextInput
            style={styles.input} placeholder="1234"
            placeholderTextColor={Colors.textMuted} value={lastFour}
            onChangeText={t => setLastFour(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric" maxLength={4}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Día de cierre</Text>
              <TextInput
                style={styles.input} placeholder="15"
                placeholderTextColor={Colors.textMuted} value={closingDay}
                onChangeText={setClosingDay} keyboardType="numeric" maxLength={2}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Día de vencimiento</Text>
              <TextInput
                style={styles.input} placeholder="5"
                placeholderTextColor={Colors.textMuted} value={dueDay}
                onChangeText={setDueDay} keyboardType="numeric" maxLength={2}
              />
            </View>
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
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
  cardPreview: {
    borderRadius: 16, padding: 20, marginBottom: 8,
    height: 110, justifyContent: 'space-between',
  },
  cardPreviewName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardPreviewDigits: { color: 'rgba(255,255,255,0.8)', fontSize: 18, letterSpacing: 2 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.text, transform: [{ scale: 1.15 }] },
});
