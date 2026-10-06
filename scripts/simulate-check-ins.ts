/**
 * Write local test reports and run the actual server aggregation operation.
 * FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=campusactivity-ec1f2 \
 *   npx tsx scripts/simulate-check-ins.ts --place charles-library --level 2 --count 3
 * Cloud writes require --production and your existing Admin SDK credentials.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { getScriptFirestore } from './firebase-script-context';
import { aggregatePlaceCrowds } from '../functions/src/operations/aggregate-place-crowds';

function argument(name: string, fallback: string): string {
    const index = process.argv.indexOf(name);
    if (index === -1) return fallback;
    const value = process.argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
    return value;
}

async function simulateCheckIns(): Promise<void> {
    const db = getScriptFirestore();
    const placeId = argument('--place', 'charles-library');
    const level = Number(argument('--level', '2'));
    const count = Number(argument('--count', '3'));
    if (![1, 2, 3].includes(level) || !Number.isInteger(count) || count < 1 || count > 500) {
        throw new Error('Use --level 1, 2, or 3 and an integer --count between 1 and 500.');
    }
    if (!placeId || placeId.includes('/')) throw new Error('Invalid place ID');
    const placeRef = db.collection('places').doc(placeId);
    if (!(await placeRef.get()).exists) throw new Error(`Place ${placeId} does not exist`);

    const now = new Date();
    const batch = db.batch();
    for (let i = 0; i < count; i++) {
        batch.set(db.collection('checkins').doc(), {
            placeId,
            level,
            timestamp: Timestamp.fromMillis(now.getTime() - (i / count) * 10 * 60_000),
            uid: 'test-script',
        });
    }
    await batch.commit();
    console.log(await aggregatePlaceCrowds(db, now));
    console.log(`${placeId}: ${(await placeRef.get()).get('busyPercent')}% busy`);
}

simulateCheckIns().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
