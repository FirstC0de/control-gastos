import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { FixedTerm } from '@controlados/shared';
import { Colors } from '../constants/Colors';

type Props = { visible: boolean; onClose: () => void; editing?: FixedTerm | null };

export default function FixedTermFormModal({ visible, onClose, editing }: Props) {
  const { addFixedTerm, updateFixedTerm } = useFinance();
  const [institution, setInstitution] = useState('');
  const [principal, setPrincipal]     = useState('');
  const [currency, setCurrency]       = useState<'ARS' | 'USD'>('ARS');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [rate, setRate]               = useState('');
  const [renew, setRenew]             = useState(false);
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (editing) {
      setInstitution(editing.institution);
      setPrincipal(String(editing.principal));
      setCurrency(editing.currency as 'ARS' | 'USD');
      setStartDate(editing.startDate);
      setEndDate(editing.endDate);
      setRate(String(editing.rate));
      setRenew(editing.renewOnExpiry);
      setNotes(editing.notes ?? '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setInstitution(''); setPrincipal(''); setCurrency('ARS');
      setStartDate(today); setEndDate(''); setRate(''); setRenew(false); setNotes('');
    }
  }, [editing, visible]);

  const handleSave = async () => {
    if (!institution.trim()) { Alert.alert('Error', 'Ingresá la entidad'); return; }
    const p = parseFloat(principal.replace(',', '.'));
    if (isNaN(p) || p <= 0) { Alert.alert('Error', 'Ingresá el capital'); return; }
    const r = parseFloat(rate.replace(',', '.'));
    if (isNaN(r) || r <= 0) { Alert.alert('Error', 'Ingresá la TNA'); return; }
    if (!startDate || !endDate) { Alert.alert('Error', 'Ingresá las fechas (AAAA-MM-DD)'); return; }

    setLoading(true);
    try {
      const data = {
        institution: institution.trim(), principal: p, currency,
        startDate, endDate, rate: r, renewOnExpiry: renew,
        notes: notes.trim() || undefined, createdAt: new Date().toISOString(),
      };
      editing ? await updateFixedTerm(editing.id, data) : await addFixedTerm(data);
      onClose();
    } catch { Alert.alert('Error', 'No se pudo guardar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={styles.title}>{editing ? 'Editar plazo fijo' : 'Nuevo plazo fijo'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}><Text style={[styles.save, loading && { opacity: 0.4 }]}>Guardar</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Entidad</Text>
          <TextInput style={styles.input} placeholder="Banco Galicia, Brubank..." placeholderTextColor={Colors.textMuted} value={institution} onChangeText={setInstitution} />

          <Text style={styles.label}>Moneda</Text>
          <View style={styles.segmented}>
            {(['ARS', 'USD'] as const).map(c => (
              <TouchableOpacity key={c} style={[styles.segment, currency === c && styles.segmentActive]} onPress={() => setCurrency(c)}>
                <Text style={[styles.segmentText, currency === c && styles.segmentTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Capital ({currency})</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={principal} onChangeText={setPrincipal} keyboardType="numeric" />

          <Text style={styles.label}>TNA (%)</Text>
          <TextInput style={styles.input} placeholder="118" placeholderTextColor={Colors.textMuted} value={rate} onChangeText={setRate} keyboardType="numeric" />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Fecha inicio</Text>
              <TextInput style={styles.input} placeholder="2024-01-01" placeholderTextColor={Colors.textMuted} value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Fecha vencimiento</Text>
              <TextInput style={styles.input} placeholder="2024-04-01" placeholderTextColor={Colors.textMuted} value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Renovar al vencer</Text>
              <Text style={styles.switchSub}>Indica que se renueva automáticamente</Text>
            </View>
            <Switch value={renew} onValueChange={setRenew} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
          </View>

          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notas adicionales..." placeholderTextColor={Colors.textMuted} value={notes} onChangeText={setNotes} multiline />
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
  segmented: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.card },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  segmentTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  switchSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
