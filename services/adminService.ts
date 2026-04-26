import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { getCurrentUserUID } from '@/services/authService';

function assertValidPlaceId(placeId: string): void {
    if (placeId.trim().length === 0 || placeId.includes('/')) {
        throw new Error('Invalid place ID');
    }
}

function assertValidBusyPercent(busyPercent: number): void {
    if (!Number.isFinite(busyPercent) || busyPercent < 0 || busyPercent > 100) {
        throw new Error('Busy percent must be between 0 and 100');
    }
}

async function assertCurrentUserIsAdmin(): Promise<string> {
    const uid = getCurrentUserUID();
    if (!uid) throw new Error('Not authenticated');

    const isAdmin = await checkIsAdmin(uid);
    if (!isAdmin) throw new Error('Admin permissions are required');

    return uid;
}

export async function checkIsAdmin(uid: string): Promise<boolean> {
    const adminsRef = doc(db, 'config', 'admins');
    const adminsSnap = await getDoc(adminsRef);

    if (!adminsSnap.exists()) return false;

    const data = adminsSnap.data();
    const uids = data?.uids as string[] | undefined;

    return Array.isArray(uids) && uids.includes(uid);
}

export async function setAdminOverride(placeId: string, busyPercent: number): Promise<void> {
    assertValidPlaceId(placeId);
    assertValidBusyPercent(busyPercent);

    const uid = await assertCurrentUserIsAdmin();
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

export async function removeAdminOverride(placeId: string): Promise<void> {
    assertValidPlaceId(placeId);
    await assertCurrentUserIsAdmin();

    const placeRef = doc(db, 'places', placeId);

    await updateDoc(placeRef, {
        adminOverride: deleteField(),
    });
}
