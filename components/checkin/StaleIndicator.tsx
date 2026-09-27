import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CONFIG } from '@/constants/config';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
} from '@/constants/theme';

interface StaleIndicatorProps {
    lastUpdate: Date | null;
}

export function StaleIndicator({ lastUpdate }: StaleIndicatorProps) {
    const lastUpdateMs = lastUpdate?.getTime() ?? null;
    const [clock, setClock] = useState(() => ({
        lastUpdateMs,
        now: Date.now(),
    }));

    if (lastUpdateMs !== clock.lastUpdateMs) {
        // "Minutes ago" is relative to the moment this update is shown.
        // eslint-disable-next-line react-hooks/purity
        setClock({ lastUpdateMs, now: Date.now() });
    }

    if (!lastUpdate) {
        return (
            <View style={styles.noDataContainer}>
                <View style={styles.iconWrapper}>
                    <Text style={styles.icon}>❓</Text>
                </View>
                <Text style={styles.noDataText}>No recent data available</Text>
            </View>
        );
    }

    const timeSinceUpdate = clock.now - lastUpdate.getTime();
    const thresholdMs = CONFIG.STALE_CROWD_THRESHOLD * 60 * 1000;

    if (timeSinceUpdate < thresholdMs) {
        return null;
    }

    const minutesAgo = Math.floor(timeSinceUpdate / (60 * 1000));
    const timeAgoText = formatTimeAgo(minutesAgo);

    return (
        <View style={styles.container}>
            <View style={styles.pill}>
                <Text style={styles.pillIcon}>⏰</Text>
                <View style={styles.pillContent}>
                    <Text style={styles.pillTitle}>Data may be outdated</Text>
                    <Text style={styles.pillSubtitle}>Last updated {timeAgoText}</Text>
                </View>
            </View>
        </View>
    );
}

function formatTimeAgo(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING[5],
        paddingVertical: SPACING[2],
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent[100],
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[3],
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.accent[200],
    },
    pillIcon: {
        fontSize: 20,
        marginRight: SPACING[2],
    },
    pillContent: {
        flex: 1,
    },
    pillTitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.accent[800],
    },
    pillSubtitle: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.body.regular,
        color: COLORS.accent[600],
        marginTop: 1,
    },
    noDataContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING[5],
        marginVertical: SPACING[2],
        padding: SPACING[4],
        backgroundColor: COLORS.neutral[100],
        borderRadius: RADIUS.lg,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.neutral[200],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING[3],
    },
    icon: {
        fontSize: 18,
    },
    noDataText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.neutral[600],
    },
});
