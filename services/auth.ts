/* anonymous authentication service using firebase anonymous auth
this service will be used to authenticate users anonymously by creating a unique device id and using it to authenticate users.
This UID will be reused across sessions. It also allows us to identify users across devices, rate-limit check-ins, without storing any user data.
a reinstall of the app will create a new UID. 
*/

import { auth } from '@/config/firebase';
import {signInAnonymously, onAuthStateChanged, User} from 'firebase/auth';

// this function will be called when the app starts up
export async function signInAnon(): Promise<User> {
    const result = await signInAnonymously(auth);
    return result.user;
}

//get the current user
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

//get the current user's UID
export function getCurrentUserUID(): string | null {
    return auth.currentUser?.uid ?? null;
}

//listen for changes in the auth state
export function subscribeToAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}