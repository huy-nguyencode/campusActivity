import { db } from '@/config/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import type { Place } from '@/types/domain';
import { mapPlaceDocument } from './place-document-mapper';

export { subscribePlaces, subscribePlace } from './place-subscriptions';

export async function getPlaceById(placeId: string): Promise<Place | null> {
    const placeSnap = await getDoc(doc(db, 'places', placeId));
    return placeSnap.exists() ? mapPlaceDocument(placeSnap.id, placeSnap.data()) : null;
}
