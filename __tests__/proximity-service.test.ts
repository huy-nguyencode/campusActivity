import { describe, it, expect } from '@jest/globals';
import {
  calculateProximityForAllPlaces,
  findNearbyPlace,
  getNearbyPlaces,
  isAccuracyGoodEnough,
} from '@/services/proximity-service';
import { CONFIG } from '@/constants/app-config';
import { LocationState, Place } from '@/types/domain';

const makePlace = (id: string, latitude: number, longitude = -74): Place => ({
  id,
  name: id,
  type: 'library',
  location: { latitude, longitude },
  busyPercent: 0,
  lastUpdate: null,
  adminOverride: null,
});

const makeLocation = (overrides: Partial<LocationState> = {}): LocationState => ({
  latitude: 40,
  longitude: -74,
  accuracy: 5,
  timestamp: 0,
  ...overrides,
});

// 0.0001 deg lat ≈ 11m, so these are ~11m / ~111m away from (40, -74)
const near = makePlace('near', 40.0001);
const far = makePlace('far', 40.001);
const farthest = makePlace('farthest', 40.01);

describe('calculateProximityForAllPlaces', () => {
  it('sorts by ascending distance', () => {
    const res = calculateProximityForAllPlaces([farthest, near, far], makeLocation());
    expect(res.map(r => r.place.id)).toEqual(['near', 'far', 'farthest']);
  });

  it('flags isNearby based on CHECK_IN_RADIUS', () => {
    const res = calculateProximityForAllPlaces([near, far], makeLocation());
    expect(res[0].distance).toBeLessThanOrEqual(CONFIG.CHECK_IN_RADIUS);
    expect(res[0].isNearby).toBe(true);
    expect(res[1].isNearby).toBe(false);
  });

  it('returns [] for no places and does not mutate input', () => {
    expect(calculateProximityForAllPlaces([], makeLocation())).toEqual([]);
    const input = [farthest, near];
    calculateProximityForAllPlaces(input, makeLocation());
    expect(input.map(p => p.id)).toEqual(['farthest', 'near']);
  });
});

describe('getNearbyPlaces / findNearbyPlace', () => {
  it('only returns places within the radius', () => {
    expect(getNearbyPlaces([far, near, farthest], makeLocation())).toEqual([near]);
  });

  it('findNearbyPlace returns the closest nearby place', () => {
    const nearer = makePlace('nearer', 40.00005);
    expect(findNearbyPlace([near, nearer], makeLocation())).toBe(nearer);
  });

  it('findNearbyPlace returns null when nothing is close', () => {
    expect(findNearbyPlace([far, farthest], makeLocation())).toBeNull();
  });
});

describe('isAccuracyGoodEnough', () => {
  it('accepts accuracy at or below the threshold', () => {
    expect(isAccuracyGoodEnough(makeLocation({ accuracy: CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN }))).toBe(true);
    expect(isAccuracyGoodEnough(makeLocation({ accuracy: 5 }))).toBe(true);
  });

  it('rejects accuracy above the threshold', () => {
    expect(isAccuracyGoodEnough(makeLocation({ accuracy: CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN + 1 }))).toBe(false);
  });

  it('rejects null accuracy', () => {
    expect(isAccuracyGoodEnough(makeLocation({ accuracy: null }))).toBe(false);
  });

  // Documents a likely bug: `!0` is true, so a perfect 0m accuracy is rejected.
  it('currently rejects accuracy of exactly 0 (falsy check)', () => {
    expect(isAccuracyGoodEnough(makeLocation({ accuracy: 0 }))).toBe(false);
  });
});
