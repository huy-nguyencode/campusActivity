import { useSyncExternalStore } from 'react';
import { User } from 'firebase/auth';
import { signInAnon, subscribeToAuthState } from '@/services/auth-service';

interface AuthSnapshot {
    user: User | null;
    isLoading: boolean;
    hasResolved: boolean;
    error: string | null;
}

let authSnapshot: AuthSnapshot = {
    user: null,
    isLoading: true,
    hasResolved: false,
    error: null,
};

function getSignInErrorMessage(error: unknown): string {
    const code = (error as { code?: string } | null)?.code;
    if (code === 'auth/network-request-failed') {
        return 'No internet connection. Connect to a network and try again.';
    }
    return 'Sign-in failed. Please try again.';
}

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
                hasResolved: true,
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
            ...authSnapshot,
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
                    error: getSignInErrorMessage(error),
                    isLoading: false,
                    hasResolved: true,
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

async function retrySignIn(): Promise<void> {
    if (signInPromise || authSnapshot.user) {
        return;
    }

    authSnapshot = {
        ...authSnapshot,
        isLoading: true,
        error: null,
    };
    emitChange();

    signInPromise = signInAnon()
        .then(() => undefined)
        .catch((error) => {
            authSnapshot = {
                user: null,
                error: getSignInErrorMessage(error),
                isLoading: false,
                hasResolved: true,
            };
            emitChange();
        })
        .finally(() => {
            signInPromise = null;
        });

    await signInPromise;
}

export function useAuth() {
    const { user, isLoading, hasResolved, error } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        user,
        uid: user?.uid ?? null,
        isLoading,
        hasResolved,
        error,
        retrySignIn,
    };
}
