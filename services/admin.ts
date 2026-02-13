/**
 * Admin Service — manages admin authentication and place overrides
 *
 * LEARNING POINT: Service Layer Pattern
 *
 * This file is a "service" — it handles all Firestore interactions for
 * admin features. By isolating database calls here (instead of in
 * components or hooks), you get:
 *
 * 1. Testability — you can mock this file in tests without touching UI code
 * 2. Reusability — multiple hooks/screens can call the same service
 * 3. Single Responsibility — UI components don't know about Firestore
 *
 * LEARNING POINT: Atomic Updates with updateDoc
 *
 * When setting an override, we update both `busyPercent` and `adminOverride`
 * in a single `updateDoc` call. Firestore guarantees this is atomic — either
 * both fields update or neither does. This prevents an inconsistent state
 * where `busyPercent` is updated but `adminOverride` isn't (or vice versa).
 *
 * LEARNING POINT: deleteField() sentinel
 *
 * `deleteField()` is a special Firestore sentinel value. When passed to
 * `updateDoc`, it removes the field entirely from the document (instead of
 * setting it to null or undefined). This keeps your Firestore documents
 * clean — places without overrides simply won't have the field at all.
 */

import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { getCurrentUserUID } from '@/services/auth';

/**
 * Checks whether the currently signed-in user is an admin.
 *
 * Reads the `config/admins` document and checks if the current UID
 * exists in the `uids` array. Returns false if the document doesn't
 * exist or the user isn't authenticated.
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
    console.log('[Admin] Checking UID:', uid);

    const adminsRef = doc(db, 'config', 'admins');
    const adminsSnap = await getDoc(adminsRef);

    console.log('[Admin] admins doc exists:', adminsSnap.exists());

    if (!adminsSnap.exists()) return false;

    const data = adminsSnap.data();
    const uids = data?.uids as string[] | undefined;

    console.log('[Admin] Admin UIDs from Firestore:', uids);
    console.log('[Admin] Is admin:', Array.isArray(uids) && uids.includes(uid));

    return Array.isArray(uids) && uids.includes(uid);
}

/**
 * Sets an admin override on a place.
 *
 * Updates both `busyPercent` (so the UI reflects the override immediately)
 * and the `adminOverride` metadata (so the Cloud Function knows to skip it).
 *
 * @param placeId - Firestore document ID of the place
 * @param busyPercent - The admin-chosen busy level (0-100)
 */
export async function setAdminOverride(placeId: string, busyPercent: number): Promise<void> {
    const uid = getCurrentUserUID();
    if (!uid) throw new Error('Not authenticated');

    const placeRef = doc(db, 'places', placeId);

    await updateDoc(placeRef, {
        busyPercent,
        adminOverride: {
            active: true,
            busyPercent,
            setBy: uid,
            setAt: serverTimestamp(),
        },
    });
}

/**
 * Removes the admin override from a place.
 *
 * Uses `deleteField()` to completely remove the `adminOverride` field
 * from the Firestore document. The Cloud Function will resume computing
 * `busyPercent` from check-ins on its next run.
 *
 * @param placeId - Firestore document ID of the place
 */
export async function removeAdminOverride(placeId: string): Promise<void> {
    const placeRef = doc(db, 'places', placeId);

    await updateDoc(placeRef, {
        adminOverride: deleteField(),
    });
}
