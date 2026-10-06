import type { Timestamp } from 'firebase-admin/firestore';

export interface CheckInDoc {
    placeId: string;
    level: 1 | 2 | 3;
    timestamp: Timestamp;
    uid: string;
}

export interface PlaceAggregationInput {
    level: number;
    timestamp: Timestamp;
}

export interface PlaceDocData {
    busyPercent?: number;
    lastUpdate?: Timestamp | null;
    location?: {
        latitude?: unknown;
        longitude?: unknown;
    };
    adminOverride?: {
        active?: boolean;
    };
}

export interface ClientLocationInput {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export interface GeoPointInput {
    latitude: number;
    longitude: number;
}
