import { useState, useEffect, useCallback } from 'react';
import { CheckIn, BusyLevel } from '@/types';
import { submitCheckin, isOnCoolDown, getCooldown, CheckInResult } from '@/services/checkinService';
import { CONFIG } from '@/constants/appConfig';

/**
 * Custom hook for managing check-in submission and cooldown state.
 *
 * This hook handles the submission of check-ins and tracks cooldown
 * to prevent spam submissions.
 *
 * @param placeId - The place to manage check-in for (can be null)
 * @returns An object containing check-in function and cooldown state.
 * @example
 * const { checkIn, isOnCooldown, cooldownEndTime, isLoading, error } = useCheckIn(placeId);
 *
 * if (isOnCooldown) {
 *   return <CooldownTimer endTime={cooldownEndTime} />;
 * }
 * return <CheckInButtons onCheckIn={checkIn} disabled={isLoading} />;
 */
export function useCheckIn(placeId: string | null) {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //check cooldown state when placeId changes
    useEffect(() => {
        if (!placeId) {
            setIsOnCooldown(false);
            setCooldownEndTime(null);
            return;
        }

        const checkCooldownStatus = async () => {
            try {
                const onCooldown = await isOnCoolDown(placeId);
                setIsOnCooldown(onCooldown);

                if (onCooldown) {
                    const lastCheckInTime = await getCooldown(placeId);
                    if (lastCheckInTime) {
                        //calculate cooldown end time
                        const endTime = new Date(lastCheckInTime.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000);
                        setCooldownEndTime(endTime);
                    }
                } else {
                    setCooldownEndTime(null);
                }
            } catch (err) {
                console.error('Error checking cooldown:', err);
            }
        };

        checkCooldownStatus();
    }, [placeId]);

    /**
     * Refreshes cooldown state by re-reading from AsyncStorage.
     * Call this when a cooldown timer expires so the UI updates
     * without requiring navigation away and back.
     */
    const refreshCooldown = useCallback(async () => {
        if (!placeId) return;
        const onCooldown = await isOnCoolDown(placeId);
        setIsOnCooldown(onCooldown);
        if (!onCooldown) {
            setCooldownEndTime(null);
        }
    }, [placeId]);

    //submit check-in
    const checkIn = useCallback(async (level: BusyLevel): Promise<CheckInResult> => {
        if (!placeId) return { success: false, reason: 'error', message: 'No place selected.' };

        setIsLoading(true);
        setError(null);

        try {
            const result = await submitCheckin(placeId, level);
            if (result.success) {
                //update cooldown state after successful check-in
                setIsOnCooldown(true);
                const endTime = new Date(Date.now() + CONFIG.CHECK_IN_COOLDOWN * 60000);
                setCooldownEndTime(endTime);
            } else {
                setError(result.message);
            }
            return result;
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            return { success: false, reason: 'error', message };
        } finally {
            setIsLoading(false);
        }
    }, [placeId]);

    return {
        checkIn,
        isOnCooldown,
        cooldownEndTime,
        isLoading,
        error,
        refreshCooldown,
    };
}
