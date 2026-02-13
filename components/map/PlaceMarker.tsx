import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { Place, getBusyColor } from '@/types';
import { BUSY_COLORS } from '@/constants/config';

/**
 * LEARNING POINT: Component Props with Callback Pattern
 *
 * onPress is a callback - the parent decides what happens when pressed.
 * This follows the "inversion of control" principle:
 * - The marker doesn't know about navigation, routing, or parent state
 * - The parent provides the behavior by passing a function
 *
 * This makes PlaceMarker reusable in different contexts (map view,
 * place details, admin dashboard, etc.)
 */
interface PlaceMarkerProps {
    place: Place;
    onPress: () => void;
}

/**
 * PlaceMarker - A map marker with busyness-colored indicator
 *
 * LEARNING POINT: Wrapping Third-Party Components
 *
 * react-native-maps Marker has many props and behaviors.
 * By wrapping it in our own component, we:
 * 1. Provide a simpler API (just place + onPress)
 * 2. Ensure consistent styling across the app
 * 3. Can switch map libraries later without changing all usages
 * 4. Centralize any customizations or bug workarounds
 *
 * This is called the "Adapter Pattern" - adapting a complex interface
 * to a simpler one that fits our needs.
 */
export function PlaceMarker({ place, onPress }: PlaceMarkerProps) {
    /**
     * LEARNING POINT: Mapping Colors
     *
     * getBusyColor returns 'green', 'yellow', 'red' (semantic names).
     * But the Marker needs actual hex colors.
     *
     * This mapping layer:
     * 1. Keeps the color logic in one place (types/index.ts)
     * 2. Allows different visual representations (hex, rgb, named)
     * 3. Makes the semantic meaning clear in the code
     */
    const busyColorName = getBusyColor(place.busyPercent);
    const pinColor = {
        green: BUSY_COLORS.GREEN,
        yellow: BUSY_COLORS.YELLOW,
        red: BUSY_COLORS.RED,
    }[busyColorName];

    return (
        <Marker
            coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
            }}
            pinColor={pinColor}
            onPress={onPress}
            /**
             * LEARNING POINT: Accessibility for Maps
             *
             * Map markers need accessible labels because:
             * 1. Screen readers can't "see" the map
             * 2. Users need to know what each marker represents
             * 3. The busy percentage is important information
             *
             * Include all relevant info in the label.
             */
            accessibilityLabel={`${place.name}, ${place.busyPercent}% busy`}
        >
            {/**
             * LEARNING POINT: Custom Callouts
             *
             * Callouts appear when a marker is tapped (before onPress).
             * They provide additional context without leaving the map.
             *
             * On iOS, tapping the callout triggers onPress.
             * On Android, the behavior can vary - test on both platforms!
             */}
            <Callout tooltip onPress={onPress}>
                <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{place.name}</Text>
                    <View style={styles.calloutRow}>
                        <View style={[styles.indicator, { backgroundColor: pinColor }]} />
                        <Text style={styles.calloutText}>{place.busyPercent}% busy</Text>
                    </View>
                    <Text style={styles.calloutHint}>Tap for details</Text>
                </View>
            </Callout>
        </Marker>
    );
}

const styles = StyleSheet.create({
    callout: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        minWidth: 140,
        /**
         * LEARNING POINT: Cross-Platform Shadows
         *
         * iOS uses shadow* properties (Quartz-based).
         * Android uses elevation (Material Design).
         * You need both for shadows to work on both platforms.
         */
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Android shadow
        elevation: 5,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    calloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    calloutText: {
        fontSize: 14,
        color: '#4B5563',
    },
    calloutHint: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
});
