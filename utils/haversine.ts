// utils/haversine.ts
// Calculate distance between two geographic coordinates
//
// LEARNING POINT: The Haversine formula calculates the "great-circle distance"
// between two points on a sphere. Why not just Pythagorean theorem?
// Because Earth is curved! Haversine accounts for this curvature.

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two lat/lon coordinates
 * @returns Distance in meters
 */
export function haversineDistance(
  //location 1
  lat1: number,
  lon1: number,
  //location 2
  lat2: number,
  lon2: number
): number {
  //difference in latitude
  const dLat = toRadians(lat2 - lat1);
  //difference in longitude
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c; //return the distance in meters
}

/**
 * Check if two points are within a specified radius
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
}
