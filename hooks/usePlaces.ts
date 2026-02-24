import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types';
import { subscribePlaces } from '@/services/places';

export function usePlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    // With real-time subscriptions, data is always fresh.
    // This function exists for pull-to-refresh UX feedback.
    const refresh = useCallback(async () => {
        return Promise.resolve();
    }, []);

    return {
        places,
        isLoading,
        error,
        refresh,
    };
}
