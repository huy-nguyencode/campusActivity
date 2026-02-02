import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * LEARNING POINT: Props Interface with Required vs Optional
 *
 * endTime is required because the component can't function without it.
 * onComplete is optional - the parent might not care when cooldown ends.
 * This flexibility lets the same component work in different contexts.
 */
interface CooldownTimerProps {
    /** When the cooldown period ends */
    endTime: Date;
    /** Called when countdown reaches zero */
    onComplete?: () => void;
}

/**
 * CooldownTimer - Displays a countdown until user can check in again
 *
 * LEARNING POINT: Why Extract This Component?
 *
 * Timer logic is complex (intervals, cleanup, edge cases). By isolating it:
 * 1. The parent component stays clean and readable
 * 2. Timer logic is testable in isolation
 * 3. The timer is reusable anywhere we need countdowns
 *
 * LEARNING POINT: useEffect for Side Effects
 *
 * setInterval is a "side effect" - it does something outside React's
 * render cycle. useEffect is the right place for side effects because:
 * 1. It runs after render (doesn't block the UI)
 * 2. It provides cleanup (the return function)
 * 3. It re-runs when dependencies change
 */
export function CooldownTimer({ endTime, onComplete }: CooldownTimerProps) {
    /**
     * LEARNING POINT: Derived State Calculation
     *
     * Instead of storing remaining time in state and updating it,
     * we calculate it from the endTime. This ensures accuracy even if
     * the component re-renders for other reasons.
     *
     * We use a function to initialize state - this is called "lazy initialization"
     * and runs only once, not on every render.
     */
    const calculateRemaining = useCallback(() => {
        return Math.max(0, endTime.getTime() - Date.now());
    }, [endTime]);

    const [remaining, setRemaining] = useState(calculateRemaining);

    /**
     * LEARNING POINT: Interval Cleanup Pattern
     *
     * This is a classic React pattern for timers:
     * 1. Create interval in useEffect
     * 2. Store interval ID for cleanup
     * 3. Clear interval when component unmounts OR dependencies change
     *
     * CRITICAL: Always clean up intervals! Forgetting to do so causes:
     * - Memory leaks
     * - Multiple intervals running simultaneously
     * - Callbacks running on unmounted components (React warnings)
     */
    useEffect(() => {
        // Calculate immediately on mount or when endTime changes
        setRemaining(calculateRemaining());

        // Update every second
        const interval = setInterval(() => {
            const newRemaining = calculateRemaining();
            setRemaining(newRemaining);

            // Check if cooldown has ended
            if (newRemaining <= 0) {
                clearInterval(interval);
                onComplete?.();
            }
        }, 1000);

        // Cleanup function - called on unmount or before re-running effect
        return () => clearInterval(interval);
    }, [endTime, calculateRemaining, onComplete]);

    /**
     * LEARNING POINT: Formatting Time Values
     *
     * When displaying time to users, consider:
     * 1. Zero-padding for consistency (05 vs 5)
     * 2. Appropriate units (don't show hours if always < 1hr)
     * 3. Edge cases (what shows when time is 0?)
     *
     * Math.floor for minutes ensures we don't show "90 min" when 89.5 min remain.
     * padStart(2, '0') ensures seconds are always 2 digits.
     */
    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // If cooldown is over, don't render anything
    if (remaining <= 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⏱️</Text>
            <View style={styles.textContainer}>
                <Text style={styles.label}>Cooldown Active</Text>
                <Text style={styles.time}>{formatTime(remaining)}</Text>
                <Text style={styles.hint}>You can check in again soon</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7', // Amber-100
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 20,
    },
    icon: {
        fontSize: 32,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E', // Amber-800
    },
    time: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#78350F', // Amber-900
        marginVertical: 4,
    },
    hint: {
        fontSize: 12,
        color: '#B45309', // Amber-700
    },
});
