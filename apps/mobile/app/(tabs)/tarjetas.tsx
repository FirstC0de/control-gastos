import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, Pressable, ScrollView,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import CardFormModal from '../../components/CardFormModal';

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

export default function TarjetasScreen() {
  const { cards, deleteCard, getInstallmentSummary, getMonthlyProjection } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | 'all'>('all');

  const now = new Date();
  const summary = getInstallmentSummary(now.getFullYear(), now.getMonth(), selectedCard);
  const projection = getMonthlyProjection(4, selectedCard);

  const handleDelete = (card: Card) => {
    Alert.alert(
      'Eliminar tarjeta',
      `¿Eliminar "${card.name}"? Los gastos asociados no se borrarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteCard(card.id) },
      ]
    );
  };

  const handleEdit = (card: Card) => {
    setEditing(card);
    setShowForm(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Selector de tarjeta */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorWrap} contentContainerStyle={styles.selectorContent}>
          <TouchableOpacity
            style={[styles.selectorChip, selectedCard === 'all' && styles.selectorChipActive]}
            onPress={() => setSelectedCard('all')}
          >
            <Text style={[styles.selectorText, selectedCard === 'all' && styles.selectorTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {cards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={[styles.selectorChip, selectedCard === card.id && { backgroundColor: card.color, borderColor: card.color }]}
              onPress={() => setSelectedCard(card.id)}
            >
              <Text style={[styles.selectorText, selectedCard === card.id && styles.selectorTextActive]}>
                {card.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resumen del mes */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Este mes</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Contado</Text>
              <Text style={styles.summaryValue}>{fmt(summary.cash)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cuotas</Text>
              <Text style={[styles.summaryValue, { color: Colors.warning }]}>{fmt(summary.installments)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary }]}>{fmt(summary.cash + summary.installments)}</Text>
            </View>
          </View>
        </View>

        {/* Proyección */}
        {projection.some(p => p.total > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyección próximos meses</Text>
            <View style={styles.projectionRow}>
              {projection.map((p, i) => {
                const maxTotal = Math.max(...projection.map(x => x.total), 1);
                const barH = Math.max((p.total / maxTotal) * 80, 4);
                return (
                  <View key={i} style={styles.projItem}>
                    <Text style={styles.projAmount}>{p.total > 0 ? fmt(p.total) : '-'}</Text>
                    <View style={styles.projBarWrap}>
                      <View style={[styles.projBar, { height: barH, backgroundColor: i === 0 ? Colors.primary : Colors.border }]} />
                    </View>
                    <Text style={styles.projLabel}>{p.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Lista de tarjetas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis tarjetas</Text>
          {cards.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>Sin tarjetas</Text>
              <Text style={styles.emptySubtitle}>Tocá + para agregar una tarjeta de crédito</Text>
            </View>
          ) : (
            cards.map(card => {
              const cardSummary = getInstallmentSummary(now.getFullYear(), now.getMonth(), card.id);
              return (
                <Pressable
                  key={card.id}
                  style={({ pressed }) => [styles.cardItem, pressed && styles.cardItemPressed]}
                  onPress={() => handleEdit(card)}
                  onLongPress={() => handleDelete(card)}
                >
                  <View style={[styles.cardStripe, { backgroundColor: card.color }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={styles.cardName}>{card.name}</Text>
                        {card.lastFour && (
                          <Text style={styles.cardDigits}>•••• {card.lastFour}</Text>
                        )}
                      </View>
                      <View style={[styles.cardBadge, { backgroundColor: card.color + '20' }]}>
                        <Text style={[styles.cardBadgeText, { color: card.color }]}>
                          {fmt(cardSummary.cash + cardSummary.installments)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardDates}>
                      <Text style={styles.cardDateText}>Cierre: día {card.closingDay}</Text>
                      <Text style={styles.cardDateText}>Vence: día {card.dueDay}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setShowForm(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CardFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editing={editing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },

  selectorWrap: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectorContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  selectorChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  selectorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  selectorTextActive: { color: '#fff', fontWeight: '700' },

  summaryCard: {
    margin: 16, backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  projectionRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  projItem: { flex: 1, alignItems: 'center' },
  projAmount: { fontSize: 10, color: Colors.textMuted, marginBottom: 4, textAlign: 'center' },
  projBarWrap: { height: 80, justifyContent: 'flex-end', marginBottom: 4 },
  projBar: { width: 28, borderRadius: 4 },
  projLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },

  cardItem: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  cardItemPressed: { opacity: 0.85 },
  cardStripe: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDigits: { fontSize: 12, color: Colors.textMuted, marginTop: 2, letterSpacing: 1 },
  cardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardBadgeText: { fontSize: 13, fontWeight: '700' },
  cardDates: { flexDirection: 'row', gap: 16 },
  cardDateText: { fontSize: 12, color: Colors.textSecondary },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
