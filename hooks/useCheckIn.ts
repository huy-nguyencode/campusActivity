import { useState, useEffect, useCallback } from 'react';
import { CheckIn, BusyLevel } from '@/types';
import { submitCheckin, isOnCoolDown, getCooldown } from '@/services/checkin';
import { CONFIG } from '@/constants/config';

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

    //submit check-in
    const checkIn = useCallback(async (level: BusyLevel): Promise<CheckIn | null> => {
        if (!placeId) return null;

        setIsLoading(true);
        setError(null);

        try {
            const result = await submitCheckin(placeId, level);
            if (result) {
                //update cooldown state after successful check-in
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
        isOnCooldown,
        cooldownEndTime,
        isLoading,
        error,
    };
}
