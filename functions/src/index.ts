/**
 * Firebase Cloud Functions for Campus Pulse
 *
 * LEARNING POINT: Why Cloud Functions?
 *
 * Cloud Functions run server-side code without managing servers. They're ideal for:
 * 1. Scheduled tasks (like our aggregation)
 * 2. Processing that shouldn't happen on user devices
 * 3. Operations requiring elevated privileges
 * 4. Keeping business logic secure (users can't see/modify it)
 *
 * This function runs every 5 minutes to calculate crowd levels.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * LEARNING POINT: Configuration Constants
 *
 * Keep magic numbers in named constants:
 * 1. Self-documenting code - HALF_LIFE_MINUTES is clearer than 30
 * 2. Single source of truth - change once, works everywhere
 * 3. Easier testing - can verify against expected values
 */
const CONFIG = {
    /** How far back to look for check-ins (minutes) */
    CHECKIN_WINDOW_MINUTES: 90,
    /** Half-life for exponential decay (minutes) */
    HALF_LIFE_MINUTES: 30,
    /** BusyLevel values map to these percentages */
    LEVEL_TO_PERCENT: {
        1: 0,    // Not busy = 0%
        2: 50,   // Moderate = 50%
        3: 100,  // Very busy = 100%
    } as Record<number, number>,
};

/**
 * LEARNING POINT: TypeScript Interfaces for Data Validation
 *
 * Even though Firestore is schemaless, defining interfaces helps:
 * 1. Catch errors during development
 * 2. Get autocomplete in your editor
 * 3. Document the expected data structure
 */
interface CheckInDoc {
    placeId: string;
    level: 1 | 2 | 3;
    timestamp: admin.firestore.Timestamp;
    uid: string;
}

interface PlaceUpdate {
    busyPercent: number;
    lastUpdate: admin.firestore.FieldValue;
}

/**
 * Calculates the decay weight for a check-in based on its age.
 *
 * LEARNING POINT: Exponential Decay
 *
 * Exponential decay gives recent data more weight than old data.
 * The formula: weight = 0.5 ^ (age / half_life)
 *
 * With a 30-minute half-life:
 * - Just submitted: weight = 1.0
 * - 30 min ago: weight = 0.5
 * - 60 min ago: weight = 0.25
 * - 90 min ago: weight = 0.125
 *
 * This creates a "fading" effect where old check-ins gradually
 * lose influence, which matches real-world crowd behavior.
 *
 * @param ageMinutes - How old the check-in is in minutes
 * @returns A weight between 0 and 1
 */
function calculateDecayWeight(ageMinutes: number): number {
    return Math.pow(0.5, ageMinutes / CONFIG.HALF_LIFE_MINUTES);
}

/**
 * Aggregates check-ins into a busy percentage for a place.
 *
 * LEARNING POINT: Weighted Average
 *
 * Instead of a simple average, we use a weighted average:
 *   sum(value * weight) / sum(weights)
 *
 * This gives more importance to recent check-ins.
 * If there are no check-ins, we return 0 (unknown).
 *
 * @param checkIns - Array of check-in documents for one place
 * @param now - Current timestamp for age calculations
 * @returns Busy percentage 0-100
 */
function calculateBusyPercent(
    checkIns: Array<{ level: number; timestamp: admin.firestore.Timestamp }>,
    now: Date
): number {
    if (checkIns.length === 0) {
        return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const checkIn of checkIns) {
        // Calculate age in minutes
        const ageMs = now.getTime() - checkIn.timestamp.toDate().getTime();
        const ageMinutes = ageMs / (60 * 1000);

        // Skip check-ins outside our window (shouldn't happen, but safety first)
        if (ageMinutes > CONFIG.CHECKIN_WINDOW_MINUTES) {
            continue;
        }

        // Calculate weight and add to sums
        const weight = calculateDecayWeight(ageMinutes);
        const percentValue = CONFIG.LEVEL_TO_PERCENT[checkIn.level] ?? 50;

        weightedSum += percentValue * weight;
        totalWeight += weight;
    }

    // Avoid division by zero
    if (totalWeight === 0) {
        return 0;
    }

    // Round to nearest integer
    return Math.round(weightedSum / totalWeight);
}

/**
 * Scheduled function that runs every 5 minutes to aggregate check-ins.
 *
 * LEARNING POINT: Cloud Function Scheduling
 *
 * onSchedule creates a Cloud Scheduler job that triggers this function.
 * The schedule format is cron syntax: "every 5 minutes"
 *
 * Why 5 minutes?
 * - Frequent enough to reflect crowd changes
 * - Infrequent enough to not burn through quota
 * - Aligns with how quickly crowds actually change
 *
 * LEARNING POINT: Batch Operations
 *
 * We use batched writes to update all places atomically:
 * 1. Either all updates succeed or all fail
 * 2. More efficient than individual writes
 * 3. Firestore limits batches to 500 operations
 */
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
            // Step 1: Get all places
            const placesSnapshot = await db.collection('places').get();
            console.log(`Found ${placesSnapshot.size} places`);

            if (placesSnapshot.empty) {
                console.log('No places found, skipping aggregation');
                return;
            }

            // Step 2: Get recent check-ins
            const checkInsSnapshot = await db
                .collection('checkins')
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(windowStart))
                .get();

            console.log(`Found ${checkInsSnapshot.size} recent check-ins`);

            // Step 3: Group check-ins by place
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

            // Step 4: Calculate and update each place
            const batch = db.batch();
            let updateCount = 0;

            placesSnapshot.forEach((placeDoc) => {
                const placeId = placeDoc.id;
                const placeCheckIns = checkInsByPlace.get(placeId) || [];
                const busyPercent = calculateBusyPercent(placeCheckIns, now);

                const update: PlaceUpdate = {
                    busyPercent,
                    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
                };

                batch.update(placeDoc.ref, update);
                updateCount++;

                console.log(`Place ${placeId}: ${placeCheckIns.length} check-ins -> ${busyPercent}%`);
            });

            // Step 5: Commit all updates
            await batch.commit();
            console.log(`Successfully updated ${updateCount} places`);

        } catch (error) {
            console.error('Error during aggregation:', error);
            throw error; // Rethrow to trigger retry
        }
    }
);

/**
 * LEARNING POINT: Function Testing
 *
 * To test this function locally:
 * 1. cd functions
 * 2. npm run serve
 * 3. The emulator will run the function on schedule
 *
 * Or manually trigger via Firebase Console or CLI.
 */
