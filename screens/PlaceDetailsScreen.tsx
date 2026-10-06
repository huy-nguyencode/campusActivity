import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView, Linking } from 'react-native';
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
import { usePlaceCheckIn } from '@/hooks/usePlaceCheckIn';
import { subscribePlace } from '@/services/place-service';
import { haversineDistance } from '@/utils/geo-distance';
import { CONFIG } from '@/constants/app-config';
import { Place, BusyLevel } from '@/types/domain';
import { CrowdLevelButtons, CooldownTimer, StaleCrowdIndicator } from '@/components/checkin';
import { AdminOverridePanel } from '@/components/admin/AdminOverridePanel';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
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
} from '@/constants/theme-tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PLACE_TYPE_ICONS: Record<string, string> = {
    'library': '📚',
    'gym': '🏋️',
    'cafe': '☕️',
    'dining hall': '🍽️',
    'study': '📖',
    'food truck': '🍔',
    'the wall': '🍴',
    'bagel': '🥯',
    'restaurant': '🍴',
    'default': '📍',
};

export default function PlaceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const placeId = Array.isArray(id) ? id[0] : id;
    const [place, setPlace] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(placeId != null);
    const [placeError, setPlaceError] = useState<string | null>(
        placeId ? null : 'No place ID provided'
    );
    const [subscribedPlaceId, setSubscribedPlaceId] = useState(placeId);

    if (placeId !== subscribedPlaceId) {
        setSubscribedPlaceId(placeId);
        setPlace(null);
        setIsLoading(placeId != null);
        setPlaceError(placeId ? null : 'No place ID provided');
    }

    const {
        location,
        permission,
        isLoading: locationLoading,
        requestPermission,
    } = useLocation();
    const { uid, isLoading: authLoading, error: authError, retrySignIn } = useAuth();
    const {
        checkIn,
        isOnCooldown,
        cooldownEndTime,
        isLoading: checkInLoading,
        error: checkInError,
        refreshCooldown,
    } = usePlaceCheckIn(placeId ?? null);
    const { isAdmin, setOverride, clearOverride } = useAdminPermissions(uid);
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

    const canCheckIn = isNearby && hasGoodAccuracy && !isOnCooldown && !!uid && !authLoading;

    // iOS only shows the system prompt once; after a denial the user must go to Settings.
    const isLocationDenied = permission === 'denied' || permission === 'restricted';
    const canPromptForLocation = permission === 'undetermined' && !locationLoading;

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
        if (!placeId) return;

        const unsubscribe = subscribePlace(
            placeId,
            (fetchedPlace) => {
                if (fetchedPlace) {
                    setPlace(fetchedPlace);
                    setPlaceError(null);
                } else {
                    setPlaceError('Place not found');
                }
                setIsLoading(false);
            },
            (err) => {
                console.error('Error subscribing to place:', err);
                setPlaceError('Failed to load place');
                setIsLoading(false);
            }
        );

        return unsubscribe;
    }, [placeId]);

    const handleCheckIn = useCallback(async (level: BusyLevel) => {
        if (!location) return;

        const result = await checkIn(level, location);
        if (result) {
            router.back();
        }
    }, [checkIn, location]);

    const handleCooldownComplete = useCallback(() => {
        refreshCooldown();
    }, [refreshCooldown]);

    const backButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: backButtonScale.value }],
    }));

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

    if (placeError || !place) {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.errorIcon}>😕</Text>
                    <Text style={styles.errorText}>{placeError || 'Place not found'}</Text>
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

                        <View style={[styles.busyHero, { backgroundColor: busyStatus.lightBg }]}>
                            <Text style={styles.busyHeroEmoji}>{busyStatus.emoji}</Text>
                            <Text style={[styles.busyHeroLabel, { color: busyStatus.color }]}>
                                {busyStatus.label}
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <StaleCrowdIndicator
                    lastUpdate={place.adminOverride?.active
                        ? place.adminOverride.setAt ?? place.lastUpdate
                        : place.lastUpdate}
                />

                <Animated.View
                    entering={FadeInUp.duration(500).delay(200)}
                    style={styles.statusSection}
                >
                    {(isLocationDenied || canPromptForLocation) && (
                        <View style={styles.statusCard}>
                            <View style={styles.statusIconWrapper}>
                                <Text style={styles.statusIcon}>🚫</Text>
                            </View>
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusText}>Location is off</Text>
                                <Text style={styles.statusHint}>
                                    {isLocationDenied
                                        ? 'Turn on location for Campus Spots in Settings to check in'
                                        : 'Enable location to check in'}
                                </Text>
                                <Pressable
                                    style={styles.actionButton}
                                    onPress={isLocationDenied ? () => Linking.openSettings() : requestPermission}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.actionButtonText}>
                                        {isLocationDenied ? 'Open Settings' : 'Enable Location'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                    {!location && !isLocationDenied && !canPromptForLocation && (
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

                {isOnCooldown && cooldownEndTime && (
                    <Animated.View entering={FadeInUp.duration(500).delay(400)}>
                        <CooldownTimer
                            endTime={cooldownEndTime}
                            onComplete={handleCooldownComplete}
                        />
                    </Animated.View>
                )}

                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.buttonsSection}
                >
                    {authLoading && (
                        <Text style={styles.helperText}>Signing you in...</Text>
                    )}
                    {!authLoading && !uid && (
                        <View style={styles.authErrorContainer}>
                            <Text style={styles.helperText}>
                                {authError ?? 'Sign-in failed. Please try again.'}
                            </Text>
                            <Pressable
                                style={[styles.actionButton, styles.actionButtonCentered]}
                                onPress={retrySignIn}
                                accessibilityRole="button"
                                accessibilityLabel="Retry sign-in"
                            >
                                <Text style={styles.actionButtonText}>Retry</Text>
                            </Pressable>
                        </View>
                    )}
                    {checkInError && (
                        <Text style={styles.helperText}>{checkInError}</Text>
                    )}
                    <CrowdLevelButtons
                        onCheckIn={handleCheckIn}
                        disabled={!canCheckIn}
                        isLoading={checkInLoading}
                    />
                </Animated.View>

                {isAdmin && (
                    <Animated.View entering={FadeInUp.duration(500).delay(800)}>
                        <View style={styles.adminDivider} />
                        <AdminOverridePanel
                            placeId={place.id}
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
    helperText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.neutral[700],
        textAlign: 'center',
        marginBottom: SPACING[3],
    },
    authErrorContainer: {
        alignItems: 'center',
        marginBottom: SPACING[3],
    },
    actionButton: {
        alignSelf: 'flex-start',
        marginTop: SPACING[2],
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[2],
        backgroundColor: COLORS.primary[500],
        borderRadius: RADIUS.md,
    },
    actionButtonCentered: {
        alignSelf: 'center',
        marginTop: 0,
    },
    actionButtonText: {
        color: SEMANTIC_COLORS.text.inverse,
        fontFamily: FONTS.body.bold,
        fontSize: FONT_SIZES.sm,
    },
    adminDivider: {
        height: 1,
        backgroundColor: COLORS.neutral[200],
        marginHorizontal: SPACING[6],
        marginTop: SPACING[4],
    },
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
