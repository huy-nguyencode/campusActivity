import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Place } from '@/types';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    ANIMATION,
    SEMANTIC_COLORS,
    getBusyStatus,
} from '@/constants/theme';

/**
 * LEARNING POINT: Animated Pressable Pattern
 *
 * We wrap Pressable with Animated.createAnimatedComponent to enable
 * smooth animations on press. This creates a more tactile, responsive
 * feel compared to static style changes.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlaceCardProps {
    place: Place;
    onPress: () => void;
}

/**
 * LEARNING POINT: Place Type Icons & Tint Colors
 *
 * Each place type gets both an emoji AND a tinted background color.
 * This makes each card feel unique rather than identical — users can
 * scan by color as well as by icon. The tint is a very light wash
 * of a semantically relevant color (green for nature-ish, blue for
 * study, etc.).
 */
/**
 * LEARNING POINT: Cherry-Tinted Type Icons
 *
 * Each place type gets an emoji AND a tinted background from the cherry
 * palette. Library/study use secondary teal tints, food uses accent gold,
 * gym uses green, and lab uses cherry primary. The result: each card
 * has a unique color signature while staying harmonious with the theme.
 */
const PLACE_TYPE_ICONS: Record<string, { emoji: string; tint: string }> = {
    'library': { emoji: '📚', tint: COLORS.secondary[50] },
    'gym': { emoji: '🏋️', tint: COLORS.status.greenLight },
    'cafe': { emoji: '☕', tint: COLORS.accent[50] },
    'dining hall': { emoji: '🍽️', tint: COLORS.accent[50] },
    'study': { emoji: '📖', tint: COLORS.secondary[50] },
    'food truck': { emoji: '🍔', tint: COLORS.accent[50] },
    'restaurant': { emoji: '🍽️', tint: COLORS.accent[50] },
    'the wall': {emoji: '🍴', tint: COLORS.accent[50] },
    'default': { emoji: '📍', tint: COLORS.neutral[100] },
};

export function PlaceCard({ place, onPress }: PlaceCardProps) {
    const scale = useSharedValue(1);

    const busyStatus = getBusyStatus(place.busyPercent);
    const placeTypeInfo = PLACE_TYPE_ICONS[place.type] || PLACE_TYPE_ICONS.default;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(ANIMATION.pressScale, ANIMATION.spring);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, ANIMATION.spring);
    };

    return (
        <AnimatedPressable
            style={[
                styles.container,
                animatedStyle,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            {/* Top row: icon + text + percentage */}
            <View style={styles.topRow}>
                {/* Circular icon container with type-specific tint */}
                <View style={[styles.iconContainer, { backgroundColor: placeTypeInfo.tint }]}>
                    <Text style={styles.icon}>{placeTypeInfo.emoji}</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.name}>{place.name}</Text>
                    <Text style={styles.type}>{place.type || 'Location'}</Text>
                </View>
            </View>

            {/**
             * LEARNING POINT: Full-Width Status Bar
             *
             * Instead of a small pill badge, a full-width colored strip at the
             * bottom of the card shows the busy level visually. The rounded
             * bottom corners match the card shape. This gives each card a
             * distinctive "footer" that communicates status at a glance —
             * green = good, yellow = moderate, red = busy. The bar width
             * could even be proportional to the percentage for extra polish.
             */}
            <View style={[styles.busyBar, { backgroundColor: busyStatus.lightBg }]}>
                <View style={[styles.busyDot, { backgroundColor: busyStatus.color }]} />
                <Text style={[styles.busyLabel, { color: busyStatus.color }]}>
                    {busyStatus.label}
                </Text>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    /**
     * LEARNING POINT: Cherry-Tinted Card Shadows
     *
     * Using SHADOWS.warm (cherry primary[200] tint) instead of SHADOWS.md
     * (black) makes cards appear to float on soft pink cushions — the
     * signature visual detail of the Cherry theme. Every card in the app
     * uses this warm shadow for consistency.
     */
    container: {
        borderRadius: RADIUS.xl,
        backgroundColor: SEMANTIC_COLORS.background.card,
        marginBottom: SPACING[3],
        ...SHADOWS.warm,
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING[4],
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING[3],
    },
    icon: {
        fontSize: 28,
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: 2,
    },
    type: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.tertiary,
        textTransform: 'capitalize',
    },
    busyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING[2],
        paddingHorizontal: SPACING[5],
    },
    busyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING[2],
    },
    busyLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        flex: 1,
    },
});
