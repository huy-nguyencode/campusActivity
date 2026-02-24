import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationState, LocationPermissionStatus } from '@/types';
import { checkLocationPermission, requestLocationPermission, watchLocation } from '@/services/location';

export function useLocation() {
    const [location, setLocation] = useState<LocationState | null>(null);
    const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkPermission = async () => {
            try {
                setIsLoading(true);
                const status = await checkLocationPermission();
                setPermission(status);
                if (status !== 'granted') {
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
