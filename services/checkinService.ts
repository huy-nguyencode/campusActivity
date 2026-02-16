/**
 * Check-in Service
 *
 * Handles user check-ins to campus locations using Firebase Firestore.
 * Implements a cooldown system using AsyncStorage to prevent spam submissions.
 *
 * @module services/checkin
 */
import {db} from '@/config/firebase';
import {collection, addDoc, serverTimestamp, getDoc, setDoc, doc, Timestamp, writeBatch} from 'firebase/firestore';
import {CheckIn, BusyLevel} from '@/types';
import { CONFIG } from '@/constants/appConfig';
import {getCurrentUserUID} from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';


/**
 * Submits a check-in for a specific location with a busy level rating.
 *
 * Creates a new check-in document in Firestore and sets a cooldown to prevent
 * the same user from submitting multiple check-ins for the same place in quick succession.
 *
 * @param placeId - The unique identifier of the place being checked into
 * @param level - The user's assessment of how busy the location is
 * @returns The created CheckIn object if successful, null if:
 *          - User is not authenticated
 *          - User is on cooldown for this place
 *          - Firestore write fails
 *
 * @example
 * const checkIn = await submitCheckin('library-main', 'moderate');
 * if (checkIn) {
 *   console.log('Check-in submitted:', checkIn.id);
 * }
 */
/**
 * LEARNING POINT: Result Type Pattern
 *
 * Instead of returning null for every failure, we return a discriminated
 * union that tells the caller WHY it failed. This lets the UI show
 * specific messages ("you're on cooldown" vs "not authenticated" vs
 * "network error") instead of a generic "something went wrong."
 */
export type CheckInResult =
    | { success: true; checkIn: CheckIn }
    | { success: false; reason: 'not_authenticated' | 'on_cooldown' | 'error'; message: string };

export async function submitCheckin(placeId: string, level: BusyLevel): Promise<CheckInResult> {
        //get user uid
        const uid = getCurrentUserUID();
        //if no uid, return error with reason
        if (!uid) {
            return { success: false, reason: 'not_authenticated', message: 'You must be signed in to check in.' };
        }
        //check if cooldown is active (client-side fast check)
        if (await isOnCoolDown(placeId)) {
            return { success: false, reason: 'on_cooldown', message: 'You recently checked in here. Please wait before checking in again.' };
        }
    try {
        /**
         * LEARNING POINT: Batched Writes for Atomic Multi-Document Operations
         *
         * We need to write TWO documents atomically:
         * 1. The check-in itself (in 'checkins' collection)
         * 2. A cooldown lock (in 'cooldowns' collection)
         *
         * writeBatch() ensures both writes succeed or both fail.
         * The Firestore security rule on 'checkins' reads the lock
         * document to verify cooldown server-side — so even if a
         * malicious client skips the AsyncStorage check above,
         * the server rejects the write.
         *
         * The lock document ID is {uid}__{placeId} so the rule can
         * find it with a predictable get() path.
         */
        const batch = writeBatch(db);

        // 1. Create the check-in document
        const checkInRef = doc(collection(db, 'checkins'));
        batch.set(checkInRef, {
            placeId,
            level,
            timestamp: serverTimestamp(),
            uid,
        });

        // 2. Write (or overwrite) the cooldown lock document
        const lockId = `${uid}__${placeId}`;
        const lockRef = doc(db, 'cooldowns', lockId);
        batch.set(lockRef, {
            placeId,
            uid,
            timestamp: serverTimestamp(),
        });

        // Commit both writes atomically
        await batch.commit();

        //set local cooldown (fast client-side check for next time)
        await setCooldown(placeId);

        //read the check-in document back to get the server-set timestamp
        const checkInDoc = await getDoc(checkInRef);
        if (!checkInDoc.exists()) {
            console.error('Check-in document not found after creation');
            return { success: false, reason: 'error', message: 'Check-in was saved but could not be confirmed.' };
        }
        //extract the server timestamp from the document
        const data = checkInDoc.data();
        const timestampValue = data.timestamp;
        //convert Firestore Timestamp to JavaScript Date
        const timestampDate = timestampValue instanceof Timestamp
            ? timestampValue.toDate()
            : new Date(timestampValue);

        //return the check-in with server-set timestamp
        return {
            success: true,
            checkIn: {
                id: checkInRef.id,
                placeId,
                level,
                timestamp: timestampDate,
                uid,
            },
        };

    } catch (error) {
        console.error('Error submitting check-in:', error);
        return { success: false, reason: 'error', message: 'Failed to submit check-in. Please try again.' };
    }
}

