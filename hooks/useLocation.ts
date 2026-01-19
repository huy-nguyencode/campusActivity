/*
 * Location hook for Campus Pulse.
 * 
 * This hook is used to get the user's location and listen for changes in the location.
 * 
 * @returns An object containing the location, loading state, and error.
 */

import { useState, useEffect, useCallback } from 'react';
import {LocationState, LocationPermissionStatus} from '@/types';
import { checkLocationPermission, requestLocationPermission, watchLocation } from '@/services/location';
import * as Location from 'expo-location';

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
            } catch (error) {
                setError((error as Error).message);
                setPermission('undetermined');
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
            setIsLoading(true);
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
