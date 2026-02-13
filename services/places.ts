import { db } from '@/config/firebase';
import {
    collection,
    doc,
    onSnapshot,
    query,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';

import { Place, AdminOverride } from '@/types';


/**
 * LEARNING POINT: Data Mapping / Hydration
 *
 * Firestore documents are schemaless blobs. This function "hydrates" raw
 * Firestore data into a strongly-typed Place object. Hydrating at the
 * boundary (right when data enters your app) means every downstream
 * consumer gets a safe, validated type — no defensive checks needed later.
 *
 * Notice how we default adminOverride to null when missing. This is the
 * "Null Object" idea: callers can simply check `if (place.adminOverride)`
 * instead of guarding against undefined.
 */
function doctoPlace(id: string, data: unknown): Place {
    const doc = data as Record<string, unknown>;

    // Parse adminOverride if it exists in the Firestore document
    let adminOverride: AdminOverride | null = null;
    if (doc.adminOverride && typeof doc.adminOverride === 'object') {
        const raw = doc.adminOverride as Record<string, unknown>;
        adminOverride = {
            active: (raw.active as boolean) ?? false,
            busyPercent: (raw.busyPercent as number) ?? 0,
            setBy: (raw.setBy as string) ?? '',
            setAt: raw.setAt ? (raw.setAt as Timestamp).toDate() : null,
        };
    }

    return {
        id,
        name: doc.name as string,
        type: doc.type as Place['type'],
        location: {
            latitude: (doc.location as Record<string, number>).latitude,
            longitude: (doc.location as Record<string, number>).longitude,
        },
        busyPercent: (doc.busyPercent as number) ?? 0,
        lastUpdate: doc.lastUpdate ? (doc.lastUpdate as Timestamp).toDate() : null,
        adminOverride,
    };
}


export function subscribePlaces(onPlaces: (places: Place[]) => void, onError?: (error: Error) => void): Unsubscribe {
    const placeRef = collection(db, 'places');
    const placesQuery = query(placeRef);

    //listen for changes in the places collection
    const unsubscribe = onSnapshot(placesQuery, (snapshot) => {
        //convert to place objects
        const places: Place[] = snapshot.docs.map((doc) => doctoPlace(doc.id, doc.data()));
        onPlaces(places);
    }, (error) => {
        console.error('Error subscribing to places:', error);
        onError?.(error);
    });
    return unsubscribe;
}


//get place by id one time not real time
export async function getPlaceById(placeId: string): Promise<Place | null> {
    const { getDoc } = await import('firebase/firestore');

    const placeRef = doc(db, 'places', placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
        return null;
    } else {
        return doctoPlace(placeSnap.id, placeSnap.data());
    }
}

/**
 * Subscribe to a single place document in real time.
 *
 * LEARNING POINT: Document-Level Listeners
 *
 * `onSnapshot` can listen to a single document (not just a collection).
 * This is more efficient than subscribing to the entire places collection
 * when you only care about one place. Firestore only sends data for the
 * one document, reducing bandwidth and read costs.
 *
 * The callback fires immediately with the current state, then again
 * whenever the document changes — so admin overrides, Cloud Function
 * updates, etc. all appear instantly.
 */
export function subscribePlace(
    placeId: string,
    onPlace: (place: Place | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const placeRef = doc(db, 'places', placeId);

    return onSnapshot(placeRef, (snapshot) => {
        if (snapshot.exists()) {
            onPlace(doctoPlace(snapshot.id, snapshot.data()));
        } else {
            onPlace(null);
        }
    }, (error) => {
        console.error('Error subscribing to place:', error);
        onError?.(error);
    });
}