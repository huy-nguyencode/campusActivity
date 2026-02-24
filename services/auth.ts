import { auth } from '@/config/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

export async function signInAnon(): Promise<User> {
    const result = await signInAnonymously(auth);
    return result.user;
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}

export function getCurrentUserUID(): string | null {
    return auth.currentUser?.uid ?? null;
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}
