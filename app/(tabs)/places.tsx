import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { usePlaces } from '@/hooks/usePlaces';
import { getBusyColor, Place } from '@/types';

export default function PlacesScreen() {
    const { places, isLoading, error } = usePlaces();

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load places</Text>
            </View>
        );
    }

    const renderPlace = ({ item }: { item: Place }) => (
        <Pressable
            style={styles.placeCard}
            onPress={() => router.push(`/place/${item.id}` as any)}
        >
            <View style={styles.cardContent}>
                <View
                    style={[
                        styles.busyIndicator,
                        { backgroundColor: getBusyColor(item.busyPercent) },
                    ]}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.busyText}>{item.busyPercent}% busy</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            renderItem={renderPlace}
            contentContainerStyle={styles.listContainer}
        />
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    placeCard: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Android shadow
    },
    cardContent: {
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
    placeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    busyText: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
});
