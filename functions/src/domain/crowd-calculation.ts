import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { CROWD_CONFIG } from '../shared/crowd-config';
import type { PlaceAggregationInput, PlaceDocData } from '../shared/firestore-types';

function calculateDecayWeight(ageMinutes: number): number {
    return Math.pow(0.5, ageMinutes / CROWD_CONFIG.HALF_LIFE_MINUTES);
}

export function calculateBusyPercent(
    checkIns: PlaceAggregationInput[],
    now: Date
): number {
    if (checkIns.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const checkIn of checkIns) {
        const ageMs = now.getTime() - checkIn.timestamp.toDate().getTime();
        const ageMinutes = ageMs / (60 * 1000);

        if (ageMinutes > CROWD_CONFIG.CHECKIN_WINDOW_MINUTES) continue;

        const weight = calculateDecayWeight(ageMinutes);
        const percentValue = CROWD_CONFIG.LEVEL_TO_PERCENT[checkIn.level] ?? 50;

        weightedSum += percentValue * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    return Math.round(weightedSum / totalWeight);
}

function getLatestTimestamp(checkIns: PlaceAggregationInput[]): Timestamp | null {
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
    left: Timestamp | null | undefined,
    right: Timestamp | null | undefined
): boolean {
    if (!left && !right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.toMillis() === right.toMillis();
}

export function buildPlaceUpdate(
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
        lastUpdate: nextLastUpdate ?? FieldValue.delete(),
    };
}
