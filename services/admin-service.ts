import { db, functions } from '@/config/firebase-client';
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCurrentUserUID } from '@/services/auth-service';

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

/**
 * Checks admin status via callable so clients never read the admin UID list.
 */
const ADMIN_STATUS_CACHE_MS = 5 * 60_000;
let cachedStatus: { uid: string; isAdmin: boolean; expiresAt: number } | null = null;
const pendingStatusChecks = new Map<string, Promise<boolean>>();

export async function checkIsAdmin(uid: string): Promise<boolean> {
    if (cachedStatus?.uid === uid && cachedStatus.expiresAt > Date.now()) {
        return cachedStatus.isAdmin;
    }
    const pending = pendingStatusChecks.get(uid);
    if (pending) return pending;

    const request = requestAdminStatus(uid);
    pendingStatusChecks.set(uid, request);
    try {
        return await request;
    } finally {
        pendingStatusChecks.delete(uid);
    }
}

async function requestAdminStatus(uid: string): Promise<boolean> {
    try {
        const call = httpsCallable<Record<string, never>, { isAdmin: boolean }>(functions, 'checkAdminStatus');
        const response = await call({});
        const isAdmin = response.data.isAdmin === true;
        // UI hint only: Firestore rules still authorize every override write.
        cachedStatus = { uid, isAdmin, expiresAt: Date.now() + ADMIN_STATUS_CACHE_MS };
        return isAdmin;
    } catch (error) {
        console.error('[admin-service] Failed to check admin status:', error);
        return false;
    }
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
