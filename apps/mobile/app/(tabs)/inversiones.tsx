import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { FixedTermStatus, InvestmentStatus } from '@controlados/shared';
import { Colors } from '../../constants/Colors';
import FixedTermFormModal from '../../components/FixedTermFormModal';
import InvestmentFormModal from '../../components/InvestmentFormModal';

type Tab = 'plazos' | 'portafolio';

const fmt     = (n: number, cur = 'ARS') => cur === 'USD' ? `U$D ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtPct  = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const TYPE_LABELS: Record<string, string> = { stock: 'Acción', bond: 'Bono', cedear: 'CEDEAR', crypto: 'Cripto', other: 'Otro' };
const TYPE_EMOJI:  Record<string, string> = { stock: '📈', bond: '📄', cedear: '🌎', crypto: '₿', other: '💼' };

export default function InversionesScreen() {
  const { getFixedTermStatus, getInvestmentStatus, getPortfolioSummary, deleteFixedTerm, deleteInvestment } = useFinance();
  const { blue } = useExchangeRate();
  const [tab, setTab] = useState<Tab>('plazos');
  const [showFTForm, setShowFTForm]   = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [editingFT, setEditingFT]     = useState<any>(null);
  const [editingInv, setEditingInv]   = useState<any>(null);

  const ftStatuses  = getFixedTermStatus();
  const invStatuses = getInvestmentStatus();
  const portfolio   = getPortfolioSummary();

  const toARS = (amount: number, currency: string) =>
    currency === 'USD' ? amount * (blue || 1) : amount;

  // ── PLAZOS FIJOS ──────────────────────────────────────────
  const renderFixedTerm = (item: FixedTermStatus) => {
    const pct = item.daysTotal > 0 ? (item.daysElapsed / item.daysTotal) * 100 : 100;
    const statusColor = item.isExpired ? Colors.textMuted : item.isExpiringSoon ? Colors.warning : Colors.secondary;

    return (
      <Pressable
        key={item.fixedTerm.id}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => { setEditingFT(item.fixedTerm); setShowFTForm(true); }}
        onLongPress={() => Alert.alert('Eliminar', `¿Eliminar plazo fijo de ${item.fixedTerm.institution}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteFixedTerm(item.fixedTerm.id) },
        ])}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.fixedTerm.institution}</Text>
            <Text style={styles.cardSub}>TNA {item.fixedTerm.rate}% · {item.fixedTerm.currency}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardAmount}>{fmt(item.currentValue, item.fixedTerm.currency)}</Text>
            <Text style={[styles.cardAmountSub, { color: Colors.secondary }]}>
              +{fmt(item.accruedInterest, item.fixedTerm.currency)} acum.
            </Text>
          </View>
        </View>

        {/* Barra de días */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: statusColor }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.cardDays, { color: statusColor }]}>
            {item.isExpired ? 'Vencido' : item.isExpiringSoon ? `Vence en ${item.daysRemaining} días` : `${item.daysRemaining} días restantes`}
          </Text>
          <Text style={styles.cardDates}>{item.fixedTerm.startDate} → {item.fixedTerm.endDate}</Text>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardDetailText}>Capital: {fmt(item.fixedTerm.principal, item.fixedTerm.currency)}</Text>
          <Text style={styles.cardDetailText}>Al vencer: {fmt(item.fixedTerm.principal + item.projectedInterest, item.fixedTerm.currency)}</Text>
          {item.fixedTerm.renewOnExpiry && <Text style={styles.renewBadge}>Renueva</Text>}
        </View>
      </Pressable>
    );
  };

  // ── PORTAFOLIO ────────────────────────────────────────────
  const renderInvestment = (item: InvestmentStatus) => {
    const gain     = item.unrealizedGain;
    const gainColor = gain >= 0 ? Colors.secondary : Colors.danger;

    return (
      <Pressable
        key={item.investment.id}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => { setEditingInv(item.investment); setShowInvForm(true); }}
        onLongPress={() => Alert.alert('Eliminar', `¿Eliminar "${item.investment.name}"?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteInvestment(item.investment.id) },
        ])}
      >
        <View style={styles.cardHeader}>
          <View style={styles.invLeft}>
            <Text style={styles.typeEmoji}>{TYPE_EMOJI[item.investment.type]}</Text>
            <View>
              <Text style={styles.cardTitle}>{item.investment.name}</Text>
              <Text style={styles.cardSub}>
                {item.investment.ticker ? `${item.investment.ticker} · ` : ''}{TYPE_LABELS[item.investment.type]} · {item.investment.currency}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardAmount}>{fmt(item.currentValue, item.investment.currency)}</Text>
            <Text style={[styles.cardAmountSub, { color: gainColor }]}>
              {fmtPct(item.unrealizedGainPct)} ({gain >= 0 ? '+' : ''}{fmt(gain, item.investment.currency)})
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardDetailText}>{item.investment.quantity} unidades</Text>
          <Text style={styles.cardDetailText}>Compra: {fmt(item.investment.purchasePrice, item.investment.currency)}</Text>
          <Text style={styles.cardDetailText}>Actual: {fmt(item.investment.currentPrice, item.investment.currency)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Resumen portfolio */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Patrimonio total (ARS)</Text>
        <Text style={styles.summaryTotal}>${Math.round(portfolio.grandTotal).toLocaleString('es-AR')}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Plazos fijos</Text>
            <Text style={styles.summaryChipValue}>${Math.round(portfolio.fixedTermsTotalConverted).toLocaleString('es-AR')}</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.summaryChipLabel}>Portafolio</Text>
            <Text style={styles.summaryChipValue}>${Math.round(portfolio.investmentsTotalConverted).toLocaleString('es-AR')}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([['plazos', 'Plazos Fijos'], ['portafolio', 'Portafolio']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tabBtn, tab === key && styles.tabBtnActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tab === 'plazos' ? (
          ftStatuses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏦</Text>
              <Text style={styles.emptyTitle}>Sin plazos fijos</Text>
              <Text style={styles.emptySubtitle}>Tocá + para registrar un plazo fijo</Text>
            </View>
          ) : ftStatuses.map(renderFixedTerm)
        ) : (
          invStatuses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyTitle}>Sin inversiones</Text>
              <Text style={styles.emptySubtitle}>Tocá + para agregar una inversión</Text>
            </View>
          ) : invStatuses.map(renderInvestment)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => {
        if (tab === 'plazos') { setEditingFT(null); setShowFTForm(true); }
        else { setEditingInv(null); setShowInvForm(true); }
      }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <FixedTermFormModal visible={showFTForm} onClose={() => { setShowFTForm(false); setEditingFT(null); }} editing={editingFT} />
      <InvestmentFormModal visible={showInvForm} onClose={() => { setShowInvForm(false); setEditingInv(null); }} editing={editingInv} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  summaryCard: { backgroundColor: Colors.primaryDark, padding: 20 },
  summaryLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 4 },
  summaryTotal: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  summaryChipLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  summaryChipValue: { color: '#fff', fontSize: 13, fontWeight: '700' },

  tabs: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  list: { padding: 16, gap: 12, paddingBottom: 100 },

  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardPressed: { opacity: 0.85 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardAmountSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDays: { fontSize: 12, fontWeight: '600' },
  cardDates: { fontSize: 11, color: Colors.textMuted },

  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardDetailText: { fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  renewBadge: { fontSize: 11, color: Colors.primary, fontWeight: '700', backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  invLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  typeEmoji: { fontSize: 24 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
