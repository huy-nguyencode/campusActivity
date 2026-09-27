import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckIn, BusyLevel, LocationState } from '@/types';
import { submitCheckin, getCooldownEndTime } from '@/services/checkInService';
import { CONFIG } from '@/constants/config';

export function useCheckIn(placeId: string | null) {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inFlightRef = useRef(false);

    const refreshCooldown = useCallback(async () => {
        if (!placeId) {
            setIsOnCooldown(false);
            setCooldownEndTime(null);
            return;
        }

        try {
            const endTime = await getCooldownEndTime(placeId);
            setIsOnCooldown(endTime !== null);
            setCooldownEndTime(endTime);
        } catch (err) {
            console.error('Error checking cooldown:', err);
        }
    }, [placeId]);

    useEffect(() => {
        refreshCooldown();
    }, [refreshCooldown]);

    const checkIn = useCallback(async (level: BusyLevel, location: LocationState): Promise<CheckIn | null> => {
        if (!placeId || inFlightRef.current) return null;

        inFlightRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const result = await submitCheckin(placeId, level, location);

            if (result.status === 'cooldown') {
                setIsOnCooldown(true);
                setCooldownEndTime(result.cooldownEndsAt);
                setError('You already checked in recently. Please wait for the cooldown.');
                return null;
            }

            setIsOnCooldown(true);
            setCooldownEndTime(
                new Date(result.checkIn.timestamp.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000)
            );
            return result.checkIn;
        } catch (err) {
            setError((err as Error).message);
            return null;
        } finally {
            inFlightRef.current = false;
            setIsLoading(false);
        }
    }, [placeId]);

    return {
        checkIn,
        refreshCooldown,
        isOnCooldown,
        cooldownEndTime,
        isLoading,
        error,
    };
}
