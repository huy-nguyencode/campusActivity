import { useMemo } from 'react';
import { Place, LocationState, ProximityResult } from '@/types';
import { calculateProximityForAllPlaces, isAccuracyGoodEnough } from '@/services/proximityService';

/**
 * Custom hook for calculating proximity between user location and places.
 *
 * This hook combines location and places data to determine which places
 * are nearby and whether GPS accuracy is sufficient for check-in.
 *
 * @param places - Array of campus places (from usePlaces)
 * @param location - User's current location (from useLocation)
 * @returns An object containing proximity results and derived state.
 * @example
 * const { places } = usePlaces();
 * const { location } = useLocation();
 * const { proximityResults, nearestPlace, isAccuracyGoodEnoughToCheckIn } = useProximity(places, location);
 *
 * if (nearestPlace && isAccuracyGoodEnoughToCheckIn) {
 *   return <CheckInButton place={nearestPlace} />;
 * }
 */
export function useProximity(places: Place[], location: LocationState | null) {
    const proximityResults = useMemo(() => {
        if (!location) return [];
        return calculateProximityForAllPlaces(places, location);
    }, [location, places]);

    //find the nearest place available to check in
    const nearestPlace = useMemo<Place | null>(() => {
        const nearby = proximityResults.find(result => result.isNearby);
        return nearby?.place ?? null;
    }, [proximityResults]);

    //check if the accuracy is good enough to check in
    const isAccuracyGoodEnoughToCheckIn = useMemo<boolean>(() => {
        if (!location) return false;
        return isAccuracyGoodEnough(location);
    }, [location]);

    return { proximityResults, nearestPlace, isAccuracyGoodEnoughToCheckIn };
}