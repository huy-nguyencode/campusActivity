import { useState, useEffect, useCallback } from 'react';
import { CheckIn, BusyLevel, LocationState } from '@/types';
import { submitCheckin, isOnCoolDown, getCooldown } from '@/services/checkInService';
import { CONFIG } from '@/constants/config';

export function useCheckIn(placeId: string | null) {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshCooldown = useCallback(async () => {
        if (!placeId) {
            setIsOnCooldown(false);
            setCooldownEndTime(null);
            return;
        }

        try {
            const onCooldown = await isOnCoolDown(placeId);
            setIsOnCooldown(onCooldown);

            if (onCooldown) {
                const lastCheckInTime = await getCooldown(placeId);
                if (lastCheckInTime) {
                    const endTime = new Date(lastCheckInTime.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000);
                    setCooldownEndTime(endTime);
                }
            } else {
                setCooldownEndTime(null);
            }
        } catch (err) {
            console.error('Error checking cooldown:', err);
        }
    }, [placeId]);

    useEffect(() => {
        refreshCooldown();
    }, [refreshCooldown]);

    const checkIn = useCallback(async (level: BusyLevel, location: LocationState): Promise<CheckIn | null> => {
        if (!placeId) return null;

        setIsLoading(true);
        setError(null);

        try {
            const result = await submitCheckin(placeId, level, location);
            if (result) {
                setIsOnCooldown(true);
                const endTime = new Date(Date.now() + CONFIG.CHECK_IN_COOLDOWN * 60000);
                setCooldownEndTime(endTime);
            }
            return result;
        } catch (err) {
            setError((err as Error).message);
            return null;
        } finally {
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
