import { useState, useEffect, useCallback } from 'react';
import { checkIsAdmin, setAdminOverride, removeAdminOverride } from '@/services/admin';

interface UseAdminReturn {
    isAdmin: boolean;
    isLoading: boolean;
    setOverride: (placeId: string, busyPercent: number) => Promise<void>;
    clearOverride: (placeId: string) => Promise<void>;
}

export function useAdmin(uid: string | null): UseAdminReturn {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        if (!uid) {
            setIsAdmin(false);
            setIsLoading(false);
            return;
        }

        async function check() {
            try {
                const result = await checkIsAdmin(uid!);
                if (!cancelled) setIsAdmin(result);
            } catch (err) {
                console.error('[useAdmin] Failed to check admin status:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        check();

        return () => { cancelled = true; };
    }, [uid]);

    const setOverride = useCallback(async (placeId: string, busyPercent: number) => {
        await setAdminOverride(placeId, busyPercent);
    }, []);

    const clearOverride = useCallback(async (placeId: string) => {
        await removeAdminOverride(placeId);
    }, []);

    return { isAdmin, isLoading, setOverride, clearOverride };
}
