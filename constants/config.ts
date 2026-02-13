// centralize all constants / magic numbers for the app
//benefit: 1. more readable code 2. change one value in one place 3. easier to test


// location related constants
export const CONFIG = {
    // how far away from the place can you check in
    CHECK_IN_RADIUS: 3, // meters (~10 feet)
    // how often to update location
    LOCATION_UPDATE_INTERVAL: 5000, // milliseconds
    // minimum distance to update location
    MINIMUM_DISTANCE_TO_UPDATE_LOCATION: 10, // meters
    // minimum accuracy to update location
    MINIMUM_ACCURACY_TO_UPDATE_LOCATION: 10, // meters
    // minimum accuracy to check in
    MINIMUM_ACCURACY_TO_CHECK_IN: 10, // meters
    //cooldown time for check in
    CHECK_IN_COOLDOWN: 90, // minutes

    //show if a crowd is stale
    STALE_CROWD_THRESHOLD: 90, // minutes

    BUSY_THRESHOLDS: {
        GREEN: 30, // %
        YELLOW: 60, // %
        //above yellow is red
    },
} as const;

// Re-export busy colors from theme for consistency
// This maintains backward compatibility while using the new design system
export { BUSY_COLORS } from './theme';


//emoji icons for busyness levels
export const BUSY_LEVEL_ICONS = {
    GREEN: '😊',
    YELLOW: '😟',
    RED: '🤬',
} as const;
