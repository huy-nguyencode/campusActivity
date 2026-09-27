import { useState, useEffect, useCallback } from 'react';
import { checkIsAdmin, setAdminOverride, removeAdminOverride } from '@/services/adminService';

interface UseAdminReturn {
    isAdmin: boolean;
    isLoading: boolean;
    setOverride: (placeId: string, busyPercent: number) => Promise<void>;
    clearOverride: (placeId: string) => Promise<void>;
}

export function useAdmin(uid: string | null): UseAdminReturn {
    const [checkedUid, setCheckedUid] = useState(uid);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(uid !== null);

    // Reset when the signed-in user changes. Doing this during render keeps the
    // effect below free of a synchronous setState, which the React Compiler rejects.
    if (uid !== checkedUid) {
        setCheckedUid(uid);
        setIsAdmin(false);
        setIsLoading(uid !== null);
    }

    useEffect(() => {
        if (!uid) return;

        let cancelled = false;

        checkIsAdmin(uid)
            .then((result) => {
                if (!cancelled) setIsAdmin(result);
            })
            .catch((err) => {
                console.error('[useAdmin] Failed to check admin status:', err);
                if (!cancelled) setIsAdmin(false);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

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
