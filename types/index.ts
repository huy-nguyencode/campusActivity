// types/index.ts
// Central type definitions for Campus Pulse
//
// LEARNING POINT: TypeScript interfaces define the "shape" of your data.
// They catch errors at compile time (before your app runs) and provide
// autocomplete in your editor. This makes refactoring safer and faster.

/**
 * A campus Point of Interest (POI)
 * Stored in Firestore 'places' collection
 */
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  location: GeoPoint;
  busyPercent: number;     // 0-100, computed by Cloud Function
  lastUpdate: Date | null; // When busyPercent was last calculated
}

/**
 * Categories of campus places
 * LEARNING POINT: Union types restrict values to specific strings.
 * If you try to use 'restaurant' (not in the list), TypeScript errors.
 */
export type PlaceType = 'dining hall' | 'library' | 'gym' | 'cafe' | 'food truck';

/**
 * Geographic coordinates
 * LEARNING POINT: Separating this into its own type makes it reusable
 * and documents that location always has this exact shape.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * A user's check-in submission
 * Stored in Firestore 'checkins' collection
 */
export interface CheckIn {
  id: string;             // Firestore document ID (auto-generated on create)
  placeId: string;         // References Place.id
  level: BusyLevel;        // User's crowd assessment
  timestamp: Date;         // Server-set timestamp
  uid: string;             // Anonymous user ID (from Firebase Auth)
}

/**
 * Crowd level options for check-in
 * 0 = empty/not busy, 1 = moderate, 2 = busy/crowded
 *
 * LEARNING POINT: Using a union of literal numbers (not just 'number')
 * ensures only valid values can be used. level = 5 would error.
 */
export type BusyLevel = 1| 2| 3;

/**
 * User's current location from device GPS
 * Used only in-memory, never sent to server
 */

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null; // GPS accuracy in meters (null if unknown)
  timestamp: number;       // When this reading was taken
}

/**
 * Result of proximity calculation
 * Returned by the proximity service
 */
export interface ProximityResult {
  place: Place;
  distance: number;        // Distance in meters from user
  isNearby: boolean;       // True if within check-in radius (3 meters / ~10 feet)
}

/**
 * Location permission states
 * Maps to Expo Location permission responses
 */
export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Busyness color categories
 * Used for map markers and UI indicators
 */
export type BusyColor = 'green' | 'yellow' | 'red';

/**
 * Helper to get busy color from percentage
 * LEARNING POINT: This is a "pure function" - same input always gives same output,
 * no side effects. Pure functions are easy to test and reason about.
 */
export function getBusyColor(percent: number): BusyColor {
  if (percent <= 30) return 'green';
  if (percent <= 60) return 'yellow';
  return 'red';
}
