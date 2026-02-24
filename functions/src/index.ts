import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

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

function calculateDecayWeight(ageMinutes: number): number {
    return Math.pow(0.5, ageMinutes / CONFIG.HALF_LIFE_MINUTES);
}

function calculateBusyPercent(
    checkIns: Array<{ level: number; timestamp: admin.firestore.Timestamp }>,
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

export const aggregateBusyPercent = onSchedule(
    {
        schedule: 'every 5 minutes',
        timeZone: 'America/New_York',
        retryCount: 3,
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

            const checkInsByPlace = new Map<string, Array<{ level: number; timestamp: admin.firestore.Timestamp }>>();

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

            const batch = db.batch();
            let updateCount = 0;

            placesSnapshot.forEach((placeDoc) => {
                const placeId = placeDoc.id;

                // Skip places with active admin overrides.
                if (placeDoc.data().adminOverride?.active === true) {
                    console.log(`Place ${placeId}: admin override active, skipping`);
                    return;
                }

                const placeCheckIns = checkInsByPlace.get(placeId) || [];
                const busyPercent = calculateBusyPercent(placeCheckIns, now);

                batch.update(placeDoc.ref, {
                    busyPercent,
                    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
                });
                updateCount++;

                console.log(`Place ${placeId}: ${placeCheckIns.length} check-ins -> ${busyPercent}%`);
            });

            await batch.commit();
            console.log(`Successfully updated ${updateCount} places`);

        } catch (error) {
            console.error('Error during aggregation:', error);
            throw error;
        }
    }
);
