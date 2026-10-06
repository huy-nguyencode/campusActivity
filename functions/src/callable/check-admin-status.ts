import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/firestore-admin';
import { CALLABLE_FUNCTION_OPTIONS } from '../shared/runtime-options';

async function isUidAdmin(uid: string): Promise<boolean> {
    const adminsSnap = await db.collection('config').doc('admins').get();
    if (!adminsSnap.exists) {
        return false;
    }

    const uids = adminsSnap.get('uids');
    return Array.isArray(uids) && uids.includes(uid);
}

/**
 * Returns whether the caller is an admin without exposing the admin UID list.
 */
export const checkAdminStatus = onCall({
    ...CALLABLE_FUNCTION_OPTIONS,
    timeoutSeconds: 10,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    return { isAdmin: await isUidAdmin(request.auth.uid) };
});
