/**
 * Map Screen - Main tab showing all campus locations
 *
 * LEARNING POINT: File-Based Routing
 *
 * In Expo Router, the file path determines the route:
 * - app/(tabs)/index.tsx -> "/" (default tab)
 * - app/(tabs)/places.tsx -> "/places"
 *
 * The (tabs) folder name with parentheses creates a "group" -
 * it affects layout (uses tabs/_layout.tsx) but doesn't appear in the URL.
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { router } from 'expo-router';
import { usePlaces } from '@/hooks/usePlaces';
import { useLocation } from '@/hooks/useLocation';
import { PlaceMarker } from '@/components/map';

/**
 * LEARNING POINT: Constants Outside Component
 *
 * DEFAULT_REGION is defined outside the component because:
 * 1. It never changes - no need to recreate it
 * 2. Prevents unnecessary re-renders
 * 3. Could be moved to config if needed elsewhere
 *
 * These coordinates center on Temple University in Philadelphia.
 */
const DEFAULT_REGION = {
    latitude: 39.98134318708127,
    longitude: -75.1543612006294,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

/**
 * LEARNING POINT: Screen Component Structure
 *
 * A well-structured screen component typically has:
 * 1. Hook calls at the top (data fetching, state)
 * 2. Loading/error handling (early returns)
 * 3. Computed values derived from state
 * 4. The render (JSX return)
 *
 * This pattern makes the component predictable and easy to follow.
 */
export default function MapScreen() {
    const { places, isLoading: placesLoading, error: placesError } = usePlaces();
    const { location, isLoading: locationLoading } = useLocation();

    /**
     * LEARNING POINT: Loading States
     *
     * Always handle loading states! Users should never see:
     * - Blank screens
     * - Partial data
     * - Jumping layouts when data loads
     *
     * A spinner or skeleton tells users "something is happening".
     */
    if (placesLoading || locationLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    /**
     * LEARNING POINT: Error Handling UX
     *
     * When errors occur:
     * 1. Tell the user what went wrong (in simple terms)
     * 2. Offer a way to recover (retry button, go back)
     * 3. Log details for debugging (console.error)
     *
     * Never show raw error messages or stack traces to users.
     */
    if (placesError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>Unable to load places</Text>
                <Text style={styles.errorHint}>Check your connection and try again</Text>
            </View>
        );
    }

    /**
     * LEARNING POINT: Fallback Values
     *
     * When user location isn't available, we fall back to DEFAULT_REGION.
     * This ensures the map always shows something useful rather than
     * defaulting to coordinates 0,0 (middle of the ocean!).
     *
     * The ternary operator is a concise way to handle this:
     * condition ? valueIfTrue : valueIfFalse
     */
    const region = location
        ? {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
          }
        : DEFAULT_REGION;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={true}
                /**
                 * LEARNING POINT: Platform Considerations
                 *
                 * react-native-maps uses:
                 * - Apple Maps on iOS (by default)
                 * - Google Maps on Android
                 *
                 * Behaviors may differ! Always test on both platforms.
                 * You can force Google Maps on iOS with provider="google"
                 * but that requires additional setup.
                 */
            >
                {/**
                 * LEARNING POINT: Rendering Lists in JSX
                 *
                 * .map() transforms an array into JSX elements.
                 * Each item needs a unique `key` prop so React can:
                 * 1. Track which items changed
                 * 2. Efficiently update the DOM
                 * 3. Maintain component state correctly
                 *
                 * Use stable IDs (like database IDs), never array indices
                 * for lists that can reorder or filter.
                 */}
                {places.map((place) => (
                    <PlaceMarker
                        key={place.id}
                        place={place}
                        onPress={() => router.push(`/place/${place.id}` as any)}
                    />
                ))}
            </MapView>

            {/* Places count indicator */}
            <View style={styles.countBadge}>
                <Text style={styles.countText}>
                    {places.length} {places.length === 1 ? 'location' : 'locations'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    errorHint: {
        fontSize: 14,
        color: '#6B7280',
    },
    countBadge: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    countText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
});
