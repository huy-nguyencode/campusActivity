import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInAnon, subscribeToAuthState } from '@/services/auth';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setError(null);
                setIsLoading(false);
            } else {
                try {
                    setIsLoading(true);
                    await signInAnon();
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
