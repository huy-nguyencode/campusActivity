import { Timestamp, type DocumentSnapshot, type Firestore } from 'firebase-admin/firestore';
import { CROWD_CONFIG, MAX_BATCH_OPERATIONS } from '../shared/crowd-config';
import type { CheckInDoc, PlaceAggregationInput, PlaceDocData } from '../shared/firestore-types';
import { buildPlaceUpdate } from '../domain/crowd-calculation';

/**
 * Visit places with current reports or a saved crowd state that may need clearing.
 * Empty queries still incur a minimum read, but idle places are no longer scanned.
 * No new fields or data migration are required for existing place documents.
 */
export async function aggregatePlaceCrowds(db: Firestore, now = new Date()) {
    const windowStart = Timestamp.fromMillis(
        now.getTime() - CROWD_CONFIG.CHECKIN_WINDOW_MINUTES * 60_000
    );
    const places = db.collection('places');
    const [recentReports, timestampedPlaces, nonzeroPlaces] = await Promise.all([
        db.collection('checkins').where('timestamp', '>=', windowStart).get(),
        places.where('lastUpdate', '>', Timestamp.fromMillis(0)).get(),
        // Includes legacy/manual crowd values without a lastUpdate timestamp.
        places.where('busyPercent', '>', 0).get(),
    ]);

    const reportsByPlace = new Map<string, PlaceAggregationInput[]>();
    for (const report of recentReports.docs) {
        const data = report.data() as CheckInDoc;
        const reports = reportsByPlace.get(data.placeId) ?? [];
        reports.push({ level: data.level, timestamp: data.timestamp });
        reportsByPlace.set(data.placeId, reports);
    }

    const candidates = new Map<string, DocumentSnapshot>();
    for (const place of [...timestampedPlaces.docs, ...nonzeroPlaces.docs]) {
        candidates.set(place.id, place);
    }

    // A place's first check-in won't have a saved crowd timestamp yet.
    const missingPlaceIds = [...reportsByPlace.keys()].filter((id) => !candidates.has(id));
    for (let start = 0; start < missingPlaceIds.length; start += MAX_BATCH_OPERATIONS) {
        const refs = missingPlaceIds.slice(start, start + MAX_BATCH_OPERATIONS)
            .map((id) => places.doc(id));
        for (const place of await db.getAll(...refs)) {
            if (place.exists) candidates.set(place.id, place);
        }
    }

    const updates = [];
    for (const place of candidates.values()) {
        const data = place.data() as PlaceDocData;
        if (data.adminOverride?.active) continue;

        const update = buildPlaceUpdate(data, reportsByPlace.get(place.id) ?? [], now);
        if (update) updates.push({ place, update });
    }

    for (let start = 0; start < updates.length; start += MAX_BATCH_OPERATIONS) {
        const batch = db.batch();
        for (const { place, update } of updates.slice(start, start + MAX_BATCH_OPERATIONS)) {
            // Do not overwrite an admin change made after our read. A conflict fails
            // the batch; the scheduler retries with fresh documents.
            batch.update(place.ref, update, { lastUpdateTime: place.updateTime! });
        }
        await batch.commit();
    }

    return {
        recentCheckins: recentReports.size,
        candidatePlaces: candidates.size,
        updatedPlaces: updates.length,
        // Document reads only: includes empty-query minima and duplicate candidates.
        estimatedDocumentReads: Math.max(1, recentReports.size)
            + Math.max(1, timestampedPlaces.size)
            + Math.max(1, nonzeroPlaces.size)
            + missingPlaceIds.length,
    };
}
