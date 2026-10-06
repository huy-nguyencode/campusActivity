import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../shared/firestore-admin';
import { SCHEDULED_FUNCTION_OPTIONS } from '../shared/runtime-options';
import { aggregatePlaceCrowds } from '../operations/aggregate-place-crowds';

export const aggregateBusyPercent = onSchedule(
    {
        ...SCHEDULED_FUNCTION_OPTIONS,
        schedule: 'every 15 minutes',
        timeZone: 'America/New_York',
        retryCount: 3,
        timeoutSeconds: 60,
    },
    async () => {
        const result = await aggregatePlaceCrowds(db);
        console.log('Crowd aggregation complete', result);
    }
);
