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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaces } from '@/hooks/usePlaces';
import { Place } from '@/types';
import { PlaceCard } from '@/components/places/PlaceCard';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
} from '@/constants/theme';

export default function PlacesScreen() {
    const { places, isLoading, error, refresh } = usePlaces();
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refresh?.();
        } finally {
            setRefreshing(false);
        }
    }, [refresh]);

    if (isLoading && !refreshing) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingEmoji}>📍</Text>
                <Text style={styles.loadingText}>Loading places...</Text>
                <ActivityIndicator
                    size="small"
                    color={COLORS.primary[500]}
                    style={styles.loadingSpinner}
                />
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

    const renderPlace = ({ item }: { item: Place }) => (
        <PlaceCard
            place={item}
            onPress={() => router.push(`/place/${item.id}` as any)}
        />
    );

    return (
        /**
         * LEARNING POINT: Gradient Background on List Screens
         *
         * Wrapping a FlatList in a LinearGradient gives the entire screen
         * a warm, living feel. The gradient (cream → neutral-50) is subtle
         * enough not to distract from the cards but adds warmth vs. a flat
         * background color. The gradient acts as a "canvas" for the floating cards.
         */
        <LinearGradient
            colors={[SEMANTIC_COLORS.background.warm, COLORS.neutral[50]]}
            style={styles.container}
        >
            <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                renderItem={renderPlace}
                contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + SPACING[4] }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary[500]}
                        colors={[COLORS.primary[500]]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyIcon}>🏫</Text>
                            <Text style={styles.emptyText}>No places yet</Text>
                            <Text style={styles.emptyHint}>
                                Campus spots will appear here once they're added. Check back soon!
                            </Text>
                        </View>
                    </View>
                }
                ListHeaderComponent={
                    places.length > 0 ? (
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <Text style={styles.headerTitle}>Campus Locations</Text>
                            </View>
                            <Text style={styles.headerSubtitle}>
                                Tap a place to see details and check in
                            </Text>
                        </View>
                    ) : null
                }
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    },
    listContainer: {
        paddingHorizontal: SPACING[4],
        paddingBottom: SPACING[8],
    },
    header: {
        marginBottom: SPACING[5],
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING[3],
        marginBottom: SPACING[1],
    },
    headerTitle: {
        fontSize: FONT_SIZES['2xl'],
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,

    },
    headerSubtitle: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.secondary,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING[12],
    },
    emptyCard: {
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.xl,
        padding: SPACING[6],
        alignItems: 'center',
        ...SHADOWS.warm,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: SPACING[4],
    },
    emptyText: {
        fontSize: FONT_SIZES.xl,
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
        marginBottom: SPACING[2],
    },
    emptyHint: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.secondary,
        textAlign: 'center',
        paddingHorizontal: SPACING[4],
        lineHeight: FONT_SIZES.md * 1.5,
    },
});
