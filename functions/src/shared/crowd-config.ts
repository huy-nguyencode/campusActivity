export const CROWD_CONFIG = {
    CHECKIN_WINDOW_MINUTES: 90,
    HALF_LIFE_MINUTES: 30,
    CHECK_IN_RADIUS_METERS: 50,
    MINIMUM_ACCURACY_TO_CHECK_IN_METERS: 30,
    LEVEL_TO_PERCENT: {
        1: 0,
        2: 50,
        3: 100,
    } as Record<number, number>,
};

export const MAX_BATCH_OPERATIONS = 500;
