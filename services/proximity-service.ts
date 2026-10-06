import { Place, LocationState, ProximityResult } from '@/types/domain';
import { haversineDistance } from '@/utils/geo-distance';
import { CONFIG } from '@/constants/app-config';

function calculateProximity(place: Place, locationState: LocationState): ProximityResult {
    const distance = haversineDistance(
        place.location.latitude,
        place.location.longitude,
        locationState.latitude,
        locationState.longitude
    );
    const isNearby = distance <= CONFIG.CHECK_IN_RADIUS;
    return { place, distance, isNearby };
}

export function calculateProximityForAllPlaces(places: Place[], locationState: LocationState): ProximityResult[] {
    return places
        .map(place => calculateProximity(place, locationState))
        .sort((a, b) => a.distance - b.distance);
}

export function getNearbyPlaces(places: Place[], locationState: LocationState): Place[] {
    return calculateProximityForAllPlaces(places, locationState)
        .filter(result => result.isNearby)
        .map(result => result.place);
}

export function isAccuracyGoodEnough(locationState: LocationState): boolean {
    if (!locationState.accuracy) return false;
    return locationState.accuracy <= CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN;
}

export function findNearbyPlace(places: Place[], locationState: LocationState): Place | null {
    return calculateProximityForAllPlaces(places, locationState)
        .find(result => result.isNearby)?.place ?? null;
}
