import { useState, useEffect } from 'react';
import { Place } from '@/types';
import { subscribePlaces } from '@/services/places';

/**
 * Custom hook for subscribing to real-time campus places data.
 *
 * This hook subscribes to the Firestore places collection and receives
 * real-time updates whenever busyPercent or other place data changes.
 *
 * @returns An object containing places array, loading state, and error.
 * @example
 * const { places, isLoading, error } = usePlaces();
 *
 * if (isLoading) {
 *   return <LoadingScreen />;
 * }
 * if (error) {
 *   return <ErrorScreen message={error} />;
 * }
 * return (
 *   <PlaceList places={places} />
 * );
 */
export function usePlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribePlaces((newPlaces: Place[]) => {
            setPlaces(newPlaces);
            setError(null);
            setIsLoading(false);
        }, (err: Error) => {
            setError(err.message);
            setPlaces([]);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    return {
        places,
        isLoading,
        error,
    };
}