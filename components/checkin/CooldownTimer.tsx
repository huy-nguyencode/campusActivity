import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
} from '@/constants/theme';
import { CONFIG } from '@/constants/config';

interface CooldownTimerProps {
    endTime: Date;
    onComplete?: () => void;
}

/**
 * LEARNING POINT: Circular Progress Indicator
 *
 * We use SVG to create a circular progress ring. The key concepts:
 * 1. strokeDasharray - creates dashes in the stroke
 * 2. strokeDashoffset - moves the start of the dash pattern
 *
 * By setting dasharray to the circumference and animating dashoffset
 * from circumference to 0, we create a fill-up effect.
 */
const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 10; // Slightly thicker for warmth
const RADIUS_VALUE = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VALUE;

export function CooldownTimer({ endTime, onComplete }: CooldownTimerProps) {
    const calculateRemaining = useCallback(() => {
        return Math.max(0, endTime.getTime() - Date.now());
    }, [endTime]);

    const [remaining, setRemaining] = useState(calculateRemaining);

    const totalCooldown = CONFIG.CHECK_IN_COOLDOWN * 60 * 1000;
    const progress = 1 - remaining / totalCooldown;

    const pulseScale = useSharedValue(1);

    /**
     * LEARNING POINT: Gentler Pulse Animation
     *
     * The Cherry theme uses a subtler pulse (1.03 vs 1.05) with a slower
     * cycle (1200ms vs 1000ms) for a calmer, more refined breathing effect.
     * The timer should feel patient, not anxious.
     */
    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, [pulseScale]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    useEffect(() => {
        setRemaining(calculateRemaining());

        const interval = setInterval(() => {
            const newRemaining = calculateRemaining();
            setRemaining(newRemaining);

            if (newRemaining <= 0) {
                clearInterval(interval);
                onComplete?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, calculateRemaining, onComplete]);

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (remaining <= 0) {
        return null;
    }

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        /**
         * LEARNING POINT: Warm Card Wrapper for Timers
         *
         * Wrapping the cooldown timer in a warm-tinted card (accent-50 bg)
         * makes it feel like part of the design rather than a bare UI element
         * floating in space. The context text above ("You can check in again in...")
         * sets expectations and reduces user anxiety about the wait.
         */
        <View style={styles.cardWrapper}>
            <Text style={styles.contextText}>You can check in again in...</Text>
            <View style={styles.container}>
                <Animated.View style={[styles.circleContainer, pulseStyle]}>
                    {/* Background circle — softer track color */}
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS_VALUE}
                            stroke={COLORS.accent[200]}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                        />
                        {/* Progress circle */}
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS_VALUE}
                            stroke={COLORS.accent[500]}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                        />
                    </Svg>

                    {/* Timer display in center */}
                    <View style={styles.timerContent}>
                        <Text style={styles.time}>{formatTime(remaining)}</Text>
                        <Text style={styles.label}>cooldown</Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginHorizontal: SPACING[4],
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.xl,
        padding: SPACING[5],
        ...SHADOWS.warm,
    },
    contextText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: COLORS.accent[700],
        textAlign: 'center',
        marginBottom: SPACING[3],
    },
    container: {
        alignItems: 'center',
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    svg: {
        position: 'absolute',
    },
    timerContent: {
        alignItems: 'center',
    },
    time: {
        fontSize: FONT_SIZES['2xl'],
        fontFamily: FONTS.display.bold,
        color: COLORS.accent[700],
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.accent[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
