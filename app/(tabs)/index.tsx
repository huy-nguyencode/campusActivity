import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePlaces } from '@/hooks/usePlaces';
import { useLocation } from '@/hooks/useLocation';
import { PlaceMarker } from '@/components/map';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
} from '@/constants/theme';

const DEFAULT_REGION = {
    latitude: 39.98134318708127,
    longitude: -75.1543612006294,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export default function MapScreen() {
    const { places, isLoading: placesLoading, error: placesError, refresh } = usePlaces();
    const { location, isLoading: locationLoading } = useLocation();
    const insets = useSafeAreaInsets();

    if (placesLoading || locationLoading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingEmoji}>📍</Text>
                <Text style={styles.loadingText}>Finding campus spots...</Text>
                <ActivityIndicator
                    size="small"
                    color={COLORS.primary[500]}
                    style={styles.loadingSpinner}
                />
            </View>
        );
    }

    if (placesError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>Unable to load places</Text>
                <Text style={styles.errorHint}>Check your connection and try again</Text>
                <Pressable
                    style={styles.retryButton}
                    onPress={() => refresh?.()}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
            </View>
        );
    }

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
                style={[
                    styles.map,
                    {
                        top: -insets.top,
                        bottom: -insets.bottom,
                    },
                ]}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {places.map((place) => (
                    <PlaceMarker
                        key={place.id}
                        place={place}
                        onPress={() => router.push(`/place/${place.id}` as any)}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: SEMANTIC_COLORS.background.warm,
        padding: SPACING[6],
    },
    loadingEmoji: {
        fontSize: 36,
        marginBottom: SPACING[4],
    },
    loadingText: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.display.semiBold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[3],
    },
    loadingSpinner: {
        marginTop: SPACING[2],
    },
    errorIcon: {
        fontSize: 36,
        marginBottom: SPACING[4],
    },
    errorText: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.body.semiBold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[2],
    },
    errorHint: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.secondary,
        marginBottom: SPACING[5],
    },
    retryButton: {
        backgroundColor: COLORS.primary[500],
        paddingHorizontal: SPACING[6],
        paddingVertical: SPACING[3],
        borderRadius: RADIUS.lg,
        ...SHADOWS.primaryGlow,
    },
    retryButtonText: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.bold,
        color: SEMANTIC_COLORS.text.inverse,
    },
});
