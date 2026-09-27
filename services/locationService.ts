import * as Location from 'expo-location';
import { LocationState, LocationPermissionStatus } from '@/types';

function normalizePermissionStatus(status: Location.PermissionStatus): LocationPermissionStatus {
    // expo-location already reports iOS "restricted" (parental controls / MDM) as DENIED.
    if (status === Location.PermissionStatus.GRANTED) return 'granted';
    if (status === Location.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
}

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return normalizePermissionStatus(status);
}

export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return normalizePermissionStatus(status);
}

export async function watchLocation(
    callback: (location: LocationState) => void,
    options?: {
        interval?: number;
        distanceMeters?: number;
    }
): Promise<Location.LocationSubscription> {
    return await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: options?.interval ?? 5000,
        distanceInterval: options?.distanceMeters ?? 10,
    }, location => {
        callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
        });
    });
}
