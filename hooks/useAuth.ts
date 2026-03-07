import { useSyncExternalStore } from 'react';
import { User } from 'firebase/auth';
import { signInAnon, subscribeToAuthState } from '@/services/auth';

interface AuthSnapshot {
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

let authSnapshot: AuthSnapshot = {
    user: null,
    isLoading: true,
    error: null,
};

const listeners = new Set<() => void>();
let authUnsubscribe: (() => void) | null = null;
let signInPromise: Promise<void> | null = null;

function emitChange() {
    listeners.forEach((listener) => listener());
}

function ensureAuthSubscription() {
    if (authUnsubscribe) {
        return;
    }

    authUnsubscribe = subscribeToAuthState(async (firebaseUser) => {
        if (firebaseUser) {
            authSnapshot = {
                user: firebaseUser,
                error: null,
                isLoading: false,
            };
            emitChange();
            return;
        }

        if (signInPromise) {
            authSnapshot = {
                ...authSnapshot,
                isLoading: true,
            };
            emitChange();
            return;
        }

        authSnapshot = {
            user: null,
            error: null,
            isLoading: true,
        };
        emitChange();

        signInPromise = signInAnon()
            .then(() => undefined)
            .catch((error) => {
                authSnapshot = {
                    user: null,
                    error: (error as Error).message,
                    isLoading: false,
                };
                emitChange();
            })
            .finally(() => {
                signInPromise = null;
            });
    });
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    ensureAuthSubscription();

    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot() {
    return authSnapshot;
}

export function useAuth() {
    const { user, isLoading, error } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        user,
        uid: user?.uid ?? null,
        isLoading,
        error,
    };
}
