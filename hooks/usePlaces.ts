import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types';
import { subscribePlaces } from '@/services/placesService';

/**
 * Custom hook for subscribing to real-time campus places data.
 *
 * LEARNING POINT: Real-Time Subscriptions
 *
 * Unlike traditional fetch-on-mount patterns, this hook uses Firestore's
 * real-time subscription (onSnapshot). Benefits:
 * 1. Automatic updates - when data changes in Firestore, UI updates instantly
 * 2. No polling - more efficient than repeatedly fetching
 * 3. Offline support - Firestore caches data locally
 *
 * The subscription stays active until the component unmounts.
 *
 * @returns An object containing places array, loading state, error, and refresh function.
 * @example
 * const { places, isLoading, error, refresh } = usePlaces();
 *
 * if (isLoading) {
 *   return <LoadingScreen />;
 * }
 * if (error) {
 *   return <ErrorScreen message={error} />;
 * }
 * return (
 *   <PlaceList places={places} onRefresh={refresh} />
 * );
 */
export function usePlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * LEARNING POINT: useEffect Cleanup Pattern
     *
     * subscribePlaces returns an unsubscribe function.
     * We return it from useEffect so React calls it when:
     * 1. Component unmounts
     * 2. Dependencies change (empty array means only on unmount)
     *
     * This prevents memory leaks and "setState on unmounted component" warnings.
     */
    useEffect(() => {
        const unsubscribe = subscribePlaces(
            (newPlaces: Place[]) => {
                setPlaces(newPlaces);
                setError(null);
                setIsLoading(false);
            },
            (err: Error) => {
                setError(err.message);
                setPlaces([]);
                setIsLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    /**
     * LEARNING POINT: Manual Refresh with Real-Time Data
     *
     * With real-time subscriptions, data is always fresh automatically.
     * However, users expect pull-to-refresh to "do something."
     *
     * This refresh function provides visual feedback without actually
     * refetching (since Firestore is already keeping us updated).
     * It's a UX consideration - users feel in control.
     *
     * In a non-real-time system, this would actually refetch data.
     */
    const refresh = useCallback(async () => {
        // With real-time subscriptions, data is always fresh
        // This function exists for pull-to-refresh UX feedback
        // The loading/refreshing state is handled by the component
        return Promise.resolve();
    }, []);

    return {
        places,
        isLoading,
        error,
        refresh,
    };
}
