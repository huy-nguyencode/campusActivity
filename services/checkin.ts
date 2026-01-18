/* checkin service using firebase firestore
this service will be used to submit check-ins to the checkins collection
*/
import {db} from '@/config/firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import {CheckIn, BusyLevel} from '@/types';
import { CONFIG } from '@/constants/config';
import {getCurrentUserUID} from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


//user submit check-in
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
        const checkIn = await addDoc(collection(db, 'checkins'), {
            placeId,
            level,
            timestamp: serverTimestamp(),
            uid,
        });
        //set cooldown
        await setCooldown(placeId);
        //return the check-in
        return {
            id: checkIn.id,
            placeId,
            level,
            timestamp: new Date(),
            uid,
        };
         
    } catch (error) {
        console.error('Error submitting check-in:', error);
        return null;
    }
}

function getCooldownStorageKey(placeId: string): string {
    return `checkin_cooldown_${placeId}`;
}

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

//clear cooldown (for testing)
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




