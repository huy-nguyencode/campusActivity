import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, Timestamp } from 'firebase/firestore';
import { CheckIn, BusyLevel } from '@/types';
import { CONFIG } from '@/constants/config';
import { getCurrentUserUID } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function submitCheckin(placeId: string, level: BusyLevel): Promise<CheckIn | null> {
    const uid = await getCurrentUserUID();
    if (!uid) return null;

    if (await isOnCoolDown(placeId)) return null;

    try {
        const checkInRef = await addDoc(collection(db, 'checkins'), {
            placeId,
            level,
            timestamp: serverTimestamp(),
            uid,
        });

        await setCooldown(placeId);

        const checkInDoc = await getDoc(checkInRef);
        if (!checkInDoc.exists()) {
            console.error('Check-in document not found after creation');
            return null;
        }

        const data = checkInDoc.data();
        const timestampValue = data.timestamp;
        const timestampDate = timestampValue instanceof Timestamp
            ? timestampValue.toDate()
            : new Date(timestampValue);

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

function getCooldownStorageKey(placeId: string): string {
    return `checkin_cooldown_${placeId}`;
}

export async function isOnCoolDown(placeId: string): Promise<boolean> {
    try {
        const storageKey = getCooldownStorageKey(placeId);
        const lastCheckin = await AsyncStorage.getItem(storageKey);
        if (!lastCheckin) return false;

        const lastCheckinDate = new Date(lastCheckin);
        const coolDownTime = lastCheckinDate.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000;
        return coolDownTime > Date.now();
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return false;
    }
}

async function setCooldown(placeId: string): Promise<void> {
    try {
        const storageKey = getCooldownStorageKey(placeId);
        await AsyncStorage.setItem(storageKey, new Date().toISOString());
    } catch (error) {
        console.error('Error setting cooldown:', error);
    }
}

export async function getCooldown(placeId: string): Promise<Date | null> {
    try {
        const storageKey = getCooldownStorageKey(placeId);
        const cooldown = await AsyncStorage.getItem(storageKey);
        if (!cooldown) return null;
        return new Date(cooldown);
    } catch (error) {
        console.error('Error getting cooldown:', error);
        return null;
    }
}

export async function clearCooldown(placeId: string): Promise<void> {
    try {
        const storageKey = getCooldownStorageKey(placeId);
        await AsyncStorage.removeItem(storageKey);
    } catch (error) {
        console.error('Error clearing cooldown:', error);
    }
}
