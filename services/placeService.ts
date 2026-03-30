import { db } from '@/config/firebase';
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';

import { Place, AdminOverride } from '@/types';

function mapPlaceDocument(id: string, data: unknown): Place {
    const placeDocument = data as Record<string, unknown>;

    let adminOverride: AdminOverride | null = null;
    if (placeDocument.adminOverride && typeof placeDocument.adminOverride === 'object') {
        const raw = placeDocument.adminOverride as Record<string, unknown>;
        adminOverride = {
            active: (raw.active as boolean) ?? false,
            busyPercent: (raw.busyPercent as number) ?? 0,
            setBy: (raw.setBy as string) ?? '',
            setAt: raw.setAt ? (raw.setAt as Timestamp).toDate() : null,
        };
    }

    return {
        id,
        name: placeDocument.name as string,
        type: placeDocument.type as Place['type'],
        location: {
            latitude: (placeDocument.location as Record<string, number>).latitude,
            longitude: (placeDocument.location as Record<string, number>).longitude,
        },
        busyPercent: (placeDocument.busyPercent as number) ?? 0,
        lastUpdate: placeDocument.lastUpdate ? (placeDocument.lastUpdate as Timestamp).toDate() : null,
        adminOverride,
    };
}

export function subscribePlaces(onPlaces: (places: Place[]) => void, onError?: (error: Error) => void): Unsubscribe {
    const placeRef = collection(db, 'places');

    const unsubscribe = onSnapshot(placeRef, (snapshot) => {
        const places: Place[] = snapshot.docs.map((doc) => mapPlaceDocument(doc.id, doc.data()));
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
    } else {
        return mapPlaceDocument(placeSnap.id, placeSnap.data());
    }
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
