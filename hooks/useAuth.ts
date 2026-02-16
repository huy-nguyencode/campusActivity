import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInAnon, subscribeToAuthState } from '@/services/authService';

/**
 * Custom hook for managing user authentication state.
 * 
 * This hook listens for changes in the authentication state and signs in
 * the user anonymously if they are not authenticated.
 * 
 * @returns An object containing the user, loading state, and error.
 * @example
 * const { user, isLoading, error } = useAuth();
 * if (isLoading) {
 *   return <LoadingScreen />;
 * }
 * if (error) {
 *   return <ErrorScreen error={error} />;
 * }
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
            //already have a user, so no need to sign in anonymously
            if (firebaseUser) {
                setUser(firebaseUser);
                setError(null);
                setIsLoading(false);
            } else {
                try {
                    setIsLoading(true);
                    /**
                     * LEARNING POINT: Belt-and-Suspenders Auth Pattern
                     *
                     * signInAnon() triggers onAuthStateChanged, which will
                     * call this callback again with the new user. So in theory
                     * we don't need to call setUser here — the listener handles it.
                     *
                     * BUT: if the listener fires before this await resolves, or
                     * if there's a race condition / network hiccup where the
                     * callback doesn't fire promptly, the app would be stuck on
                     * a loading spinner forever. Explicitly setting the user here
                     * is a safety net: if the listener already set it, React
                     * deduplicates the identical state; if it didn't, we recover.
                     */
                    const newUser = await signInAnon();
                    setUser(newUser);
                    setIsLoading(false);
                } catch (error) {
                    setError((error as Error).message);
                    setIsLoading(false);
                }
            }
        });
        return unsubscribe;
    }, []);

    return {
        user,
        uid: user?.uid ?? null,
        isLoading,
        error,
    };
}