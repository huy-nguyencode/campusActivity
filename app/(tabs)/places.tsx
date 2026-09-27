import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
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
    const sortedPlaces = useMemo(
        () => [...places].sort((a, b) => a.name.localeCompare(b.name)),
        [places]
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refresh?.();
        } finally {
            setRefreshing(false);
        }
    }, [refresh]);

    if (isLoading && places.length === 0) {
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
            <ScrollView
                contentContainerStyle={styles.centered}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary[500]}
                        colors={[COLORS.primary[500]]}
                    />
                }
            >
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>Unable to load places</Text>
                <Text style={styles.errorHint}>Pull down to retry</Text>
            </ScrollView>
        );
    }

    const renderPlace = ({ item }: { item: Place }) => (
        <PlaceCard
            place={item}
            onPress={() => router.push(`/place/${item.id}` as any)}
        />
    );

    return (
        <LinearGradient
            colors={[SEMANTIC_COLORS.background.warm, COLORS.neutral[50]]}
            style={styles.container}
        >
            <FlatList
                data={sortedPlaces}
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
                                Campus spots will appear here once they&apos;re added. Check back soon!
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
