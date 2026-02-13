import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { Place } from '@/types';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
    getBusyStatus,
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
    'cafe': '☕',
    'dining hall': '🍽️',
    'study': '📖',
    'food truck': '🍔',
};

export function PlaceMarker({ place, onPress }: PlaceMarkerProps) {
    const busyStatus = getBusyStatus(place.busyPercent);
    const placeIcon = PLACE_TYPE_ICONS[place.type] ?? '📍';

    return (
        <Marker
            coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
            }}
            onPress={onPress}
            accessibilityLabel={`${place.name}, ${busyStatus.label}`}
        >
            {/* Circular marker showing place type icon */}
            <View style={styles.markerContainer}>
                <View style={styles.markerOuter}>
                    <Text style={styles.markerEmoji}>{placeIcon}</Text>
                </View>
                {/* Marker pointer/tail */}
                <View style={styles.markerPointer} />
            </View>

            {/* Custom callout — busyness is shown here on tap */}
            <Callout tooltip onPress={onPress}>
                <View style={styles.callout}>
                    <View style={[styles.calloutStrip, { backgroundColor: busyStatus.color }]} />
                    <View style={styles.calloutContent}>
                        <Text style={styles.calloutTitle}>{place.name}</Text>
                        <View style={styles.calloutRow}>
                            <View style={[styles.busyPill, { backgroundColor: busyStatus.lightBg }]}>
                                <View style={[styles.busyDot, { backgroundColor: busyStatus.color }]} />
                                <Text style={[styles.busyText, { color: busyStatus.color }]}>
                                    {busyStatus.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
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
    callout: {
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    calloutStrip: {
        height: 4,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
    },
    calloutContent: {
        paddingHorizontal: SPACING[4],
        paddingVertical: SPACING[3],
    },
    calloutTitle: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[2],
    },
    calloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING[2],
    },
    busyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING[3],
        paddingVertical: SPACING[1],
        borderRadius: RADIUS.full,
    },
    busyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING[2],
    },
    busyText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
    },
});
