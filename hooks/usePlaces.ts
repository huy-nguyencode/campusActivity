import { useCallback, useSyncExternalStore } from 'react';
import { Place } from '@/types';
import { subscribePlaces } from '@/services/placeService';

interface PlacesSnapshot {
    places: Place[];
    error: string | null;
    isLoading: boolean;
}

let placesSnapshot: PlacesSnapshot = {
    places: [],
    error: null,
    isLoading: true,
};

const listeners = new Set<() => void>();
let placesUnsubscribe: (() => void) | null = null;

function emitChange() {
    listeners.forEach((listener) => listener());
}

function startPlacesSubscription() {
    if (placesUnsubscribe) {
        return;
    }

    placesUnsubscribe = subscribePlaces(
        (nextPlaces: Place[]) => {
            placesSnapshot = {
                places: nextPlaces,
                error: null,
                isLoading: false,
            };
            emitChange();
        },
        (error: Error) => {
            // onSnapshot stops delivering after an error; clear so refresh/retry can restart.
            placesUnsubscribe = null;
            placesSnapshot = {
                places: placesSnapshot.places,
                error: error.message,
                isLoading: false,
            };
            emitChange();
        }
    );
}

function stopPlacesSubscription() {
    if (!placesUnsubscribe) {
        return;
    }

    placesUnsubscribe();
    placesUnsubscribe = null;
}

function restartPlacesSubscription() {
    stopPlacesSubscription();
    placesSnapshot = {
        ...placesSnapshot,
        error: null,
        isLoading: true,
    };
    emitChange();
    startPlacesSubscription();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    startPlacesSubscription();

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            stopPlacesSubscription();
        }
    };
}

function getSnapshot() {
    return placesSnapshot;
}

export function usePlaces() {
    const { places, error, isLoading } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const refresh = useCallback(async () => {
        restartPlacesSubscription();
    }, []);

    return {
        places,
        isLoading,
        error,
        refresh,
    };
}
