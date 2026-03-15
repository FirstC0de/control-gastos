import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { Colors } from '../../constants/Colors';

const SCREEN_W  = Dimensions.get('window').width;
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CAT_COLORS   = ['#6366f1','#f43f5e','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];

const fmtK = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString('es-AR')}`;
};
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data, size = 180 }: { data: { value: number; color: string; label: string }[]; size?: number }) {
  const total  = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22;
  const [active, setActive] = useState<number | null>(null);

  if (total === 0) return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Sin datos</Text>
    </View>
  );

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct      = d.value / total;
    const angle    = pct * 2 * Math.PI;
    const startA   = cumAngle;
    cumAngle      += angle;
    const endA     = cumAngle;
    const outerR   = active === i ? r + 8 : r;
    const x1 = cx + outerR * Math.cos(startA), y1 = cy + outerR * Math.sin(startA);
    const x2 = cx + outerR * Math.cos(endA),   y2 = cy + outerR * Math.sin(endA);
    const ix1 = cx + inner * Math.cos(startA), iy1 = cy + inner * Math.sin(startA);
    const ix2 = cx + inner * Math.cos(endA),   iy2 = cy + inner * Math.sin(endA);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return { ...d, path, pct, i };
  });

  const activeSlice = active !== null ? slices[active] : null;

  return (
    <Svg width={size} height={size}>
      {slices.map(s => (
        <Path key={s.i} d={s.path} fill={s.color}
          onPress={() => setActive(active === s.i ? null : s.i)} />
      ))}
      {/* Centro */}
      {activeSlice ? (
        <>
          <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fontWeight="700" fill={Colors.text}>
            {activeSlice.label.length > 10 ? activeSlice.label.slice(0, 10) + '…' : activeSlice.label}
          </SvgText>
          <SvgText x={cx} y={cy + 8} textAnchor="middle" fontSize={12} fontWeight="700" fill={activeSlice.color}>
            {(activeSlice.pct * 100).toFixed(1)}%
          </SvgText>
        </>
      ) : (
        <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fill={Colors.textMuted}>Tocá un sector</SvgText>
      )}
    </Svg>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, height = 140 }: {
  data: { label: string; income: number; expense: number }[];
  height?: number;
}) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const barW   = 10, gap = 4, groupGap = 8;
  const groupW = barW * 2 + gap + groupGap;
  const chartW = Math.max(data.length * groupW + 16, SCREEN_W - 64);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: chartW, height: height + 36, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: groupGap }}>
          {data.map((d, i) => {
            const ih = Math.max((d.income  / maxVal) * height, d.income  > 0 ? 3 : 0);
            const eh = Math.max((d.expense / maxVal) * height, d.expense > 0 ? 3 : 0);
            return (
              <View key={i} style={{ alignItems: 'center', gap: gap, flexDirection: 'row', alignSelf: 'flex-end' }}>
                <View style={{ width: barW, height: ih, backgroundColor: Colors.secondary, borderRadius: 3 }} />
                <View style={{ width: barW, height: eh, backgroundColor: Colors.danger,   borderRadius: 3 }} />
              </View>
            );
          })}
        </View>
        {/* Labels */}
        <View style={{ flexDirection: 'row', marginTop: 6, gap: groupGap }}>
          {data.map((d, i) => (
            <View key={i} style={{ width: barW * 2 + gap, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: Colors.textMuted }}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function MetricasScreen() {
  const { expenses, incomes, categories, selectedMonth } = useFinance();
  const { blue } = useExchangeRate();
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  const toARS = (amount: number, currency?: string) =>
    currency === 'USD' ? amount * (blue ?? 0) : amount;

  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

  // Métricas del mes
  const { totalInc, totalExp, balance, savingsRate } = useMemo(() => {
    const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === monthKey);
    const mInc = incomes.filter(i => i.date.substring(0, 7) === monthKey);
    const totalInc = mInc.reduce((s, i) => s + toARS(i.amount, i.currency), 0);
    const totalExp = mExp.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
    const balance  = totalInc - totalExp;
    return { totalInc, totalExp, balance, savingsRate: totalInc > 0 ? (balance / totalInc) * 100 : 0 };
  }, [expenses, incomes, monthKey, blue]);

  // Evolución mensual
  const evolutionData = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      let m = selectedMonth.month - (period - 1 - i);
      let y = selectedMonth.year;
      while (m < 0) { m += 12; y--; }
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key);
      const mInc = incomes.filter(i => i.date.substring(0, 7) === key);
      return {
        label: MONTH_LABELS[m],
        income:  mInc.reduce((s, i) => s + toARS(i.amount, i.currency), 0),
        expense: mExp.reduce((s, e) => s + toARS(e.amount, e.currency), 0),
      };
    });
  }, [expenses, incomes, selectedMonth, period, blue]);

  // Gastos por categoría del mes
  const pieData = useMemo(() => {
    const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === monthKey);
    const byCategory: Record<string, number> = {};
    mExp.forEach(e => {
      const key = e.categoryId ?? '__sin_cat__';
      byCategory[key] = (byCategory[key] ?? 0) + toARS(e.amount, e.currency);
    });
    return Object.entries(byCategory)
      .map(([id, value], i) => ({
        value,
        label: id === '__sin_cat__' ? 'Sin categoría' : categories.find(c => c.id === id)?.name ?? id,
        color: CAT_COLORS[i % CAT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses, categories, monthKey, blue]);

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.secondary }]}>
          <Text style={styles.kpiLabel}>Ingresos</Text>
          <Text style={[styles.kpiValue, { color: Colors.secondary }]}>{fmtK(totalInc)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.danger }]}>
          <Text style={styles.kpiLabel}>Gastos</Text>
          <Text style={[styles.kpiValue, { color: Colors.danger }]}>{fmtK(totalExp)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: balance >= 0 ? Colors.primary : Colors.danger }]}>
          <Text style={styles.kpiLabel}>Balance</Text>
          <Text style={[styles.kpiValue, { color: balance >= 0 ? Colors.primary : Colors.danger }]}>{fmtK(balance)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.warning }]}>
          <Text style={styles.kpiLabel}>Tasa ahorro</Text>
          <Text style={[styles.kpiValue, { color: Colors.warning }]}>{savingsRate.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Evolución */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Evolución mensual</Text>
          <View style={styles.periodRow}>
            {([3, 6, 12] as const).map(p => (
              <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}M</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Leyenda */}
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} /><Text style={styles.legendText}>Ingresos</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.danger }]}   /><Text style={styles.legendText}>Gastos</Text></View>
        </View>
        <BarChart data={evolutionData} />
      </View>

      {/* Categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gastos por categoría</Text>
        {pieData.length === 0 ? (
          <Text style={styles.empty}>Sin gastos este mes</Text>
        ) : (
          <View style={styles.pieSection}>
            <DonutChart data={pieData} size={180} />
            <View style={styles.catList}>
              {pieData.map((d, i) => (
                <View key={i} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: d.color }]} />
                  <Text style={styles.catName} numberOfLines={1}>{d.label}</Text>
                  <Text style={styles.catPct}>{totalPie > 0 ? ((d.value / totalPie) * 100).toFixed(1) : 0}%</Text>
                  <Text style={styles.catAmt}>{fmtK(d.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Top gastos del mes */}
      {(() => {
        const top = expenses
          .filter(e => (e.monthYear ?? e.date.substring(0, 7)) === monthKey)
          .sort((a, b) => toARS(b.amount, b.currency) - toARS(a.amount, a.currency))
          .slice(0, 5);
        if (top.length === 0) return null;
        const maxAmt = toARS(top[0].amount, top[0].currency);
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top gastos del mes</Text>
            {top.map((e, i) => {
              const amt = toARS(e.amount, e.currency);
              const cat = categories.find(c => c.id === e.categoryId);
              return (
                <View key={e.id} style={styles.topRow}>
                  <Text style={styles.topRank}>#{i + 1}</Text>
                  <View style={styles.topInfo}>
                    <Text style={styles.topName} numberOfLines={1}>{e.description || 'Sin descripción'}</Text>
                    <View style={styles.topBar}>
                      <View style={[styles.topBarFill, { width: `${(amt / maxAmt) * 100}%` as any }]} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.topAmt}>{fmtFull(amt)}</Text>
                    {cat && <Text style={styles.topCat}>{cat.icon} {cat.name}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4,
  },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  kpiValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },

  section: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  periodRow: { flexDirection: 'row', gap: 4 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  periodTextActive: { color: '#fff' },

  legend: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.textSecondary },

  pieSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catList: { flex: 1, gap: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, fontSize: 12, color: Colors.text },
  catPct: { fontSize: 11, color: Colors.textMuted, width: 36, textAlign: 'right' },
  catAmt: { fontSize: 12, fontWeight: '700', color: Colors.text, width: 60, textAlign: 'right' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  topRank: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, width: 22 },
  topInfo: { flex: 1 },
  topName: { fontSize: 13, color: Colors.text, marginBottom: 4 },
  topBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  topBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  topAmt: { fontSize: 13, fontWeight: '700', color: Colors.text },
  topCat: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  empty: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});
