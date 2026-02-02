import { View, Text, StyleSheet } from 'react-native';
import { CONFIG } from '@/constants/config';

/**
 * LEARNING POINT: Simple, Focused Props
 *
 * This component only needs the lastUpdate timestamp.
 * It doesn't need to know:
 * - What place this is for
 * - What the busy percentage is
 * - How to format the "stale" threshold
 *
 * By keeping props minimal, the component stays flexible and reusable.
 */
interface StaleIndicatorProps {
    /** When the data was last updated */
    lastUpdate: Date | null;
}

/**
 * StaleIndicator - Shows warning when crowd data might be outdated
 *
 * LEARNING POINT: User Trust and Data Quality
 *
 * Users need to know when data might not be reliable. This is crucial for:
 * 1. Setting expectations - stale data might not reflect current reality
 * 2. Building trust - honest apps acknowledge their limitations
 * 3. Encouraging engagement - if data is stale, user's check-in helps!
 *
 * The threshold is configurable via CONFIG.STALE_CROWD_THRESHOLD.
 */
export function StaleIndicator({ lastUpdate }: StaleIndicatorProps) {
    /**
     * LEARNING POINT: Early Returns for Cleaner Code
     *
     * Instead of nesting conditions:
     *   if (lastUpdate) {
     *     if (isStale) {
     *       return <component>;
     *     }
     *   }
     *   return null;
     *
     * We use early returns to handle edge cases first, keeping the
     * "happy path" at the top level. This is called "guard clauses".
     */

    // No timestamp means no data yet
    if (!lastUpdate) {
        return (
            <View style={styles.container}>
                <Text style={styles.icon}>❓</Text>
                <Text style={styles.text}>No recent data available</Text>
            </View>
        );
    }

    // Calculate time since last update
    const timeSinceUpdate = Date.now() - lastUpdate.getTime();
    const thresholdMs = CONFIG.STALE_CROWD_THRESHOLD * 60 * 1000;

    // Data is fresh, don't show indicator
    if (timeSinceUpdate < thresholdMs) {
        return null;
    }

    // Calculate how long ago in human-readable format
    const minutesAgo = Math.floor(timeSinceUpdate / (60 * 1000));
    const timeAgoText = formatTimeAgo(minutesAgo);

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⚠️</Text>
            <View style={styles.textContainer}>
                <Text style={styles.text}>Data may be outdated</Text>
                <Text style={styles.subtext}>Last updated {timeAgoText}</Text>
            </View>
        </View>
    );
}

/**
 * LEARNING POINT: Human-Readable Time Formatting
 *
 * Users understand "2 hours ago" better than "120 minutes ago" or a timestamp.
 * Good UX means presenting data in the most intuitive format.
 *
 * This is a pure function - same input always gives same output.
 * Pure functions are easy to test and have no hidden dependencies.
 */
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2', // Red-50
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 20,
        marginVertical: 8,
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        fontWeight: '500',
        color: '#991B1B', // Red-800
    },
    subtext: {
        fontSize: 12,
        color: '#B91C1C', // Red-700
        marginTop: 2,
    },
});
