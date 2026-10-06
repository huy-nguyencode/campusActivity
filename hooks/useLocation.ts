import { useCallback, useSyncExternalStore } from 'react';
import { AppState, type NativeEventSubscription } from 'react-native';
import * as Location from 'expo-location';
import { LocationState, LocationPermissionStatus } from '@/types/domain';
import { checkLocationPermission, requestLocationPermission, watchLocation } from '@/services/location-service';

interface LocationSnapshot {
    location: LocationState | null;
    permission: LocationPermissionStatus;
    isLoading: boolean;
    error: string | null;
}

let locationSnapshot: LocationSnapshot = {
    location: null,
    permission: 'undetermined',
    isLoading: true,
    error: null,
};

const listeners = new Set<() => void>();
let locationSubscription: Location.LocationSubscription | null = null;
let permissionCheckPromise: Promise<void> | null = null;
let locationWatchPromise: Promise<void> | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

function emitChange() {
    listeners.forEach((listener) => listener());
}

function stopLocationWatcher() {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }
}

function updatePermissionState(permission: LocationPermissionStatus) {
    if (permission === 'denied' || permission === 'restricted') {
        stopLocationWatcher();
        locationSnapshot = {
            ...locationSnapshot,
            permission,
            location: null,
            error: permission === 'restricted'
                ? 'Location access is restricted on this device'
                : 'Location permission denied',
            isLoading: false,
        };
        emitChange();
        return;
    }

    locationSnapshot = {
        ...locationSnapshot,
        permission,
        error: null,
        isLoading: permission === 'granted' && !locationSnapshot.location,
    };
    emitChange();

    if (permission !== 'granted') {
        stopLocationWatcher();
    }
}

async function ensureLocationWatcher() {
    if (locationSnapshot.permission !== 'granted' || locationSubscription || locationWatchPromise || listeners.size === 0) {
        return;
    }

    locationSnapshot = {
        ...locationSnapshot,
        isLoading: !locationSnapshot.location,
    };
    emitChange();

    locationWatchPromise = watchLocation((nextLocation: LocationState) => {
        locationSnapshot = {
            location: nextLocation,
            permission: locationSnapshot.permission,
            isLoading: false,
            error: null,
        };
        emitChange();
    })
        .then((subscription) => {
            if (listeners.size === 0 || locationSnapshot.permission !== 'granted') {
                subscription.remove();
                return;
            }

            locationSubscription = subscription;
        })
        .catch((error) => {
            locationSnapshot = {
                ...locationSnapshot,
                location: null,
                isLoading: false,
                error: (error as Error).message,
            };
            emitChange();
        })
        .finally(() => {
            locationWatchPromise = null;
        });
}

async function ensurePermissionChecked() {
    if (permissionCheckPromise) {
        return permissionCheckPromise;
    }

    permissionCheckPromise = (async () => {
        try {
            locationSnapshot = {
                ...locationSnapshot,
                isLoading: true,
            };
            emitChange();

            const permission = await checkLocationPermission();
            updatePermissionState(permission);

            if (permission === 'granted') {
                await ensureLocationWatcher();
            }
        } catch (error) {
            locationSnapshot = {
                location: null,
                permission: 'undetermined',
                isLoading: false,
                error: (error as Error).message,
            };
            emitChange();
        } finally {
            permissionCheckPromise = null;
        }
    })();

    return permissionCheckPromise;
}

// Unlike ensurePermissionChecked, this doesn't flip isLoading, so returning
// to the app doesn't flash loading screens when nothing changed.
async function recheckPermissionOnForeground() {
    try {
        const permission = await checkLocationPermission();
        if (permission === locationSnapshot.permission) {
            return;
        }

        updatePermissionState(permission);
        if (permission === 'granted') {
            await ensureLocationWatcher();
        }
    } catch (error) {
        console.error('[useLocation] Failed to re-check permission:', error);
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    void ensurePermissionChecked();

    if (locationSnapshot.permission === 'granted') {
        void ensureLocationWatcher();
    }

    if (!appStateSubscription) {
        appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                void recheckPermissionOnForeground();
            }
        });
    }

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            stopLocationWatcher();
            appStateSubscription?.remove();
            appStateSubscription = null;
        }
    };
}

function getSnapshot() {
    return locationSnapshot;
}

export function useLocation() {
    const { location, permission, isLoading, error } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const requestPermission = useCallback(async () => {
        try {
            locationSnapshot = {
                ...locationSnapshot,
                isLoading: true,
                error: null,
            };
            emitChange();

            const permission = await requestLocationPermission();
            updatePermissionState(permission);

            if (permission === 'granted') {
                await ensureLocationWatcher();
            }
        } catch (error) {
            locationSnapshot = {
                location: null,
                permission: 'undetermined',
                isLoading: false,
                error: (error as Error).message,
            };
            emitChange();
        }
    }, []);

    return {
        location,
        permission,
        isLoading,
        error,
        requestPermission,
    };
}
