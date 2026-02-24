import { useMemo } from 'react';
import { Place, LocationState, ProximityResult } from '@/types';
import { calculateProximityForAllPlaces, isAccuracyGoodEnough } from '@/services/proximity';

export function useProximity(places: Place[], location: LocationState | null) {
    const proximityResults = useMemo(() => {
        if (!location) return [];
        return calculateProximityForAllPlaces(places, location);
    }, [location, places]);

    const nearestPlace = useMemo<Place | null>(() => {
        const nearby = proximityResults.find(result => result.isNearby);
        return nearby?.place ?? null;
    }, [proximityResults]);

    const isAccuracyGoodEnoughToCheckIn = useMemo<boolean>(() => {
        if (!location) return false;
        return isAccuracyGoodEnough(location);
    }, [location]);

    return { proximityResults, nearestPlace, isAccuracyGoodEnoughToCheckIn };
}
