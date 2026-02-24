export const CONFIG = {
    CHECK_IN_RADIUS: 50,                         // meters
    LOCATION_UPDATE_INTERVAL: 5000,              // milliseconds
    MINIMUM_DISTANCE_TO_UPDATE_LOCATION: 10,     // meters
    MINIMUM_ACCURACY_TO_UPDATE_LOCATION: 10,     // meters
    MINIMUM_ACCURACY_TO_CHECK_IN: 30,            // meters
    CHECK_IN_COOLDOWN: 90,                       // minutes
    STALE_CROWD_THRESHOLD: 90,                   // minutes
    BUSY_THRESHOLDS: {
        GREEN: 30,  // %
        YELLOW: 60, // %
    },
} as const;

export { BUSY_COLORS } from './theme';

export const BUSY_LEVEL_ICONS = {
    GREEN: '😊',
    YELLOW: '😟',
    RED: '🤬',
} as const;

export const LEVEL_TO_PERCENT: Record<1 | 2 | 3, number> = {
    1: 0,
    2: 50,
    3: 100,
};
