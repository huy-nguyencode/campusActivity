import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { getCurrentUserUID } from '@/services/auth';

/**
 * Checks whether the given UID belongs to an admin.
 * Reads the `config/admins` document and checks the `uids` array.
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
 * Sets an admin override on a place, updating both `busyPercent` and the
 * `adminOverride` metadata so the Cloud Function skips recalculation.
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
 * Removes the admin override from a place, allowing the Cloud Function
 * to resume computing `busyPercent` from check-ins.
 */
export async function removeAdminOverride(placeId: string): Promise<void> {
    const placeRef = doc(db, 'places', placeId);

    await updateDoc(placeRef, {
        adminOverride: deleteField(),
    });
}
