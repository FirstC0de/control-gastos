import { useEffect, useRef } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    Animated, Pressable,
} from 'react-native';
import { Colors } from '../constants/Colors';

type Action = {
    emoji: string;
    label: string;
    color: string;
    onPress: () => void;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    actions: Action[];
};

export default function QuickActionSheet({ visible, onClose, actions }: Props) {
    const translateY = useRef(new Animated.Value(300)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 70 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 300, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.backdrop, { opacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                <View style={styles.handle} />
                <Text style={styles.title}>Agregar...</Text>

                <View style={styles.grid}>
                    {actions.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.actionBtn}
                            onPress={() => { onClose(); setTimeout(action.onPress, 250); }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                            </View>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    actionBtn: {
        width: '30%',
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 68,
        height: 68,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionEmoji: { fontSize: 30 },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});
