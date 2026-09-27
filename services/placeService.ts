import { db } from '@/config/firebase';
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';

import { Place, AdminOverride, PlaceType } from '@/types';

const PLACE_TYPES: ReadonlySet<string> = new Set([
    'dining hall',
    'library',
    'gym',
    'cafe',
    'food truck',
    'study',
    'the wall',
    'bagel',
    'restaurant',
]);

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function mapPlaceDocument(id: string, data: unknown): Place | null {
    if (!data || typeof data !== 'object') {
        console.warn(`[placeService] Skipping place ${id}: missing document data`);
        return null;
    }

    const placeDocument = data as Record<string, unknown>;
    const location = placeDocument.location;

    if (!location || typeof location !== 'object') {
        console.warn(`[placeService] Skipping place ${id}: missing location`);
        return null;
    }

    const { latitude, longitude } = location as Record<string, unknown>;
    if (
        !isFiniteNumber(latitude) ||
        !isFiniteNumber(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        console.warn(`[placeService] Skipping place ${id}: invalid coordinates`);
        return null;
    }

    if (typeof placeDocument.name !== 'string' || placeDocument.name.trim().length === 0) {
        console.warn(`[placeService] Skipping place ${id}: invalid name`);
        return null;
    }

    if (typeof placeDocument.type !== 'string' || !PLACE_TYPES.has(placeDocument.type)) {
        console.warn(`[placeService] Skipping place ${id}: invalid type`);
        return null;
    }

    let adminOverride: AdminOverride | null = null;
    if (placeDocument.adminOverride && typeof placeDocument.adminOverride === 'object') {
        const raw = placeDocument.adminOverride as Record<string, unknown>;
        adminOverride = {
            active: (raw.active as boolean) ?? false,
            busyPercent: isFiniteNumber(raw.busyPercent) ? raw.busyPercent : 0,
            setBy: typeof raw.setBy === 'string' ? raw.setBy : '',
            setAt: raw.setAt instanceof Timestamp ? raw.setAt.toDate() : null,
        };
    }

    const busyPercent = isFiniteNumber(placeDocument.busyPercent)
        ? Math.min(100, Math.max(0, placeDocument.busyPercent))
        : 0;

    return {
        id,
        name: placeDocument.name.trim(),
        type: placeDocument.type as PlaceType,
        location: { latitude, longitude },
        busyPercent,
        lastUpdate: placeDocument.lastUpdate instanceof Timestamp
            ? placeDocument.lastUpdate.toDate()
            : null,
        adminOverride,
    };
}

export function subscribePlaces(onPlaces: (places: Place[]) => void, onError?: (error: Error) => void): Unsubscribe {
    const placeRef = collection(db, 'places');

    const unsubscribe = onSnapshot(placeRef, (snapshot) => {
        const places: Place[] = snapshot.docs
            .map((docSnap) => mapPlaceDocument(docSnap.id, docSnap.data()))
            .filter((place): place is Place => place !== null);
        onPlaces(places);
    }, (error) => {
        console.error('Error subscribing to places:', error);
        onError?.(error);
    });
    return unsubscribe;
}

export async function getPlaceById(placeId: string): Promise<Place | null> {
    const placeRef = doc(db, 'places', placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
        return null;
    }

    return mapPlaceDocument(placeSnap.id, placeSnap.data());
}

export function subscribePlace(
    placeId: string,
    onPlace: (place: Place | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const placeRef = doc(db, 'places', placeId);

    return onSnapshot(placeRef, (snapshot) => {
        if (snapshot.exists()) {
            onPlace(mapPlaceDocument(snapshot.id, snapshot.data()));
        } else {
            onPlace(null);
        }
    }, (error) => {
        console.error('Error subscribing to place:', error);
        onError?.(error);
    });
}
