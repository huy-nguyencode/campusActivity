import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { CheckIn, BusyLevel, LocationState } from '@/types';
import { CONFIG } from '@/constants/config';
import { getCurrentUserUID, signInAnon } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CheckInLocationPayload {
    latitude: number;
    longitude: number;
    accuracy: number;
}

interface SubmitCheckinRequest {
    placeId: string;
    level: BusyLevel;
    location: CheckInLocationPayload;
}

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

function toLocationPayload(location: LocationState): CheckInLocationPayload {
    if (location.accuracy == null) {
        throw new Error('Location accuracy is required before checking in.');
    }

    return {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
    };
}

function getCheckInErrorMessage(error: Error & { code?: string }): string {
    switch (error.code) {
        case 'functions/invalid-argument':
            return 'Your location or check-in details were invalid. Please try again.';
        case 'functions/failed-precondition':
            return error.message || 'You must be nearby with accurate GPS to check in.';
        case 'functions/unauthenticated':
            return 'Please sign in again before checking in.';
        case 'functions/not-found':
            return 'This place could not be found.';
        default:
            return 'Check-in failed. Please try again.';
    }
}

export async function submitCheckin(
    placeId: string,
    level: BusyLevel,
    location: LocationState
): Promise<CheckIn | null> {
    let uid = await getCurrentUserUID();
    if (!uid) {
        try {
            await signInAnon();
            uid = await getCurrentUserUID();
        } catch (error) {
            console.error('Error signing in anonymously:', error);
        }
    }

    if (!uid) {
        throw new Error('Not authenticated. Please try again.');
    }

    if (await isOnCoolDown(placeId)) return null;

    try {
        const submitCheckinCall = httpsCallable<SubmitCheckinRequest, SubmitCheckinResponse>(
            functions,
            'submitCheckin'
        );

        const response = await submitCheckinCall({
            placeId,
            level,
            location: toLocationPayload(location),
        });
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
                return null;
            }

            throw new Error(getCheckInErrorMessage(functionError));
        }

        console.error('Error submitting check-in:', error);
        throw new Error(getCheckInErrorMessage(functionError));
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
