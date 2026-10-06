import { Timestamp } from 'firebase/firestore';
import type { Place, AdminOverride, PlaceType } from '@/types/domain';

const PLACE_TYPES: ReadonlySet<string> = new Set([
    'dining hall',
    'library',
    'gym',
    'cafe',
    'food truck',
    'study',
    'the wall',
    'bagel',
    'restaurant',
]);

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

export function mapPlaceDocument(id: string, data: unknown): Place | null {
    if (!data || typeof data !== 'object') {
        console.warn(`[place-service] Skipping place ${id}: missing document data`);
        return null;
    }

    const placeDocument = data as Record<string, unknown>;
    const location = placeDocument.location;

    if (!location || typeof location !== 'object') {
        console.warn(`[place-service] Skipping place ${id}: missing location`);
        return null;
    }

    const { latitude, longitude } = location as Record<string, unknown>;
    if (
        !isFiniteNumber(latitude) ||
        !isFiniteNumber(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        console.warn(`[place-service] Skipping place ${id}: invalid coordinates`);
        return null;
    }

    if (typeof placeDocument.name !== 'string' || placeDocument.name.trim().length === 0) {
        console.warn(`[place-service] Skipping place ${id}: invalid name`);
        return null;
    }

    if (typeof placeDocument.type !== 'string' || !PLACE_TYPES.has(placeDocument.type)) {
        console.warn(`[place-service] Skipping place ${id}: invalid type`);
        return null;
    }

    let adminOverride: AdminOverride | null = null;
    if (placeDocument.adminOverride && typeof placeDocument.adminOverride === 'object') {
        const raw = placeDocument.adminOverride as Record<string, unknown>;
        adminOverride = {
            active: (raw.active as boolean) ?? false,
            busyPercent: isFiniteNumber(raw.busyPercent) ? raw.busyPercent : 0,
            setBy: typeof raw.setBy === 'string' ? raw.setBy : '',
            setAt: raw.setAt instanceof Timestamp ? raw.setAt.toDate() : null,
        };
    }

    const busyPercent = isFiniteNumber(placeDocument.busyPercent)
        ? Math.min(100, Math.max(0, placeDocument.busyPercent))
        : 0;

    return {
        id,
        name: placeDocument.name.trim(),
        type: placeDocument.type as PlaceType,
        location: { latitude, longitude },
        busyPercent,
        lastUpdate: placeDocument.lastUpdate instanceof Timestamp
            ? placeDocument.lastUpdate.toDate()
            : null,
        adminOverride,
    };
}
