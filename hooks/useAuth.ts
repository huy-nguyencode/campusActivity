import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInAnon, subscribeToAuthState } from '@/services/auth';

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
                    const newUser = await signInAnon();
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