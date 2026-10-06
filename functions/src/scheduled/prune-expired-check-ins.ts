import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../shared/firestore-admin';
import { CROWD_CONFIG, MAX_BATCH_OPERATIONS } from '../shared/crowd-config';
import { SCHEDULED_FUNCTION_OPTIONS } from '../shared/runtime-options';

/**
 * Deletes check-ins older than the aggregation window so retention matches
 * the privacy policy (crowd data is only meaningful for ~90 minutes).
 */
export const cleanupOldCheckins = onSchedule(
    {
        schedule: 'every 60 minutes',
        timeZone: 'America/New_York',
        retryCount: 3,
        ...SCHEDULED_FUNCTION_OPTIONS,
        timeoutSeconds: 120,
    },
    async () => {
        const cutoff = new Date(Date.now() - CROWD_CONFIG.CHECKIN_WINDOW_MINUTES * 60 * 1000);
        const cutoffTimestamp = Timestamp.fromDate(cutoff);


        let deleted = 0;

        // Paginate deletes to stay under batch limits.
        while (true) {
            const staleSnap = await db
                .collection('checkins')
                .where('timestamp', '<', cutoffTimestamp)
                .limit(MAX_BATCH_OPERATIONS)
                .get();

            if (staleSnap.empty) {
                break;
            }

            const batch = db.batch();
            staleSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
            deleted += staleSnap.size;

            if (staleSnap.size < MAX_BATCH_OPERATIONS) {
                break;
            }
        }

        // Also prune expired cooldown docs to limit collection growth.
        let cooldownsDeleted = 0;
        while (true) {
            const expiredCooldowns = await db
                .collection('checkinCooldowns')
                .where('cooldownEndsAt', '<', Timestamp.now())
                .limit(MAX_BATCH_OPERATIONS)
                .get();

            if (expiredCooldowns.empty) {
                break;
            }

            const batch = db.batch();
            expiredCooldowns.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
            cooldownsDeleted += expiredCooldowns.size;

            if (expiredCooldowns.size < MAX_BATCH_OPERATIONS) {
                break;
            }
        }

        console.log(`Cleanup complete. checkinsDeleted=${deleted} cooldownsDeleted=${cooldownsDeleted}`);
    }
);
