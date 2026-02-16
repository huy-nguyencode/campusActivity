/**
 * Place Detail Screen
 *
 * LEARNING POINT: Dynamic Routes in Expo Router
 *
 * The [id].tsx filename creates a dynamic route. The brackets tell Expo Router
 * that this segment is a parameter. So:
 * - /place/library-main -> id = "library-main"
 * - /place/gym-rec -> id = "gym-rec"
 *
 * Access the parameter with useLocalSearchParams().
 */
import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { useCheckIn } from '@/hooks/useCheckIn';
import { subscribePlace } from '@/services/placesService';
import { haversineDistance } from '@/utils/geoDistance';
import { CONFIG } from '@/constants/appConfig';
import { Place, BusyLevel } from '@/types';
import { CheckInButtons, CooldownTimer, StaleIndicator } from '@/components/checkin';
import { AdminOverridePanel } from '@/components/admin/AdminOverridePanel';
import { useAdmin } from '@/hooks/useAdmin';
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

const PLACE_TYPE_ICONS: Record<string, string> = {
    'library': '📚',
    'gym': '🏋️',
    'cafe': '☕',
    'dining hall': '🍽️',
    'study': '📖',
    'food truck': '🍔',
};

export default function PlaceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [place, setPlace] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { location } = useLocation();
    const { uid } = useAuth();
    const { checkIn, isOnCooldown, cooldownEndTime, isLoading: checkInLoading, refreshCooldown } = useCheckIn(id ?? null);
    const { isAdmin, setOverride, clearOverride } = useAdmin(uid);
    /**
     * LEARNING POINT: Safe Area Insets for Headerless Screens
     *
     * When headerShown is false, your content extends behind the status bar
     * and notch. useSafeAreaInsets() gives the exact pixel offsets so you can
     * position a floating back button and pad the hero content to stay clear
     * of the notch on any device (iPhone SE vs Dynamic Island vs Android).
     */
    const insets = useSafeAreaInsets();

    const backButtonScale = useSharedValue(1);

    const isNearby = (() => {
        if (!place || !location) return false;
        const distance = haversineDistance(
            location.latitude,
            location.longitude,
            place.location.latitude,
            place.location.longitude
        );
        return distance <= CONFIG.CHECK_IN_RADIUS;
    })();

    const hasGoodAccuracy = location?.accuracy
        ? location.accuracy <= CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN
        : false;

    const canCheckIn = isNearby && hasGoodAccuracy && !isOnCooldown;

    /**
     * LEARNING POINT: Floating Back Button Pattern
     *
     * When you go headerless for full-screen layouts, you still need back
     * navigation. A floating button with position: 'absolute' sits on top
     * of any scrollable content. Extracting it as a variable avoids
     * duplicating JSX across loading/error/success states.
     */
    const floatingBackButton = (
        <Pressable
            style={[styles.floatingBackButton, { top: insets.top + SPACING[2] }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
        >
            <Feather name="chevron-left" size={24} color={COLORS.neutral[800]} />
        </Pressable>
    );

    useEffect(() => {
        if (!id) {
            setError('No place ID provided');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const unsubscribe = subscribePlace(
            id,
            (fetchedPlace) => {
                if (fetchedPlace) {
                    setPlace(fetchedPlace);
                } else {
                    setError('Place not found');
                }
                setIsLoading(false);
            },
            (err) => {
                console.error('Error subscribing to place:', err);
                setError('Failed to load place');
                setIsLoading(false);
            }
        );

        return unsubscribe;
    }, [id]);

    const handleCheckIn = useCallback(async (level: BusyLevel) => {
        const result = await checkIn(level);
        if (result.success) {
            router.back();
        }
        // Error is already set in the hook's state and shown via the error prop
    }, [checkIn]);

    /**
     * LEARNING POINT: Completing the Cooldown Lifecycle
     *
     * When the CooldownTimer counts down to zero, it fires onComplete.
     * We must re-check cooldown state here so the UI immediately shows
     * the check-in buttons again — without requiring navigation away
     * and back. This closes the loop: check in → cooldown starts →
     * timer expires → buttons reappear.
     */
    const handleCooldownComplete = useCallback(() => {
        refreshCooldown();
    }, [refreshCooldown]);

    const backButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: backButtonScale.value }],
    }));

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary[500]} />
                </View>
                {floatingBackButton}
            </View>
        );
    }

    // Error state
    if (error || !place) {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.errorIcon}>😕</Text>
                    <Text style={styles.errorText}>{error || 'Place not found'}</Text>
                    <AnimatedPressable
                        style={[styles.backButton, backButtonAnimatedStyle]}
                        onPress={() => router.back()}
                        onPressIn={() => {
                            backButtonScale.value = withSpring(ANIMATION.pressScale, ANIMATION.spring);
                        }}
                        onPressOut={() => {
                            backButtonScale.value = withSpring(1, ANIMATION.spring);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Go back to previous screen"
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </AnimatedPressable>
                </View>
                {floatingBackButton}
            </View>
        );
    }

    const busyStatus = getBusyStatus(place.busyPercent);
    const placeIcon = PLACE_TYPE_ICONS[place.type?.toLowerCase()] || PLACE_TYPE_ICONS.default;

    return (
        <View style={styles.container}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
                {/**
                 * LEARNING POINT: Cherry-Cream Gradient Hero
                 *
                 * The hero uses SEMANTIC_COLORS.background.warm (#FFF5F6) — a
                 * cherry-tinted cream — fading to white. This creates a blush
                 * "warm blanket" at the top that draws the eye downward and
                 * ties the header to the cherry color story.
                 */}
                <Animated.View entering={FadeInUp.duration(500)}>
                    <LinearGradient
                        colors={[SEMANTIC_COLORS.background.warm, COLORS.neutral[0]]}
                        style={[styles.header, { paddingTop: insets.top + SPACING[6] }]}
                    >
                        <View style={styles.iconContainer}>
                            <Text style={styles.placeIcon}>{placeIcon}</Text>
                        </View>
                        <Text style={styles.placeName}>{place.name}</Text>
                        <Text style={styles.placeType}>{place.type || 'Location'}</Text>

                        {/* Hero busy indicator — emoji is the centerpiece */}
                        <View style={[styles.busyHero, { backgroundColor: busyStatus.lightBg }]}>
                            <Text style={styles.busyHeroEmoji}>{busyStatus.emoji}</Text>
                            <Text style={[styles.busyHeroLabel, { color: busyStatus.color }]}>
                                {busyStatus.label}
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Stale Data Warning */}
                <StaleIndicator lastUpdate={place.lastUpdate} />

                {/* Status Cards — consolidated into a cleaner single card */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(200)}
                    style={styles.statusSection}
                >
                    {!location && (
                        <View style={styles.statusCard}>
                            <View style={styles.statusIconWrapper}>
                                <Text style={styles.statusIcon}>📍</Text>
                            </View>
                            <Text style={styles.statusText}>Waiting for location...</Text>
                        </View>
                    )}
                    {location && !isNearby && (
                        <View style={styles.statusCard}>
                            <View style={styles.statusIconWrapper}>
                                <Text style={styles.statusIcon}>📍</Text>
                            </View>
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusText}>Move closer to check in</Text>
                                <Text style={styles.statusHint}>Within {CONFIG.CHECK_IN_RADIUS}m of this location</Text>
                            </View>
                        </View>
                    )}
                    {location && isNearby && !hasGoodAccuracy && (
                        <View style={styles.statusCard}>
                            <View style={styles.statusIconWrapper}>
                                <Text style={styles.statusIcon}>📡</Text>
                            </View>
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusText}>GPS accuracy too low</Text>
                                <Text style={styles.statusHint}>Move to an open area for better signal</Text>
                            </View>
                        </View>
                    )}
                    {location && isNearby && hasGoodAccuracy && !isOnCooldown && (
                        <View style={[styles.statusCard, styles.statusCardReady]}>
                            <View style={[styles.statusIconWrapper, styles.statusIconReady]}>
                                <Text style={styles.statusIcon}>✅</Text>
                            </View>
                            <Text style={[styles.statusTextReady]}>Ready to check in!</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Cooldown Timer */}
                {isOnCooldown && cooldownEndTime && (
                    <Animated.View entering={FadeInUp.duration(500).delay(400)}>
                        <CooldownTimer
                            endTime={cooldownEndTime}
                            onComplete={handleCooldownComplete}
                        />
                    </Animated.View>
                )}

                {/* Check-in Buttons */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.buttonsSection}
                >
                    <CheckInButtons
                        onCheckIn={handleCheckIn}
                        disabled={!canCheckIn}
                        isLoading={checkInLoading}
                    />
                </Animated.View>

                {/* Admin Override Panel — only visible to admins */}
                {isAdmin && (
                    <Animated.View entering={FadeInUp.duration(500).delay(800)}>
                        {/* Subtle divider before admin section */}
                        <View style={styles.adminDivider} />
                        <AdminOverridePanel
                            placeId={id!}
                            currentOverride={place.adminOverride}
                            onApply={setOverride}
                            onRemove={clearOverride}
                        />
                    </Animated.View>
                )}
            </ScrollView>
            {floatingBackButton}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SEMANTIC_COLORS.background.primary,
    },
    contentContainer: {
        paddingBottom: SPACING[8],
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING[5],
        backgroundColor: SEMANTIC_COLORS.background.primary,
    },
    errorIcon: {
        fontSize: 36,
        marginBottom: SPACING[4],
    },
    errorText: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.body.semiBold,
        color: SEMANTIC_COLORS.text.secondary,
        marginBottom: SPACING[5],
        textAlign: 'center',
    },
    backButton: {
        paddingHorizontal: SPACING[6],
        paddingVertical: SPACING[3],
        backgroundColor: COLORS.primary[500],
        borderRadius: RADIUS.lg,
        ...SHADOWS.primaryGlow,
    },
    backButtonText: {
        color: SEMANTIC_COLORS.text.inverse,
        fontFamily: FONTS.body.bold,
        fontSize: FONT_SIZES.md,
    },
    header: {
        padding: SPACING[6],
        paddingTop: SPACING[6],
        alignItems: 'center',
        borderBottomLeftRadius: RADIUS['2xl'],
        borderBottomRightRadius: RADIUS['2xl'],
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.neutral[0],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING[4],
        ...SHADOWS.sm,
    },
    placeIcon: {
        fontSize: 28,
    },
    placeName: {
        fontSize: FONT_SIZES['3xl'],
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[1],
        textAlign: 'center',
    },
    placeType: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.tertiary,
        marginBottom: SPACING[3],
        textTransform: 'capitalize',
    },
    /**
     * LEARNING POINT: Hero Busy Indicator
     *
     * Making the busy percentage the visual centerpiece of the detail screen
     * gives users the information they came for immediately. The 5xl font
     * size creates a strong focal point, while the stacked label below
     * adds context. Wrapping in a tinted pill keeps it contained.
     */
    busyHero: {
        alignItems: 'center',
        paddingHorizontal: SPACING[5],
        paddingVertical: SPACING[5],
        borderRadius: RADIUS['2xl'],
    },
    busyHeroEmoji: {
        fontSize: 48,
    },
    busyHeroLabel: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.semiBold,
        marginTop: SPACING[1],
    },
    statusSection: {
        padding: SPACING[5],
        gap: SPACING[3],
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: SEMANTIC_COLORS.background.card,
        padding: SPACING[4],
        borderRadius: RADIUS.lg,
        ...SHADOWS.sm,
    },
    statusCardReady: {
        backgroundColor: COLORS.status.greenLight,
        padding: SPACING[5],
    },
    statusIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.neutral[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING[3],
    },
    statusIconReady: {
        backgroundColor: COLORS.status.green + '20',
    },
    statusIcon: {
        fontSize: 20,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.semiBold,
        color: SEMANTIC_COLORS.text.secondary,
    },
    statusTextReady: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.display.bold,
        color: COLORS.status.green,
    },
    statusHint: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.tertiary,
        marginTop: 2,
    },
    buttonsSection: {
        marginTop: SPACING[2],
    },
    adminDivider: {
        height: 1,
        backgroundColor: COLORS.neutral[200],
        marginHorizontal: SPACING[6],
        marginTop: SPACING[4],
    },
    /**
     * LEARNING POINT: Floating Action Button for Navigation
     *
     * position: 'absolute' takes the button out of the normal layout flow,
     * so it floats above the ScrollView and stays fixed while scrolling.
     * The `top` is set inline (insets.top + SPACING[2]) to adapt to
     * each device's safe area. The white circle + shadow makes it clearly
     * tappable without clashing with content behind it.
     */
    floatingBackButton: {
        position: 'absolute',
        left: SPACING[4],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.neutral[0],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        ...SHADOWS.sm,
        zIndex: 10,
    },
});
