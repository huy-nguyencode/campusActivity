import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../shared/firestore-admin';
import { CROWD_CONFIG } from '../shared/crowd-config';
import { CALLABLE_FUNCTION_OPTIONS } from '../shared/runtime-options';
import type { PlaceDocData } from '../shared/firestore-types';
import { parseClientLocation, getPlaceLocation, validateCheckinLocation } from '../domain/check-in-validation';

export const submitCheckin = onCall({
    ...CALLABLE_FUNCTION_OPTIONS,
    timeoutSeconds: 15,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in to check in.');
    }

    const { placeId, level, location } = (request.data ?? {}) as {
        placeId?: unknown;
        level?: unknown;
        location?: unknown;
    };

    if (
        typeof placeId !== 'string' ||
        placeId.trim().length === 0 ||
        placeId.includes('/')
    ) {
        throw new HttpsError('invalid-argument', 'A valid place ID is required.');
    }

    if (level !== 1 && level !== 2 && level !== 3) {
        throw new HttpsError('invalid-argument', 'Busy level must be 1, 2, or 3.');
    }

    const clientLocation = parseClientLocation(location);
    const uid = request.auth.uid;
    const normalizedPlaceId = placeId.trim();
    const cooldownRef = db.collection('checkinCooldowns').doc(`${uid}_${normalizedPlaceId}`);
    const placeRef = db.collection('places').doc(normalizedPlaceId);
    const checkInRef = db.collection('checkins').doc();
    const now = Timestamp.now();
    const cooldownEndsAt = Timestamp.fromMillis(
        now.toMillis() + CROWD_CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000
    );

    await db.runTransaction(async (transaction) => {
        const [placeSnap, cooldownSnap] = await Promise.all([
            transaction.get(placeRef),
            transaction.get(cooldownRef),
        ]);

        if (!placeSnap.exists) {
            throw new HttpsError('not-found', 'Place not found.');
        }

        const placeLocation = getPlaceLocation(placeSnap.data() as PlaceDocData);
        validateCheckinLocation(clientLocation, placeLocation);

        const lastCheckInAt = cooldownSnap.get('lastCheckInAt') as Timestamp | undefined;
        if (lastCheckInAt) {
            const lastAllowedAt = lastCheckInAt.toMillis() + CROWD_CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000;
            if (lastAllowedAt > now.toMillis()) {
                throw new HttpsError('failed-precondition', 'Cooldown active.', {
                    cooldownEndsAt: new Date(lastAllowedAt).toISOString(),
                });
            }
        }

        transaction.set(checkInRef, {
            placeId: normalizedPlaceId,
            level,
            timestamp: now,
            uid,
        });

        transaction.set(cooldownRef, {
            uid,
            placeId: normalizedPlaceId,
            lastCheckInAt: now,
            cooldownEndsAt,
        });
    });

    return {
        id: checkInRef.id,
        placeId: normalizedPlaceId,
        level,
        timestamp: now.toDate().toISOString(),
        uid,
    };
});
