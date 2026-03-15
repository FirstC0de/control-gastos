import { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import QuickActionSheet from '../../components/QuickActionSheet';
import ExpenseFormModal from '../../components/ExpenseFormModal';
import IncomeFormModal from '../../components/IncomeFormModal';
import PDFImporterModal from '../../components/PDFImporterModal';

export default function TabsLayout() {
    const router = useRouter();
    const [showActions, setShowActions] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [showIncome, setShowIncome] = useState(false);
    const [showPDF, setShowPDF] = useState(false);

    const quickActions = [
        { emoji: '💸', label: 'Gasto', color: Colors.danger, onPress: () => setShowExpense(true) },
        { emoji: '💰', label: 'Ingreso', color: Colors.secondary, onPress: () => setShowIncome(true) },
        { emoji: '📄', label: 'PDF', color: Colors.primary, onPress: () => setShowPDF(true) },
        { emoji: '🏦', label: 'Ahorro', color: '#8b5cf6', onPress: () => router.push('/(tabs)/ahorros') },
        { emoji: '📈', label: 'Inversión', color: Colors.warning, onPress: () => router.push('/(tabs)/inversiones') },
    ];

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.textMuted,
                    tabBarStyle: styles.tabBar,
                    tabBarLabelStyle: styles.tabLabel,
                    headerStyle: { backgroundColor: Colors.card },
                    headerTintColor: Colors.text,
                    headerTitleStyle: { fontWeight: '700', fontSize: 17 },
                    headerShadowVisible: false,
                    tabBarShowLabel: true,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Inicio',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => <TabIcon emoji="🏠" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="gastos"
                    options={{
                        title: 'Gastos',
                        tabBarIcon: ({ color, focused }) => <TabIcon emoji="💸" color={color} focused={focused} />,
                    }}
                />
                {/* Central FAB placeholder */}
                <Tabs.Screen
                    name="nuevo"
                    options={{
                        title: '',
                        tabBarIcon: () => null,
                        tabBarButton: () => (
                            <TouchableOpacity
                                style={styles.fabWrapper}
                                onPress={() => setShowActions(true)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.fab}>
                                    <Text style={styles.fabText}>+</Text>
                                </View>
                            </TouchableOpacity>
                        ),
                    }}
                    listeners={{ tabPress: (e) => e.preventDefault() }}
                />
                <Tabs.Screen
                    name="metricas"
                    options={{
                        title: 'Métricas',
                        tabBarIcon: ({ color, focused }) => <TabIcon emoji="📊" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="inversiones"
                    options={{
                        title: 'Inversiones',
                        tabBarIcon: ({ color, focused }) => <TabIcon emoji="📈" color={color} focused={focused} />,
                    }}
                />

                {/* Pantallas ocultas del tab bar (accesibles desde dashboard y otros) */}
                <Tabs.Screen name="ingresos" options={{ href: null, title: 'Ingresos' }} />
                <Tabs.Screen name="ahorros" options={{ href: null, title: 'Ahorros' }} />
                <Tabs.Screen name="presupuestos" options={{ href: null, title: 'Presupuestos' }} />
                <Tabs.Screen name="tarjetas" options={{ href: null, title: 'Tarjetas' }} />
            </Tabs>

            <QuickActionSheet
                visible={showActions}
                onClose={() => setShowActions(false)}
                actions={quickActions}
            />
            <ExpenseFormModal visible={showExpense} onClose={() => setShowExpense(false)} />
            <IncomeFormModal visible={showIncome} onClose={() => setShowIncome(false)} />
            <PDFImporterModal visible={showPDF} onClose={() => setShowPDF(false)} />
        </>
    );
}

function TabIcon({ emoji, color, focused }: { emoji: string; color: string; focused: boolean }) {
    return (
        <View style={[styles.tabIconWrap, focused && styles.tabIconWrapFocused]}>
            <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.55 }]}>{emoji}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.card,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 0,
        shadowOpacity: 0,
    },
    tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    tabIconWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    tabIconWrapFocused: {},
    tabEmoji: { fontSize: 22 },

    fabWrapper: {
        top: -18,
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },
    fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34, marginTop: -2 },
});
