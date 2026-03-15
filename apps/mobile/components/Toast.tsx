import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Props = {
    message: string;
    type?: ToastType;
    visible: boolean;
    onHide: () => void;
    duration?: number;
};

const TYPE_COLORS: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: Colors.primary,
};

const TYPE_ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

export default function Toast({ message, type = 'success', visible, onHide, duration = 2500 }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(opacity, { toValue: 1, useNativeDriver: true, friction: 8 }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 20, duration: 250, useNativeDriver: true }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        } else {
            opacity.setValue(0);
            translateY.setValue(20);
        }
    }, [visible]);

    if (!visible) return null;

    const color = TYPE_COLORS[type];

    return (
        <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <Text style={[styles.icon, { color }]}>{TYPE_ICONS[type]}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

// Hook para usar el toast fácilmente
import { useState, useCallback } from 'react';

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '', type: 'success', visible: false,
    });

    const show = useCallback((message: string, type: ToastType = 'success') => {
        setToast({ message, type, visible: true });
    }, []);

    const hide = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return { toast, show, hide };
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.dark,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        zIndex: 9999,
        maxWidth: '85%',
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: { fontSize: 13, fontWeight: '700' },
    message: { fontSize: 14, fontWeight: '600', color: '#fff', flexShrink: 1 },
});
