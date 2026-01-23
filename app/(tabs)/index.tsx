import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { usePlaces } from '@/hooks/usePlaces';
import { useLocation } from '@/hooks/useLocation';
import { getBusyColor } from '@/types';

// Moved outside component - constants don't need to be recreated on each render
const DEFAULT_REGION = {
    latitude: 39.98134318708127,
    longitude: -75.1543612006294,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export default function MapScreen() {
    const { places, isLoading: placesLoading, error: placesError } = usePlaces();
    const { location, isLoading: locationLoading } = useLocation();

    if (placesLoading || locationLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (placesError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load places</Text>
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
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            >
                {places.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{
                            latitude: place.location.latitude,
                            longitude: place.location.longitude,
                        }}
                        title={place.name}
                        description={`${place.busyPercent}% busy`}
                        pinColor={getBusyColor(place.busyPercent)}
                        onPress={() => router.push(`/place/${place.id}` as any)}
                    />
                ))}
            </MapView>
        </View>
    )
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
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
});
