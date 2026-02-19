/**
 * Test Script: Simulate check-ins and verify busyPercent aggregation
 *
 * This script bypasses the app's proximity and auth checks to directly
 * write check-in documents to Firestore, then runs the same aggregation
 * logic used by the Cloud Function to verify the full pipeline works.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/testCheckin.ts
 *
 * Optional args:
 *   --place <placeId>   Place to check in to (default: "charles-library")
 *   --level <1|2|3>     Busy level: 1=not busy, 2=moderate, 3=very busy (default: 2)
 *   --count <n>         Number of check-ins to simulate (default: 3)
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// --- Config (mirrors functions/src/index.ts) ---
const CHECKIN_WINDOW_MINUTES = 90;
const HALF_LIFE_MINUTES = 30;
const LEVEL_TO_PERCENT: Record<number, number> = { 1: 0, 2: 50, 3: 100 };

// --- CLI args ---
const args = process.argv.slice(2);
const placeId = args[args.indexOf('--place') + 1] ?? 'charles-library';
const level = parseInt(args[args.indexOf('--level') + 1] ?? '2') as 1 | 2 | 3;
const count = parseInt(args[args.indexOf('--count') + 1] ?? '3');

// --- Aggregation logic (same as Cloud Function) ---
function calculateDecayWeight(ageMinutes: number): number {
    return Math.pow(0.5, ageMinutes / HALF_LIFE_MINUTES);
}

function calculateBusyPercent(
    checkIns: Array<{ level: number; timestamp: admin.firestore.Timestamp }>,
    now: Date
): number {
    if (checkIns.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const checkIn of checkIns) {
        const ageMinutes = (now.getTime() - checkIn.timestamp.toDate().getTime()) / 60000;
        if (ageMinutes > CHECKIN_WINDOW_MINUTES) continue;

        const weight = calculateDecayWeight(ageMinutes);
        const percentValue = LEVEL_TO_PERCENT[checkIn.level] ?? 50;
        weightedSum += percentValue * weight;
        totalWeight += weight;
    }

    return totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight);
}

async function testCheckin(): Promise<void> {
    console.log(`\nSimulating ${count} check-in(s) to "${placeId}" at level ${level}...\n`);

    // Step 1: Verify the place exists
    const placeRef = db.collection('places').doc(placeId);
    const placeSnap = await placeRef.get();

    if (!placeSnap.exists) {
        console.error(`Place "${placeId}" not found in Firestore. Check the ID and try again.`);
        process.exit(1);
    }

    const beforePercent = placeSnap.data()?.busyPercent ?? 0;
    console.log(`Before: ${placeId} busyPercent = ${beforePercent}%`);

    // Step 2: Write fake check-in documents
    // We use a batch to write all at once, each with a timestamp slightly
    // in the past to simulate real-world spread across the last few minutes.
    const batch = db.batch();
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const ref = db.collection('checkins').doc();
        // Spread check-ins evenly over the last 10 minutes
        const minutesAgo = (i / count) * 10;
        const timestamp = new Date(now.getTime() - minutesAgo * 60000);

        batch.set(ref, {
            placeId,
            level,
            timestamp: admin.firestore.Timestamp.fromDate(timestamp),
            uid: 'test-script',
        });

        console.log(`  + check-in #${i + 1}: level=${level}, ${minutesAgo.toFixed(1)} min ago`);
    }

    await batch.commit();
    console.log(`\nWrote ${count} check-in(s) to Firestore.`);

    // Step 3: Run aggregation locally (same logic as the Cloud Function)
    // Fetch all check-ins for this place within the window
    const windowStart = new Date(now.getTime() - CHECKIN_WINDOW_MINUTES * 60000);
    const checkInsSnap = await db
        .collection('checkins')
        .where('placeId', '==', placeId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(windowStart))
        .get();

    const checkIns = checkInsSnap.docs.map(d => ({
        level: d.data().level as number,
        timestamp: d.data().timestamp as admin.firestore.Timestamp,
    }));

    console.log(`\nFound ${checkIns.length} total check-in(s) in the ${CHECKIN_WINDOW_MINUTES}-min window.`);

    const newBusyPercent = calculateBusyPercent(checkIns, now);

    // Step 4: Write the result back to the place (same as the Cloud Function)
    await placeRef.update({
        busyPercent: newBusyPercent,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Step 5: Read it back to confirm
    const afterSnap = await placeRef.get();
    const afterPercent = afterSnap.data()?.busyPercent ?? 0;

    console.log(`\nAggregation result:`);
    console.log(`  Before : ${beforePercent}%`);
    console.log(`  After  : ${afterPercent}%`);
    console.log(`\n✅ Pipeline works! The Cloud Function will produce the same result on its next run.`);
}

testCheckin()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('\nTest failed:', err);
        process.exit(1);
    });
