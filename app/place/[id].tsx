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
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useCheckIn } from '@/hooks/useCheckIn';
import { getPlaceById } from '@/services/places';
import { haversineDistance } from '@/utils/haversine';
import { CONFIG, BUSY_COLORS } from '@/constants/config';
import { Place, BusyLevel, getBusyColor } from '@/types';
import { CheckInButtons, CooldownTimer, StaleIndicator } from '@/components/checkin';

/**
 * LEARNING POINT: Component Composition
 *
 * This screen now composes several smaller components:
 * - CheckInButtons: The emoji selection UI
 * - CooldownTimer: The countdown display
 * - StaleIndicator: The outdated data warning
 *
 * Benefits of composition:
 * 1. Each component is simple and focused
 * 2. Components are reusable in other screens
 * 3. Testing is easier (test each piece independently)
 * 4. Changes are localized (update one component, not the whole screen)
 */
export default function PlaceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [place, setPlace] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { location } = useLocation();
    const { checkIn, isOnCooldown, cooldownEndTime, isLoading: checkInLoading } = useCheckIn(id ?? null);

    /**
     * LEARNING POINT: Computed Values vs State
     *
     * isNearby, hasGoodAccuracy, and canCheckIn are computed from other values.
     * They don't need to be in useState because:
     * 1. They derive from location, place, and cooldown state
     * 2. React will recompute them when dependencies change
     * 3. No setter needed - they're always consistent with source data
     *
     * Rule: If a value can be computed from other state, don't store it in state.
     */
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
     * LEARNING POINT: useEffect for Data Fetching
     *
     * useEffect with [id] dependency means:
     * - Run when component mounts
     * - Run again if id changes
     * - Don't run on other re-renders
     *
     * The async pattern inside useEffect handles the promise correctly
     * since useEffect callbacks can't be async directly.
     */
    useEffect(() => {
        if (!id) {
            setError('No place ID provided');
            setIsLoading(false);
            return;
        }

        const fetchPlace = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedPlace = await getPlaceById(id);
                if (fetchedPlace) {
                    setPlace(fetchedPlace);
                } else {
                    setError('Place not found');
                }
            } catch (err) {
                console.error('Error fetching place:', err);
                setError('Failed to load place');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlace();
    }, [id]);

    /**
     * LEARNING POINT: useCallback for Event Handlers
     *
     * useCallback memoizes the function, preventing unnecessary re-creation.
     * This matters when passing callbacks to child components because:
     * 1. Without useCallback, a new function is created every render
     * 2. Child components see a "new" prop and might re-render
     * 3. useCallback returns the same function reference if deps haven't changed
     */
    const handleCheckIn = useCallback(async (level: BusyLevel) => {
        const result = await checkIn(level);
        if (result) {
            router.back();
        }
    }, [checkIn]);

    const handleCooldownComplete = useCallback(() => {
        // Could refresh state here, but the hook handles it
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Error state
    if (error || !place) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Place not found'}</Text>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back to previous screen"
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    /**
     * LEARNING POINT: Color Mapping
     *
     * We map semantic colors ('green', 'yellow', 'red') to actual hex values.
     * This separation allows:
     * 1. Business logic to use meaningful names
     * 2. Visual design to be centralized in constants
     * 3. Easy theme changes (dark mode could have different hex values)
     */
    const busyColorName = getBusyColor(place.busyPercent);
    const busyColor = {
        green: BUSY_COLORS.GREEN,
        yellow: BUSY_COLORS.YELLOW,
        red: BUSY_COLORS.RED,
    }[busyColorName];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeType}>{place.type}</Text>
                <View style={[styles.busyBadge, { backgroundColor: busyColor }]}>
                    <Text style={styles.busyText}>{place.busyPercent}% busy</Text>
                </View>
            </View>

            {/* Stale Data Warning */}
            <StaleIndicator lastUpdate={place.lastUpdate} />

            {/* Status Messages - Location and Accuracy */}
            <View style={styles.statusContainer}>
                {!location && (
                    <View style={styles.statusRow}>
                        <Text style={styles.statusIcon}>📍</Text>
                        <Text style={styles.statusText}>Waiting for location...</Text>
                    </View>
                )}
                {location && !isNearby && (
                    <View style={styles.statusRow}>
                        <Text style={styles.statusIcon}>📍</Text>
                        <Text style={styles.statusText}>Move closer to check in (within {CONFIG.CHECK_IN_RADIUS}m)</Text>
                    </View>
                )}
                {location && isNearby && !hasGoodAccuracy && (
                    <View style={styles.statusRow}>
                        <Text style={styles.statusIcon}>📡</Text>
                        <Text style={styles.statusText}>GPS accuracy too low, move to open area</Text>
                    </View>
                )}
                {location && isNearby && hasGoodAccuracy && !isOnCooldown && (
                    <View style={[styles.statusRow, styles.statusReady]}>
                        <Text style={styles.statusIcon}>✅</Text>
                        <Text style={[styles.statusText, styles.statusTextReady]}>Ready to check in!</Text>
                    </View>
                )}
            </View>

            {/* Cooldown Timer */}
            {isOnCooldown && cooldownEndTime && (
                <CooldownTimer
                    endTime={cooldownEndTime}
                    onComplete={handleCooldownComplete}
                />
            )}

            {/* Check-in Buttons */}
            <View style={styles.buttonsSection}>
                <CheckInButtons
                    onCheckIn={handleCheckIn}
                    disabled={!canCheckIn}
                    isLoading={checkInLoading}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    placeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    placeType: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
        textTransform: 'capitalize',
    },
    busyBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    busyText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    statusContainer: {
        padding: 16,
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
    },
    statusReady: {
        backgroundColor: '#ECFDF5',
    },
    statusIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    statusText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    statusTextReady: {
        color: '#059669',
        fontWeight: '500',
    },
    buttonsSection: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
