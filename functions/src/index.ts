import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const MAX_BATCH_OPERATIONS = 500;

const CONFIG = {
    CHECKIN_WINDOW_MINUTES: 90,
    HALF_LIFE_MINUTES: 30,
    LEVEL_TO_PERCENT: {
        1: 0,
        2: 50,
        3: 100,
    } as Record<number, number>,
};

interface CheckInDoc {
    placeId: string;
    level: 1 | 2 | 3;
    timestamp: admin.firestore.Timestamp;
    uid: string;
}

interface PlaceAggregationInput {
    level: number;
    timestamp: admin.firestore.Timestamp;
}

interface PlaceDocData {
    busyPercent?: number;
    lastUpdate?: admin.firestore.Timestamp;
    adminOverride?: {
        active?: boolean;
    };
}

function calculateDecayWeight(ageMinutes: number): number {
    return Math.pow(0.5, ageMinutes / CONFIG.HALF_LIFE_MINUTES);
}

function calculateBusyPercent(
    checkIns: PlaceAggregationInput[],
    now: Date
): number {
    if (checkIns.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const checkIn of checkIns) {
        const ageMs = now.getTime() - checkIn.timestamp.toDate().getTime();
        const ageMinutes = ageMs / (60 * 1000);

        if (ageMinutes > CONFIG.CHECKIN_WINDOW_MINUTES) continue;

        const weight = calculateDecayWeight(ageMinutes);
        const percentValue = CONFIG.LEVEL_TO_PERCENT[checkIn.level] ?? 50;

        weightedSum += percentValue * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    return Math.round(weightedSum / totalWeight);
}

function getLatestTimestamp(checkIns: PlaceAggregationInput[]): admin.firestore.Timestamp | null {
    if (checkIns.length === 0) {
        return null;
    }

    return checkIns
        .slice(1)
        .reduce(
            (latest, current) => (
                current.timestamp.toMillis() > latest.toMillis() ? current.timestamp : latest
            ),
            checkIns[0].timestamp
        );
}

function timestampsEqual(
    left: admin.firestore.Timestamp | null | undefined,
    right: admin.firestore.Timestamp | null | undefined
): boolean {
    if (!left && !right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.toMillis() === right.toMillis();
}

function buildPlaceUpdate(
    placeData: PlaceDocData,
    placeCheckIns: PlaceAggregationInput[],
    now: Date
): Record<string, unknown> | null {
    const nextBusyPercent = calculateBusyPercent(placeCheckIns, now);
    const nextLastUpdate = getLatestTimestamp(placeCheckIns);
    const currentBusyPercent = typeof placeData.busyPercent === 'number' ? placeData.busyPercent : 0;
    const currentLastUpdate = placeData.lastUpdate ?? null;

    if (currentBusyPercent === nextBusyPercent && timestampsEqual(currentLastUpdate, nextLastUpdate)) {
        return null;
    }

    return {
        busyPercent: nextBusyPercent,
        lastUpdate: nextLastUpdate ?? admin.firestore.FieldValue.delete(),
    };
}

async function commitInChunks(
    updates: Array<{
        ref: admin.firestore.DocumentReference;
        data: Record<string, unknown>;
    }>
): Promise<void> {
    for (let start = 0; start < updates.length; start += MAX_BATCH_OPERATIONS) {
        const batch = db.batch();
        const chunk = updates.slice(start, start + MAX_BATCH_OPERATIONS);

        for (const update of chunk) {
            batch.update(update.ref, update.data);
        }

        await batch.commit();
    }
}

export const submitCheckin = onCall({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 15,
    maxInstances: 5,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in to check in.');
    }

    const { placeId, level } = request.data as { placeId?: unknown; level?: unknown };

    if (typeof placeId !== 'string' || placeId.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'A valid place ID is required.');
    }

    if (level !== 1 && level !== 2 && level !== 3) {
        throw new HttpsError('invalid-argument', 'Busy level must be 1, 2, or 3.');
    }

    const uid = request.auth.uid;
    const normalizedPlaceId = placeId.trim();
    const cooldownRef = db.collection('checkinCooldowns').doc(`${uid}_${normalizedPlaceId}`);
    const placeRef = db.collection('places').doc(normalizedPlaceId);
    const checkInRef = db.collection('checkins').doc();
    const now = admin.firestore.Timestamp.now();
    const cooldownEndsAt = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000
    );

    await db.runTransaction(async (transaction) => {
        const [placeSnap, cooldownSnap] = await Promise.all([
            transaction.get(placeRef),
            transaction.get(cooldownRef),
        ]);

        if (!placeSnap.exists) {
            throw new HttpsError('not-found', 'Place not found.');
        }

        const lastCheckInAt = cooldownSnap.get('lastCheckInAt') as admin.firestore.Timestamp | undefined;
        if (lastCheckInAt) {
            const lastAllowedAt = lastCheckInAt.toMillis() + CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000;
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

export const aggregateBusyPercent = onSchedule(
    {
        schedule: 'every 5 minutes',
        timeZone: 'America/New_York',
        retryCount: 3,
        region: 'us-central1',
        memory: '256MiB',
        timeoutSeconds: 60,
        maxInstances: 1,
    },
    async () => {
        console.log('Starting busy percent aggregation...');

        const now = new Date();
        const windowStart = new Date(now.getTime() - CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000);

        try {
            const placesSnapshot = await db.collection('places').get();
            console.log(`Found ${placesSnapshot.size} places`);

            if (placesSnapshot.empty) {
                console.log('No places found, skipping aggregation');
                return;
            }

            const checkInsSnapshot = await db
                .collection('checkins')
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(windowStart))
                .get();

            console.log(`Found ${checkInsSnapshot.size} recent check-ins`);

            const checkInsByPlace = new Map<string, PlaceAggregationInput[]>();

            checkInsSnapshot.forEach((doc) => {
                const data = doc.data() as CheckInDoc;
                if (!checkInsByPlace.has(data.placeId)) {
                    checkInsByPlace.set(data.placeId, []);
                }
                checkInsByPlace.get(data.placeId)!.push({
                    level: data.level,
                    timestamp: data.timestamp,
                });
            });

            const updates: Array<{
                ref: admin.firestore.DocumentReference;
                data: Record<string, unknown>;
            }> = [];

            let changedPlaces = 0;
            let skippedForAdminOverride = 0;

            placesSnapshot.forEach((placeDoc) => {
                const placeId = placeDoc.id;
                const placeData = placeDoc.data() as PlaceDocData;

                // Skip places with active admin overrides.
                if (placeData.adminOverride?.active === true) {
                    skippedForAdminOverride += 1;
                    return;
                }

                const placeCheckIns = checkInsByPlace.get(placeId) || [];
                const placeUpdate = buildPlaceUpdate(placeData, placeCheckIns, now);

                if (!placeUpdate) {
                    return;
                }

                updates.push({
                    ref: placeDoc.ref,
                    data: placeUpdate,
                });
                changedPlaces += 1;
            });

            if (updates.length === 0) {
                console.log(`No place changes detected. overrides=${skippedForAdminOverride}`);
                return;
            }

            await commitInChunks(updates);
            console.log(
                `Aggregation complete. places=${placesSnapshot.size} recentCheckins=${checkInsSnapshot.size} ` +
                `updated=${changedPlaces} overrides=${skippedForAdminOverride}`
            );

        } catch (error) {
            console.error('Error during aggregation:', error);
            throw error;
        }
    }
);
