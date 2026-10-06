import { AppState, type NativeEventSubscription } from 'react-native';
import { collection, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import type { Place } from '@/types/domain';
import { mapPlaceDocument } from './place-document-mapper';

type Observer<T> = { next: (value: T) => void; error?: (error: Error) => void };

const collectionObservers = new Set<Observer<Place[]>>();
const placeObservers = new Map<string, Set<Observer<Place | null>>>();
const documentSubscriptions = new Map<string, Unsubscribe>();
let collectionSubscription: Unsubscribe | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let latestPlaces: Place[] | null = null;

function reconcileSubscriptions() {
    const foreground = AppState.currentState !== 'background';
    const useCollection = foreground && collectionObservers.size > 0;

    if (!useCollection && collectionSubscription) {
        collectionSubscription();
        collectionSubscription = null;
    }

    for (const [id, unsubscribe] of documentSubscriptions) {
        if (!foreground || useCollection || !placeObservers.has(id)) {
            unsubscribe();
            documentSubscriptions.delete(id);
        }
    }

    if (useCollection && !collectionSubscription) {
        collectionSubscription = onSnapshot(collection(db, 'places'), (snapshot) => {
            latestPlaces = snapshot.docs
                .map((entry) => mapPlaceDocument(entry.id, entry.data()))
                .filter((place): place is Place => place !== null);
            for (const observer of collectionObservers) observer.next(latestPlaces);
            // Details reuse the collection stream instead of paying for another listener.
            for (const [id, observers] of placeObservers) {
                const place = latestPlaces.find((entry) => entry.id === id) ?? null;
                for (const observer of observers) observer.next(place);
            }
        }, (error) => {
            collectionSubscription = null;
            for (const observer of collectionObservers) observer.error?.(error);
            for (const observers of placeObservers.values()) {
                for (const observer of observers) observer.error?.(error);
            }
        });
    }

    if (foreground && !useCollection) {
        // Direct links only need one document. Share its listener across consumers.
        for (const [id, observers] of placeObservers) {
            if (documentSubscriptions.has(id)) continue;
            const unsubscribe = onSnapshot(doc(db, 'places', id), (snapshot) => {
                const place = snapshot.exists() ? mapPlaceDocument(snapshot.id, snapshot.data()) : null;
                for (const observer of observers) observer.next(place);
            }, (error) => {
                documentSubscriptions.delete(id);
                for (const observer of observers) observer.error?.(error);
            });
            documentSubscriptions.set(id, unsubscribe);
        }
    }

    if (collectionObservers.size === 0 && placeObservers.size === 0) {
        appStateSubscription?.remove();
        appStateSubscription = null;
        latestPlaces = null;
    } else if (!appStateSubscription) {
        appStateSubscription = AppState.addEventListener('change', reconcileSubscriptions);
    }
}

export function subscribePlaces(next: (places: Place[]) => void, error?: (error: Error) => void): Unsubscribe {
    const observer = { next, error };
    collectionObservers.add(observer);
    reconcileSubscriptions();
    return () => {
        collectionObservers.delete(observer);
        reconcileSubscriptions();
    };
}

export function subscribePlace(
    id: string,
    next: (place: Place | null) => void,
    error?: (error: Error) => void
): Unsubscribe {
    const observer = { next, error };
    const observers = placeObservers.get(id) ?? new Set<Observer<Place | null>>();
    observers.add(observer);
    placeObservers.set(id, observers);
    if (collectionSubscription && latestPlaces) {
        next(latestPlaces.find((place) => place.id === id) ?? null);
    }
    reconcileSubscriptions();
    return () => {
        observers.delete(observer);
        if (observers.size === 0) placeObservers.delete(id);
        reconcileSubscriptions();
    };
}
