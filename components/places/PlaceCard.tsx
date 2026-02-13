import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Place, getBusyColor } from '@/types';

/**
 * LEARNING POINT: Component Props Interface
 *
 * Define a TypeScript interface for the props your component accepts.
 * This provides:
 * 1. Type safety - catch errors at compile time
 * 2. Documentation - others can see what the component needs
 * 3. Autocomplete - IDE suggests available props
 */
interface PlaceCardProps {
    place: Place;
    onPress: () => void;
}

/**
 * LEARNING POINT: Functional Component Pattern
 *
 * React components are just functions that:
 * 1. Accept props as the first argument
 * 2. Return JSX (what to render)
 *q
 * We destructure props inline: ({ place, onPress }) instead of (props)
 * This makes it clear what data the component uses.
 */
export function PlaceCard({ place, onPress }: PlaceCardProps) {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <View style={styles.content}>
                {/* Colored indicator showing busyness level */}
                <View
                    style={[
                        styles.busyIndicator,
                        { backgroundColor: getBusyColor(place.busyPercent) },
                    ]}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{place.name}</Text>
                    <Text style={styles.busyText}>{place.busyPercent}% busy</Text>
                </View>
            </View>
        </Pressable>
    );
}

/**
 * LEARNING POINT: Co-located Styles
 *
 * Keep styles in the same file as the component. This makes the
 * component self-contained - you can move/copy the file and it
 * just works without hunting for style dependencies.
 */
const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Android shadow
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    busyIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    busyText: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
});
