/**
 * useAdmin Hook — bridges admin service with React components
 *
 * LEARNING POINT: "Lift State Up" for Auth
 *
 * Originally this hook tried to manage its own auth listener, but
 * Firebase Auth's `onAuthStateChanged` can fire with `null` even when
 * a user is already signed in (due to async persistence restoration).
 * Instead of fighting this, we accept `uid` as a parameter — the
 * caller gets it from `useAuth`, which already resolved auth at the
 * root layout level. This is the "lift state up" pattern: let the
 * parent own the state, pass it down to children that need it.
 *
 * LEARNING POINT: useCallback for Stable References
 *
 * `setOverride` and `clearOverride` are wrapped in useCallback so their
 * identity stays the same across renders. If a child component receives
 * one of these as a prop, React.memo / PureComponent can skip re-renders
 * when nothing actually changed.
 */

import { useState, useEffect, useCallback } from 'react';
import { checkIsAdmin, setAdminOverride, removeAdminOverride } from '@/services/adminService';

interface UseAdminReturn {
    isAdmin: boolean;
    isLoading: boolean;
    setOverride: (placeId: string, busyPercent: number) => Promise<void>;
    clearOverride: (placeId: string) => Promise<void>;
}

export function useAdmin(uid: string | null): UseAdminReturn {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check admin status whenever the UID changes
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