/**
 * Generates a unique AsyncStorage key for a place's cooldown timestamp.
 *
 * @param placeId - The unique identifier of the place
 * @returns A namespaced storage key in the format `checkin_cooldown_{placeId}`
 */
function getCooldownStorageKey(placeId: string): string {
    return `checkin_cooldown_${placeId}`;
}

/**
 * Checks if the user is currently on cooldown for a specific place.
 *
 * Compares the stored last check-in timestamp against the configured cooldown
 * duration (defined in CONFIG.CHECK_IN_COOLDOWN in minutes).
 *
 * @param placeId - The unique identifier of the place to check
 * @returns True if cooldown is active (user cannot check in), false otherwise.
 *          Also returns false if an error occurs (fail-open behavior).
 */
export async function isOnCoolDown(placeId: string): Promise<boolean> {
    try {
        //create a storage key
        const storageKey = getCooldownStorageKey(placeId);
        //check stored timestamp
        const lastCheckin = await AsyncStorage.getItem(storageKey);
        // no previous checkin, return false
        if (!lastCheckin) {
            return false;
        }
        //convert to a date
        const lastCheckinDate = new Date(lastCheckin);
        //check if cooldown is over by comparing with current time and cooldown time
        const coolDownTime = lastCheckinDate.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000;
        const isOnCoolDown = coolDownTime > Date.now(); //if coolDownTime is in the future, return true
        return isOnCoolDown;
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return false;
    }
}

/**
 * Sets a cooldown timestamp for a place after a successful check-in.
 *
 * Stores the current timestamp in AsyncStorage. This timestamp is later
 * compared by isOnCoolDown() to determine if the user can submit another check-in.
 *
 * @param placeId - The unique identifier of the place to set cooldown for
 */
async function setCooldown(placeId: string): Promise<void> {
    try {
        //create a storage key
        const storageKey = getCooldownStorageKey(placeId);
        //get the current time
        const currentTime = new Date();
        //set the cooldown
        await AsyncStorage.setItem(storageKey, currentTime.toISOString());
    } catch (error) {
        console.error('Error setting cooldown:', error);
        return;
    }
}

/**
 * Retrieves the last check-in timestamp for a specific place.
 *
 * Useful for displaying to users when they last checked in or
 * calculating remaining cooldown time.
 *
 * @param placeId - The unique identifier of the place
 * @returns The Date of the last check-in, or null if no check-in exists or an error occurs
 */
export async function getCooldown(placeId: string): Promise<Date | null> {
    try {
        //create a storage key
        const storageKey = getCooldownStorageKey(placeId);
        //get the cooldown
        const cooldown = await AsyncStorage.getItem(storageKey);
        //if no cooldown, return null
        if (!cooldown) {
            return null;
        }
        //convert to a date
        const cooldownDate = new Date(cooldown);
        return cooldownDate;   
    }
    catch (error) {
        console.error('Error getting cooldown:', error);
        return null;
    }
}

/**
 * Clears the cooldown for a specific place.
 *
 * Primarily intended for testing purposes to reset state between tests.
 * Removes the stored timestamp from AsyncStorage, allowing immediate check-in.
 *
 * @param placeId - The unique identifier of the place to clear cooldown for
 */
export async function clearCooldown(placeId: string): Promise<void> {
    try {
        //get the storage key
        const storageKey = getCooldownStorageKey(placeId);
        //clear the cooldown
        await AsyncStorage.removeItem(storageKey);
    }
    catch (error) {
        console.error('Error clearing cooldown:', error);
        return;
    }
}




