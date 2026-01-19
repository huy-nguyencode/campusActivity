import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationState, LocationPermissionStatus } from '@/types';
import { checkLocationPermission, requestLocationPermission, watchLocation } from '@/services/location';

/**
 * Custom hook for managing device location and permissions.
 *
 * This hook checks location permission on mount, watches for location updates
 * when permission is granted, and provides a function to request permission.
 *
 * @returns An object containing location state, permission status, and controls.
 * @example
 * const { location, permission, isLoading, error, requestPermission } = useLocation();
 *
 * if (permission === 'undetermined') {
 *   return <Button onPress={requestPermission} title="Enable Location" />;
 * }
 * if (permission === 'denied') {
 *   return <Text>Location permission denied</Text>;
 * }
 * if (isLoading) {
 *   return <LoadingScreen />;
 * }
 * if (location) {
 *   return <Text>Lat: {location.latitude}, Lon: {location.longitude}</Text>;
 * }
 */
export function useLocation() {
    const [location, setLocation] = useState<LocationState | null>(null);
    const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Check the location permission and set the permission state.
     */
    useEffect(() => {
        const checkPermission = async () => {
            try {
                setIsLoading(true);
                const status = await checkLocationPermission();
                setPermission(status);
                if (status != 'granted') {
                    setIsLoading(false);
                }
            } catch (error) {
                setError((error as Error).message);
                setPermission('undetermined');
                setIsLoading(false);
            }
        };

        checkPermission();
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        if (permission === 'granted') {
            const startWatching = async () => {
                try {
                    setIsLoading(true);
                    subscription = await watchLocation((newLocation: LocationState) => {
                        setLocation(newLocation);
                        setError(null);
                        setIsLoading(false);
                    });
                } catch (error) {
                    setError((error as Error).message);
                    setLocation(null);
                    setIsLoading(false);
                }
            };
            startWatching();
        } else if (permission === 'denied') {
            setError('Location permission denied');
            setLocation(null);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [permission]);

    const requestPermission = useCallback(async () => {
        try {
            setIsLoading(true);
            const status = await requestLocationPermission();
            setPermission(status);
            setIsLoading(false);
            setError(null);
        } catch (error) {
            setError((error as Error).message);
            setPermission('undetermined');
            setIsLoading(false);
        }
    }, []);

    return {
        location,
        permission,
        isLoading,
        error,
        requestPermission,
    };
}
