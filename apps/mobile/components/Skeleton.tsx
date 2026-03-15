import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

type SkeletonBoxProps = {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
};

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor: Colors.border },
                { opacity },
                style,
            ]}
        />
    );
}

/** Skeleton de una fila de transacción */
export function SkeletonTransactionRow() {
    return (
        <View style={styles.row}>
            <SkeletonBox width={40} height={40} borderRadius={12} />
            <View style={styles.rowContent}>
                <SkeletonBox width="65%" height={14} borderRadius={6} />
                <SkeletonBox width="40%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
            </View>
            <SkeletonBox width={60} height={14} borderRadius={6} />
        </View>
    );
}

/** Skeleton del hero card del dashboard */
export function SkeletonHeroCard() {
    return (
        <View style={styles.heroCard}>
            <SkeletonBox width="50%" height={13} borderRadius={6} style={{ opacity: 0.4 } as any} />
            <SkeletonBox width="70%" height={38} borderRadius={8} style={{ marginTop: 8, opacity: 0.5 } as any} />
            <View style={styles.heroRow}>
                <SkeletonBox width="30%" height={48} borderRadius={12} style={{ opacity: 0.3 } as any} />
                <SkeletonBox width="30%" height={48} borderRadius={12} style={{ opacity: 0.3 } as any} />
                <SkeletonBox width="30%" height={48} borderRadius={12} style={{ opacity: 0.3 } as any} />
            </View>
        </View>
    );
}

/** Skeleton de un chip del grid del dashboard */
export function SkeletonChip() {
    return (
        <View style={styles.chip}>
            <SkeletonBox width={40} height={40} borderRadius={12} />
            <SkeletonBox width="70%" height={12} borderRadius={5} style={{ marginTop: 8 }} />
            <SkeletonBox width="50%" height={10} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
    );
}

/** Skeleton de una sección completa de lista */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
    return (
        <View style={styles.list}>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTransactionRow key={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.card,
    },
    rowContent: { flex: 1, gap: 2 },
    heroCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        backgroundColor: Colors.primaryDark,
        gap: 8,
    },
    heroRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    chip: {
        width: '30.5%',
        backgroundColor: Colors.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    list: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', marginHorizontal: 16 },
});
