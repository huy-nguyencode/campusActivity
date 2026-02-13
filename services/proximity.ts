/**
 * Proximity service for Campus Spots.
 *
 * Calculates distances between user location and campus places,
 * determines which places are nearby (within check-in radius).
 */

import { Place, LocationState, ProximityResult} from '@/types';
import { haversineDistance } from '@/utils/haversine';
import { CONFIG } from '@/constants/config';

/**
 * Calculate the proximity of a place to a user's location.
 * @param place - The place to calculate the proximity of.
 * @param locationState - The user's location.
 * @returns The proximity result.
 */
function calculateProximity(place: Place, locationState: LocationState): ProximityResult {
    //calculate the distance between the place and user's location
    const distance = haversineDistance(place.location.latitude, place.location.longitude, locationState.latitude, locationState.longitude);
    //determine if the place is nearby by comparing the distance to the check in radius
    const isNearby = distance <= CONFIG.CHECK_IN_RADIUS;
    //return the proximity result
    return {
        place,
        distance,
        isNearby,
    };
}
/**
 * Calculate the proximity for all places.
 * @param places - The places to calculate the proximity of.
 * @param locationState - The user's location.
 * @returns The proximity results.
 */
export function calculateProximityForAllPlaces(places: Place[], locationState: LocationState): ProximityResult[] {
    //calculate the proximity for all places
    const proximityResults = places.map(place => calculateProximity(place, locationState));
    //sort the places by distance
    const sortedPlaces = proximityResults.sort((a, b) => a.distance - b.distance);
    //return the sorted places
    return sortedPlaces;
}

/**
 * Get the nearby places for a given location.
 * @param locationState - The user's location.
 * @returns The nearby places.
 */
export function getNearbyPlaces(places: Place[], locationState: LocationState): Place[] {
    //get all places within the check in radius
    const proximityResults = calculateProximityForAllPlaces(places, locationState);
    //return the nearby places
    return proximityResults.filter(result => result.isNearby).map(result => result.place);
}

/**
 * Check if the accuracy is good enough to check in.
 * @param locationState - The user's location.
 * @returns True if the accuracy is good enough, false otherwise.
 */
export function isAccuracyGoodEnough(locationState: LocationState): boolean {
    //check if the accuracy is good enough by comparing it to the minimum accuracy to check in
    if (!locationState.accuracy) {
        return false;
    }
    return locationState.accuracy <= CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN;
}

/**
 * Find the nearest place that is within check-in radius.
 * @param places - All campus places.
 * @param locationState - The user's location.
 * @returns The nearest place or null if none nearby.
 */
export function findNearbyPlace(places: Place[], locationState: LocationState): Place | null {
    //get all places within the check in radius
    const proximityResults = calculateProximityForAllPlaces(places, locationState);
    //return the first place that is nearby
    return proximityResults.find(result => result.isNearby)?.place ?? null;
}