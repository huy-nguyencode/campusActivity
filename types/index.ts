export interface AdminOverride {
  active: boolean;
  busyPercent: number;
  setBy: string;
  setAt: Date | null;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  location: GeoPoint;
  busyPercent: number;
  lastUpdate: Date | null;
  adminOverride: AdminOverride | null;
}

export type PlaceType = 'dining hall' | 'library' | 'gym' | 'cafe' | 'food truck' | 'study' | 'the wall' | 'bagel' | 'restaurant';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface CheckIn {
  id: string;
  placeId: string;
  level: BusyLevel;
  timestamp: Date;
  uid: string;
}

/** 1 = not busy, 2 = moderate, 3 = very busy */
export type BusyLevel = 1 | 2 | 3;

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface ProximityResult {
  place: Place;
  distance: number;
  isNearby: boolean;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

export type BusyColor = 'green' | 'yellow' | 'red';
