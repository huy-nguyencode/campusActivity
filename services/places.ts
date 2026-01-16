import { db } from '@/config/firebase';
import {
    collection,
    doc,
    onSnapshot,
    query,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';

import { Place } from '@/types';


function doctoPlace(id: string, data: unknown): Place {
    const doc = data as Record<string, unknown>;

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