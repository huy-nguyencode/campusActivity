import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BusyLevel } from '@/types';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    ANIMATION,
    SEMANTIC_COLORS,
} from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUSY_LEVELS: {
    level: BusyLevel;
    emoji: string;
    label: string;
    bgColor: string;
    textColor: string;
}[] = [
    {
        level: 1,
        emoji: '😴',
        label: 'Not Busy',
        bgColor: COLORS.status.greenLight,
        textColor: COLORS.status.green,
    },
    {
        level: 2,
        emoji: '🙂',
        label: 'Moderate',
        bgColor: COLORS.accent[100],
        textColor: COLORS.accent[700],
    },
    {
        level: 3,
        emoji: '🤬',
        label: 'Very Busy',
        bgColor: COLORS.status.redLight,
        textColor: COLORS.status.red,
    },
];

interface CheckInButtonsProps {
    onCheckIn: (level: BusyLevel) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

function BusyButton({
    level,
    emoji,
    label,
    bgColor,
    textColor,
    disabled,
    onPress,
}: {
    level: BusyLevel;
    emoji: string;
    label: string;
    bgColor: string;
    textColor: string;
    disabled: boolean;
    onPress: () => void;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withSpring(ANIMATION.pressScale, ANIMATION.spring);
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, ANIMATION.spring);
    };

    return (
        <AnimatedPressable
            style={[
                styles.emojiButton,
                { backgroundColor: bgColor },
                disabled && styles.emojiButtonDisabled,
                animatedStyle,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            accessibilityLabel={`Rate as ${label}`}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[
                styles.emojiLabel,
                { color: textColor },
                disabled && styles.emojiLabelDisabled,
            ]}>
                {label}
            </Text>
        </AnimatedPressable>
    );
}

export function CheckInButtons({ onCheckIn, disabled = false, isLoading = false }: CheckInButtonsProps) {
    const handlePress = async (level: BusyLevel) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onCheckIn(level);
    };

    return (
        <View style={styles.outerContainer}>
            <View style={styles.cardContainer}>
                <Text style={styles.promptText}>How's it looking?</Text>
                <View style={styles.emojiRow}>
                    {BUSY_LEVELS.map(({ level, emoji, label, bgColor, textColor }) => (
                        <BusyButton
                            key={level}
                            level={level}
                            emoji={emoji}
                            label={label}
                            bgColor={bgColor}
                            textColor={textColor}
                            disabled={disabled || isLoading}
                            onPress={() => handlePress(level)}
                        />
                    ))}
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary[500]} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: SPACING[4],
    },
    cardContainer: {
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.xl,
        padding: SPACING[5],
        ...SHADOWS.warm,
    },
    promptText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.display.bold,
        textAlign: 'center',
        marginBottom: SPACING[4],
        color: SEMANTIC_COLORS.text.primary,
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: SPACING[3],
    },
    emojiButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING[3],
        paddingHorizontal: SPACING[3],
        borderRadius: RADIUS['2xl'],
    },
    emojiButtonDisabled: {
        opacity: 0.5,
    },
    emoji: {
        fontSize: 40,
        marginBottom: SPACING[2],
    },
    emojiLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.semiBold,
    },
    emojiLabelDisabled: {
        color: COLORS.neutral[400],
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.xl,
    },
});
