import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { Place } from '@/types';
import {
    COLORS,
    SHADOWS,
} from '@/constants/theme';

interface PlaceMarkerProps {
    place: Place;
    onPress: () => void;
}

/**
 * LEARNING POINT: Place-Type Map Markers
 *
 * Instead of showing busyness on the pin itself, each marker displays
 * the place type icon (📚, 🏋️, ☕, etc.) on a cherry-themed background.
 * This lets users identify *what* a place is at a glance from the map.
 * Busyness detail is revealed in the callout on tap and on the detail screen.
 *
 * Note: Custom marker views have performance implications on Android.
 * For many markers (100+), consider using the default pinColor instead.
 */
const PLACE_TYPE_ICONS: Record<string, string> = {
    'library': '📚',
    'gym': '🏋️',
    'dining hall': '🍽️',
    'study': '📖',
    'food truck': '🍔',
    'the wall': '🍴',
    'bagel': '🥯',
    'restaurant': '🍴',
    'cafe': '☕️',
};

export function PlaceMarker({ place, onPress }: PlaceMarkerProps) {
    const placeIcon = PLACE_TYPE_ICONS[place.type] ?? '📍';

    return (
        <Marker
            coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
            }}
            onPress={onPress}
            accessibilityLabel={place.name}
        >
            {/* Circular marker showing place type icon */}
            <View style={styles.markerContainer}>
                <View style={styles.markerOuter}>
                    <Text style={styles.markerEmoji}>{placeIcon}</Text>
                </View>
                {/* Marker pointer/tail */}
                <View style={styles.markerPointer} />
            </View>

            {/* Disable the default callout — tapping navigates to detail screen */}
            <Callout tooltip>
                <></>
            </Callout>
        </Marker>
    );
}

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
    },
    markerOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.neutral[0],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.neutral[0],
        ...SHADOWS.md,
    },
    markerEmoji: {
        fontSize: 20,
    },
    markerPointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS.neutral[0],
        marginTop: -2,
    },
});
