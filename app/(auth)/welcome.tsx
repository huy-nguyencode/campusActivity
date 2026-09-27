import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '@/hooks/useLocation';
import { router } from 'expo-router';
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

export default function Welcome() {
    const { requestPermission } = useLocation();
    const insets = useSafeAreaInsets();

    const primaryScale = useSharedValue(1);
    const secondaryScale = useSharedValue(1);

    const primaryAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: primaryScale.value }],
    }));

    const secondaryAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: secondaryScale.value }],
    }));

    const handleRequestPermission = async () => {
        await requestPermission();
        router.replace('/(tabs)');
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <LinearGradient
            colors={['#FFF5F6', '#FFE0E4', COLORS.neutral[0]]}
            locations={[0, 0.45, 1]}
            style={[
                styles.container,
                {
                    paddingTop: insets.top + SPACING[6],
                    paddingBottom: insets.bottom + SPACING[6],
                    paddingLeft: insets.left + SPACING[6],
                    paddingRight: insets.right + SPACING[6],
                },
            ]}
        >
            <Animated.View
                entering={FadeInUp.duration(700).delay(250)}
                style={styles.heroSection}
            >
                <View style={styles.emojiGlow}>
                    <Text style={styles.emoji}>📍</Text>
                </View>
                <Text style={styles.title}>Campus Spots</Text>
                <Text style={styles.subtitle}>
                    See how busy campus spots are in real-time
                </Text>
            </Animated.View>

            <Animated.View
                entering={FadeInUp.duration(700).delay(500)}
                style={styles.infoSection}
            >
                <View style={styles.infoCard}>
                    <View style={styles.infoAccent} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🔒</Text>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Privacy First</Text>
                            <Text style={styles.infoDescription}>
                                Your location is only used to find nearby places and verify check-ins. It is never stored. Check-ins are anonymous and deleted after 90 minutes.
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <Animated.View
                entering={FadeInUp.duration(700).delay(750)}
                style={styles.buttonSection}
            >
                <AnimatedPressable
                    style={[styles.primaryButtonOuter, primaryAnimatedStyle]}
                    onPress={handleRequestPermission}
                    onPressIn={() => {
                        primaryScale.value = withSpring(ANIMATION.pressScale, ANIMATION.spring);
                    }}
                    onPressOut={() => {
                        primaryScale.value = withSpring(1, ANIMATION.spring);
                    }}
                >
                    <LinearGradient
                        colors={[COLORS.primary[500], COLORS.primary[600]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryButtonGradient}
                    >
                        <Text style={styles.primaryButtonText}>Enable Location</Text>
                    </LinearGradient>
                </AnimatedPressable>

                <AnimatedPressable
                    style={[styles.secondaryButton, secondaryAnimatedStyle]}
                    onPress={handleSkip}
                    onPressIn={() => {
                        secondaryScale.value = withSpring(ANIMATION.pressScale, ANIMATION.spring);
                    }}
                    onPressOut={() => {
                        secondaryScale.value = withSpring(1, ANIMATION.spring);
                    }}
                >
                    <Text style={styles.secondaryButtonText}>Skip for now</Text>
                </AnimatedPressable>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiGlow: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primary[500] + '1F', // 12% opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING[5],
    },
    emoji: {
        fontSize: 64,
    },
    title: {
        fontSize: FONT_SIZES['4xl'],
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING[3],
    },
    subtitle: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: FONT_SIZES.lg * 1.5,
        marginBottom: SPACING[2],
    },
    infoSection: {
        marginBottom: SPACING[6],
    },
    infoCard: {
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.xl,
        padding: SPACING[4],
        flexDirection: 'row',
        ...SHADOWS.warm,
    },
    infoAccent: {
        width: 3,
        backgroundColor: COLORS.primary[500],
        borderRadius: 2,
        marginRight: SPACING[4],
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: SPACING[4],
        marginTop: 2,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.bold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[1],
    },
    infoDescription: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.secondary,
        lineHeight: FONT_SIZES.sm * 1.5,
    },
    buttonSection: {
        gap: SPACING[4],
    },
    primaryButtonOuter: {
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.primaryGlow,
    },
    primaryButtonGradient: {
        paddingVertical: SPACING[4],
        paddingHorizontal: SPACING[6],
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.body.bold,
        color: SEMANTIC_COLORS.text.inverse,
    },
    secondaryButton: {
        paddingVertical: SPACING[4],
        paddingHorizontal: SPACING[6],
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        backgroundColor: COLORS.neutral[100],
        minHeight: 56,
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.semiBold,
        color: SEMANTIC_COLORS.text.secondary,
    },
});
