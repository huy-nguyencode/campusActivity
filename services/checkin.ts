/**
 * Check-in Service
 *
 * Handles user check-ins to campus locations using Firebase Firestore.
 * Implements a cooldown system using AsyncStorage to prevent spam submissions.
 *
 * @module services/checkin
 */
import {db} from '@/config/firebase';
import {collection, addDoc, serverTimestamp, getDoc, doc, Timestamp} from 'firebase/firestore';
import {CheckIn, BusyLevel} from '@/types';
import { CONFIG } from '@/constants/config';
import {getCurrentUserUID} from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


/**
 * Create a new check-in for a place with a busy-level rating and start a per-place cooldown for the current user.
 *
 * @param placeId - The unique identifier of the place being checked into
 * @param level - The user's assessment of how busy the location is
 * @returns The created `CheckIn` object when successful, `null` otherwise
 */
export async function submitCheckin(placeId: string, level: BusyLevel): Promise<CheckIn | null> {
        //get user uid
        const uid = await getCurrentUserUID();
        //if no uid, return null
        if (!uid) {
            return null;
        }
        //check if cooldown is active
        if (await isOnCoolDown(placeId)) {
            return null;
        }
    try {
        //add check-in to firestore
        const checkInRef = await addDoc(collection(db, 'checkins'), {
            placeId,
            level,
            timestamp: serverTimestamp(),
            uid,
        });
        //read the document back to get the server-set timestamp
        const checkInDoc = await getDoc(checkInRef);
        if (!checkInDoc.exists()) {
            console.error('Check-in document not found after creation');
            return null;
        }
        //extract the server timestamp from the document
        const data = checkInDoc.data();
        const timestampValue = data.timestamp;
        //convert Firestore Timestamp to JavaScript Date
        const timestampDate = timestampValue instanceof Timestamp 
            ? timestampValue.toDate() 
            : new Date(timestampValue);
        //set cooldown
        await setCooldown(placeId);
        //return the check-in with server-set timestamp
        return {
            id: checkInRef.id,
            placeId,
            level,
            timestamp: timestampDate,
            uid,
        };
         
    } catch (error) {
        console.error('Error submitting check-in:', error);
        return null;
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
 * Determines whether the current user is within the cooldown period for a given place.
 *
 * @param placeId - The unique identifier of the place to check.
 * @returns `true` if the user is still on cooldown for the place, `false` otherwise. Returns `false` on error.
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
 * Record the current time as the cooldown timestamp for a specific place.
 *
 * The stored timestamp is used to prevent repeated check-ins for that place within the configured cooldown period.
 *
 * @param placeId - The unique identifier of the place to set the cooldown for
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
 * Retrieve the last check-in timestamp for a specific place.
 *
 * @param placeId - The unique identifier of the place
 * @returns The `Date` of the last check-in, or `null` if no timestamp is stored or an error occurs
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



