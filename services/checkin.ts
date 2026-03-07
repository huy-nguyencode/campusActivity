import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { CheckIn, BusyLevel } from '@/types';
import { CONFIG } from '@/constants/config';
import { getCurrentUserUID } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubmitCheckinResponse {
    id: string;
    placeId: string;
    level: BusyLevel;
    timestamp: string;
    uid: string;
}

interface CooldownDetails {
    cooldownEndsAt?: string;
}

export async function submitCheckin(placeId: string, level: BusyLevel): Promise<CheckIn | null> {
    const uid = await getCurrentUserUID();
    if (!uid) return null;

    if (await isOnCoolDown(placeId)) return null;

    try {
        const submitCheckinCall = httpsCallable<{ placeId: string; level: BusyLevel }, SubmitCheckinResponse>(
            functions,
            'submitCheckin'
        );

        const response = await submitCheckinCall({ placeId, level });
        const timestampDate = new Date(response.data.timestamp);

        await setCooldown(placeId, timestampDate);

        return {
            id: response.data.id,
            placeId: response.data.placeId,
            level: response.data.level,
            timestamp: timestampDate,
            uid: response.data.uid,
        };
    } catch (error) {
        const functionError = error as Error & { code?: string; details?: CooldownDetails };

        if (functionError.code === 'functions/failed-precondition') {
            const cooldownEndsAt = functionError.details?.cooldownEndsAt;
            if (cooldownEndsAt) {
                const cooldownEndDate = new Date(cooldownEndsAt);
                const lastCheckInDate = new Date(cooldownEndDate.getTime() - CONFIG.CHECK_IN_COOLDOWN * 60000);
                await setCooldown(placeId, lastCheckInDate);
            }
        }

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

async function setCooldown(placeId: string, lastCheckInAt: Date = new Date()): Promise<void> {
    try {
        const storageKey = getCooldownStorageKey(placeId);
        await AsyncStorage.setItem(storageKey, lastCheckInAt.toISOString());
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
