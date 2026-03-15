import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';

type Props = {
    value: string;                          // raw string, e.g. "12400" o "124,50"
    onChange: (v: string) => void;
    currency: 'ARS' | 'USD';
    onToggleCurrency: () => void;
    onConfirm: () => void;                  // tap Listo
};

/** Formatea el raw value para mostrar en el display grande */
export function formatAmountDisplay(raw: string, currency: 'ARS' | 'USD'): string {
    if (!raw) return currency === 'USD' ? 'U$D 0' : '$ 0';
    const [intPart, decPart] = raw.split(',');
    const intFormatted = parseInt(intPart || '0').toLocaleString('es-AR');
    const symbol = currency === 'USD' ? 'U$D ' : '$ ';
    return decPart !== undefined
        ? `${symbol}${intFormatted},${decPart}`
        : `${symbol}${intFormatted}`;
}

/** Convierte el raw value a número para guardar */
export function parseRawAmount(raw: string): number {
    if (!raw) return 0;
    return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
}

export default function NumericKeyboard({ value, onChange, currency, onToggleCurrency, onConfirm }: Props) {
    const hasDecimal = value.includes(',');
    const decimalPart = hasDecimal ? value.split(',')[1] : '';

    const press = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (key === '⌫') {
            onChange(value.slice(0, -1));
            return;
        }
        if (key === ',') {
            if (!hasDecimal) onChange(value ? value + ',' : '0,');
            return;
        }

        // Limitar decimales a 2 dígitos
        if (hasDecimal && decimalPart.length >= 2) return;

        // Limitar parte entera a 10 dígitos
        const intPart = value.split(',')[0];
        if (!hasDecimal && intPart.length >= 10) return;

        // Agregar cero(s) al inicio
        if (key === '000' || key === '00') {
            if (!value || value === '0') return;
            onChange(value + key);
            return;
        }

        // Evitar doble cero al inicio
        if (key === '0' && (value === '0' || !value)) {
            onChange('0,');   // tap en 0 sin monto → empieza decimal directo
            return;
        }

        onChange(value + key);
    };

    const KEY_ROWS = [
        ['7', '8', '9', '⌫'],
        ['4', '5', '6', ','],
        ['1', '2', '3', currency === 'ARS' ? '↔ USD' : '↔ ARS'],
        ['000', '0', '00', '✓'],
    ];

    return (
        <View style={styles.keyboard}>
            {KEY_ROWS.map((row, ri) => (
                <View key={ri} style={styles.row}>
                    {row.map((key) => {
                        const isConfirm = key === '✓';
                        const isDelete  = key === '⌫';
                        const isCurrency = key.startsWith('↔');
                        const isSpecial = isConfirm || isDelete || isCurrency;

                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.key,
                                    isConfirm && styles.keyConfirm,
                                    isDelete  && styles.keyDelete,
                                    isCurrency && styles.keyCurrency,
                                ]}
                                onPress={() => {
                                    if (isConfirm) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onConfirm(); }
                                    else if (isCurrency) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleCurrency(); }
                                    else press(key);
                                }}
                                activeOpacity={0.6}
                            >
                                <Text style={[
                                    styles.keyText,
                                    isConfirm  && styles.keyTextConfirm,
                                    isDelete   && styles.keyTextDelete,
                                    isCurrency && styles.keyTextCurrency,
                                ]}>
                                    {key}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    keyboard: {
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 6,
    },
    row: { flexDirection: 'row', gap: 6 },
    key: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: Colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    keyConfirm: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    keyDelete: {
        backgroundColor: Colors.danger + '12',
        borderColor: Colors.danger + '30',
    },
    keyCurrency: {
        backgroundColor: Colors.secondary + '12',
        borderColor: Colors.secondary + '30',
    },
    keyText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text,
    },
    keyTextConfirm: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    keyTextDelete: {
        color: Colors.danger,
        fontSize: 18,
    },
    keyTextCurrency: {
        color: Colors.secondary,
        fontSize: 13,
        fontWeight: '700',
    },
});
