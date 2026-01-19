# Campus Pulse MVP - Implementation Plan

## Overview
Build a privacy-focused mobile app showing real-time crowd levels at campus locations. Users check in anonymously, and the app aggregates data to show color-coded busyness indicators.

---

## Phase 1: Project Setup ✅ COMPLETE

### 1.1 Install Dependencies ✅
```bash
npx expo install firebase expo-location @react-native-async-storage/async-storage react-native-maps
```

### 1.2 Firebase Setup ✅
- [x] Create Firebase project at console.firebase.google.com
- [x] Enable Anonymous Authentication
- [x] Create Firestore database (test mode initially)
- [x] Copy web config credentials

### 1.3 Files to Create ✅
| File | Purpose | Status |
|------|---------|--------|
| `config/firebase.ts` | Firebase init with offline persistence | ✅ |
| `types/index.ts` | TypeScript interfaces (Place, CheckIn, LocationState) | ✅ |
| `constants/config.ts` | App constants (3m radius, 90min cooldown, etc.) | ✅ |
| `utils/haversine.ts` | Distance calculation function | ✅ |

### 1.4 Update app.json ✅
- [x] Add location permission strings for iOS/Android
- [x] Add expo-location plugin

---

## Phase 2: Core Services ✅ COMPLETE

| File | Purpose | Status |
|------|---------|--------|
| `services/auth.ts` | Anonymous sign-in, auth state listener | ✅ |
| `services/location.ts` | Permission handling, location watching | ✅ |
| `services/checkin.ts` | Submit check-ins, manage cooldowns | ✅ |
| `services/places.ts` | Firestore real-time subscription for places | ✅ |
| `services/proximity.ts` | Calculate distance to POIs, find nearby places | ✅ |

---

## Phase 3: React Hooks

| Hook | Purpose |
|------|---------|
| `hooks/useAuth.ts` | Auth state management, auto sign-in |
| `hooks/useLocation.ts` | Location tracking with permission flow |
| `hooks/usePlaces.ts` | Real-time places subscription |
| `hooks/useProximity.ts` | Combine location + places for nearby detection |
| `hooks/useCheckIn.ts` | Check-in submission with cooldown state |

---

## Phase 4: Navigation & Screens

### Structure
```
app/
├── _layout.tsx           # Root layout with AuthProvider
├── index.tsx             # Entry - redirect based on auth/permission
├── (auth)/
│   └── welcome.tsx       # Location permission request
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator (2 tabs)
│   ├── index.tsx         # Map view with POI markers
│   └── places.tsx        # Manual place picker list
└── place/
    └── [id].tsx          # Check-in modal (emoji buttons)
```

### Screen Details
1. **welcome.tsx** - Request location permission, explain privacy
2. **(tabs)/index.tsx** - Map with colored markers, current location
3. **(tabs)/places.tsx** - Scrollable list fallback if location denied
4. **place/[id].tsx** - Check-in UI with 3 emoji buttons, cooldown timer

---

## Phase 5: UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PlaceMarker` | `components/map/` | Colored marker (green/yellow/red) |
| `CheckInButtons` | `components/checkin/` | 3 emoji buttons |
| `CooldownTimer` | `components/checkin/` | Minutes remaining display |
| `StaleIndicator` | `components/checkin/` | "Data may be stale" badge |
| `PlaceCard` | `components/places/` | List item with busyness color |

---

## Phase 6: Cloud Function

Create `functions/` directory with Firebase Functions:

**aggregateBusyPercent.ts** - Scheduled every 5 minutes:
1. Load check-ins from last 90 minutes
2. Apply exponential decay (30-min half-life)
3. Calculate weighted average per place
4. Normalize to 0-100 busyPercent
5. Write back to places collection

---

## Phase 7: Security & Polish

### Firestore Rules
- `places`: read-only for clients, write by Cloud Functions only
- `checkins`: authenticated users can create (with validation)

### Final Tasks
- Add loading states and error handling
- Test offline behavior
- Add accessibility labels to buttons
- Test on iOS and Android

---

## Implementation Order

1. **Setup** - Dependencies, Firebase config, types, constants
2. **Services** - auth → location → places → proximity → checkin
3. **Hooks** - useAuth → useLocation → usePlaces → useProximity
4. **Screens** - _layout → welcome → tabs/index (map) → place/[id]
5. **Components** - PlaceMarker → CheckInButtons → CooldownTimer
6. **Backend** - Cloud Function → Firestore rules → seed POI data
7. **Polish** - Error handling, loading states, accessibility

---

## Key Files to Modify/Create

### New Files
- `config/firebase.ts`
- `types/index.ts`
- `constants/config.ts`
- `utils/haversine.ts`
- `services/auth.ts`
- `services/location.ts`
- `services/places.ts`
- `services/checkin.ts`
- `services/proximity.ts`
- `hooks/useAuth.ts`
- `hooks/useLocation.ts`
- `hooks/usePlaces.ts`
- `hooks/useProximity.ts`
- `app/(auth)/welcome.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/places.tsx`
- `app/place/[id].tsx`
- `components/map/PlaceMarker.tsx`
- `components/checkin/CheckInButtons.tsx`
- `data/places.json` (seed data)
- `functions/src/aggregateBusyPercent.ts`
- `firestore.rules`

### Modify
- `app/_layout.tsx` - Add AuthProvider wrapper
- `app/index.tsx` - Add redirect logic
- `app.json` - Add location permissions
- `constants/theme.ts` - Add busy colors (green/yellow/red)

---

## Verification

### Manual Testing Checklist
- [ ] App loads and signs in anonymously
- [ ] Location permission prompt appears on welcome screen
- [ ] Map shows all POI markers with correct colors
- [ ] Markers update in real-time when busyPercent changes
- [ ] Check-in buttons appear when within 30m of a place
- [ ] Buttons disabled when GPS accuracy > 15m
- [ ] Check-in submission shows success feedback
- [ ] Cooldown timer appears (90 min countdown)
- [ ] Cannot check in again until cooldown expires
- [ ] Manual place picker works when location denied
- [ ] App works offline (shows cached data)
- [ ] Queued check-ins sync when back online

### Run Commands
```bash
npm start              # Start Expo dev server
npm run ios            # Test on iOS simulator
npm run android        # Test on Android emulator
```
