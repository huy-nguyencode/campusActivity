/**
 * Places List Screen - Alternative view when user prefers a list over map
 *
 * LEARNING POINT: Multiple Views for Same Data
 *
 * Users have different preferences. Some prefer maps, others prefer lists.
 * By providing both views of the same data, you:
 * 1. Accommodate different user preferences
 * 2. Support accessibility (lists are easier for screen readers)
 * 3. Handle cases where map isn't practical (poor location, indoor use)
 */
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { usePlaces } from '@/hooks/usePlaces';
import { Place } from '@/types';
import { PlaceCard } from '@/components/places/PlaceCard';

export default function PlacesScreen() {
    const { places, isLoading, error, refresh } = usePlaces();
    const [refreshing, setRefreshing] = useState(false);

    /**
     * LEARNING POINT: Pull-to-Refresh Pattern
     *
     * Pull-to-refresh is a mobile UX convention that lets users
     * manually update data by dragging down on a list.
     *
     * Implementation:
     * 1. Track refreshing state
     * 2. Pass RefreshControl to FlatList
     * 3. Call data refresh function
     * 4. Reset refreshing state when done
     */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refresh?.();
        } finally {
            setRefreshing(false);
        }
    }, [refresh]);

    /**
     * LEARNING POINT: Early Returns for Edge Cases
     *
     * Handle loading and error states before the main render.
     * This keeps the main render clean and focused on the "happy path".
     */
    if (isLoading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading places...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>Unable to load places</Text>
                <Text style={styles.errorHint}>Pull down to retry</Text>
            </View>
        );
    }

    /**
     * LEARNING POINT: Render Functions for FlatList
     *
     * FlatList's renderItem receives { item, index, separators }.
     * We destructure just what we need: { item }.
     *
     * This function is called for each item in the list. Keep it light!
     * Heavy computations should happen in the data layer, not here.
     */
    const renderPlace = ({ item }: { item: Place }) => (
        <PlaceCard
            place={item}
            onPress={() => router.push(`/place/${item.id}` as any)}
        />
    );

    /**
     * LEARNING POINT: FlatList vs ScrollView
     *
     * FlatList is preferred for lists because:
     * 1. Virtualization - only renders visible items
     * 2. Memory efficient - recycles item views
     * 3. Built-in features - pull-to-refresh, separators, headers
     *
     * ScrollView renders ALL children at once - bad for long lists.
     * Use ScrollView only for short, fixed content.
     */
    return (
        <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            renderItem={renderPlace}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            /**
             * LEARNING POINT: RefreshControl
             *
             * RefreshControl provides the pull-to-refresh UI.
             * It automatically shows a spinner when refreshing is true.
             * onRefresh is called when the user pulls down far enough.
             */
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#007AFF"
                    colors={['#007AFF']} // Android
                />
            }
            /**
             * LEARNING POINT: Empty State Handling
             *
             * ListEmptyComponent shows when data array is empty.
             * Always provide feedback - an empty screen is confusing.
             * Tell users WHY it's empty and WHAT they can do.
             */
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🏫</Text>
                    <Text style={styles.emptyText}>No places found</Text>
                    <Text style={styles.emptyHint}>
                        Places will appear here once they're added to the system
                    </Text>
                </View>
            }
            /**
             * LEARNING POINT: List Header
             *
             * ListHeaderComponent renders above all items.
             * Useful for titles, filters, or search bars.
             * It scrolls with the list (unlike sticky headers).
             */
            ListHeaderComponent={
                places.length > 0 ? (
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Campus Locations</Text>
                        <Text style={styles.headerSubtitle}>
                            Tap a place to see details and check in
                        </Text>
                    </View>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
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
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
