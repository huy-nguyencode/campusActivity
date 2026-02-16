//location service using expo location
import * as Location from 'expo-location';
// import the types for the location state and permission status
import {LocationState, LocationPermissionStatus} from '@/types';


// request location permission from users
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
    const {status} = await Location.requestForegroundPermissionsAsync(); //request permission to use location in the foreground
    return status as LocationPermissionStatus;
}

// check for current permission status
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
    const {status} = await Location.getForegroundPermissionsAsync();
    return status as LocationPermissionStatus;
}

export async function getCurrentLocation(): Promise<LocationState | null> {
    try {
        const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
    });
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
    };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
}

export async function watchLocation(callback: (location: LocationState) => void, options?: {
        interval?: number; // how often to update the location
        distanceMeters?: number; // how far to move before updating the location
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
    }
    );
}
