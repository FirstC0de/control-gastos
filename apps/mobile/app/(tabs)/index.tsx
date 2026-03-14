import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola 👋</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Resumen de balance — placeholder hasta conectar FinanceContext */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance del mes</Text>
        <Text style={styles.balanceAmount}>$ —</Text>
      </View>

      <View style={styles.row}>
        <SummaryTile label="Ingresos" value="$ —" color={Colors.secondary} />
        <SummaryTile label="Gastos" value="$ —" color={Colors.danger} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
