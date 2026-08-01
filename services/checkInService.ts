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

export type SubmitCheckinResult =
    | { status: 'success'; checkIn: CheckIn }
    | { status: 'cooldown'; cooldownEndsAt: Date };

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

function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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

function extractCooldownEndsAt(error: Error & { details?: unknown; customData?: unknown }): string | undefined {
    const details = error.details ?? error.customData;
    if (!details || typeof details !== 'object') {
        return undefined;
    }

    return (details as CooldownDetails).cooldownEndsAt;
}

export async function submitCheckin(
    placeId: string,
    level: BusyLevel,
    location: LocationState
): Promise<SubmitCheckinResult> {
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

    const existingCooldownEnd = await getCooldownEndTime(placeId);
    if (existingCooldownEnd) {
        return { status: 'cooldown', cooldownEndsAt: existingCooldownEnd };
    }

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
            status: 'success',
            checkIn: {
                id: response.data.id,
                placeId: response.data.placeId,
                level: response.data.level,
                timestamp: timestampDate,
                uid: response.data.uid,
            },
        };
    } catch (error) {
        const functionError = error as Error & { code?: string; details?: unknown; customData?: unknown };

        if (functionError.code === 'functions/failed-precondition') {
            const cooldownEndsAt = extractCooldownEndsAt(functionError);
            if (cooldownEndsAt) {
                const cooldownEndDate = parseDate(cooldownEndsAt);
                if (cooldownEndDate) {
                    const lastCheckInDate = new Date(
                        cooldownEndDate.getTime() - CONFIG.CHECK_IN_COOLDOWN * 60000
                    );
                    await setCooldown(placeId, lastCheckInDate);
                    return { status: 'cooldown', cooldownEndsAt: cooldownEndDate };
                }
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
    const endTime = await getCooldownEndTime(placeId);
    return endTime !== null;
}

export async function getCooldownEndTime(placeId: string): Promise<Date | null> {
    try {
        const lastCheckIn = await getCooldown(placeId);
        if (!lastCheckIn) return null;

        const coolDownTime = lastCheckIn.getTime() + CONFIG.CHECK_IN_COOLDOWN * 60000;
        if (coolDownTime <= Date.now()) {
            return null;
        }

        return new Date(coolDownTime);
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return null;
    }
}

async function setCooldown(placeId: string, lastCheckInAt: Date = new Date()): Promise<void> {
    try {
        if (Number.isNaN(lastCheckInAt.getTime())) {
            return;
        }

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
        const parsed = parseDate(cooldown);

        if (cooldown && !parsed) {
            await AsyncStorage.removeItem(storageKey);
        }

        return parsed;
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
