import { describe, it, expect } from '@jest/globals';
import { haversineDistance, isWithinRadius } from '@/utils/geo-distance';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(40.5, -74.4, 40.5, -74.4)).toBe(0);
  });

  it('is symmetric', () => {
    const ab = haversineDistance(40.5, -74.4, 40.6, -74.5);
    const ba = haversineDistance(40.6, -74.5, 40.5, -74.4);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it('computes ~111.2km per degree of latitude', () => {
    expect(haversineDistance(0, 0, 1, 0)).toBeCloseTo(111_195, -2);
  });

  it('computes a known city pair (NYC -> LA ~3936km)', () => {
    const d = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(d / 1000).toBeGreaterThan(3900);
    expect(d / 1000).toBeLessThan(3980);
  });
});

describe('isWithinRadius', () => {
  // ~0.00045 degrees latitude ≈ 50m
  it('is true inside the radius', () => {
    expect(isWithinRadius(40, -74, 40.0002, -74, 50)).toBe(true);
  });

  it('is false outside the radius', () => {
    expect(isWithinRadius(40, -74, 40.001, -74, 50)).toBe(false);
  });

  it('is inclusive at exactly the boundary', () => {
    const d = haversineDistance(40, -74, 40.0003, -74);
    expect(isWithinRadius(40, -74, 40.0003, -74, d)).toBe(true);
  });
});
