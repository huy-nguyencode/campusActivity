import { HttpsError } from 'firebase-functions/v2/https';
import { CROWD_CONFIG } from '../shared/crowd-config';
import type { ClientLocationInput, GeoPointInput, PlaceDocData } from '../shared/firestore-types';

const EARTH_RADIUS_METERS = 6_371_000;

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isValidLatitude(value: unknown): value is number {
    return isFiniteNumber(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: unknown): value is number {
    return isFiniteNumber(value) && value >= -180 && value <= 180;
}

export function parseClientLocation(value: unknown): ClientLocationInput {
    if (!value || typeof value !== 'object') {
        throw new HttpsError('invalid-argument', 'Current location is required to check in.');
    }

    const rawLocation = value as Record<string, unknown>;
    const { latitude, longitude, accuracy } = rawLocation;

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        throw new HttpsError('invalid-argument', 'A valid current location is required.');
    }

    if (!isFiniteNumber(accuracy) || accuracy <= 0) {
        throw new HttpsError('invalid-argument', 'A valid location accuracy is required.');
    }

    if (accuracy > CROWD_CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN_METERS) {
        throw new HttpsError('failed-precondition', 'Location accuracy is too low to check in.');
    }

    return { latitude, longitude, accuracy };
}

export function getPlaceLocation(placeData: PlaceDocData): GeoPointInput {
    const location = placeData.location;

    if (!location || !isValidLatitude(location.latitude) || !isValidLongitude(location.longitude)) {
        throw new HttpsError('failed-precondition', 'Place location is not configured correctly.');
    }

    return {
        latitude: location.latitude,
        longitude: location.longitude,
    };
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function calculateDistanceMeters(left: GeoPointInput, right: GeoPointInput): number {
    const deltaLatitude = toRadians(right.latitude - left.latitude);
    const deltaLongitude = toRadians(right.longitude - left.longitude);

    const a =
        Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
        Math.cos(toRadians(left.latitude)) *
        Math.cos(toRadians(right.latitude)) *
        Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

export function validateCheckinLocation(clientLocation: ClientLocationInput, placeLocation: GeoPointInput): void {
    const distanceMeters = calculateDistanceMeters(clientLocation, placeLocation);

    if (distanceMeters > CROWD_CONFIG.CHECK_IN_RADIUS_METERS) {
        throw new HttpsError('failed-precondition', 'You must be near this place to check in.');
    }
}
