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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlaceCardProps {
    place: Place;
    onPress: () => void;
}

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
            <View style={styles.topRow}>
                <View style={[styles.iconContainer, { backgroundColor: placeTypeInfo.tint }]}>
                    <Text style={styles.icon}>{placeTypeInfo.emoji}</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.name}>{place.name}</Text>
                    <Text style={styles.type}>{place.type || 'Location'}</Text>
                </View>
            </View>

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
