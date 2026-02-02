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

## Phase 3: React Hooks ✅ COMPLETE

| Hook | Purpose | Status |
|------|---------|--------|
| `hooks/useAuth.ts` | Auth state management, auto sign-in | ✅ |
| `hooks/useLocation.ts` | Location tracking with permission flow | ✅ |
| `hooks/usePlaces.ts` | Real-time places subscription | ✅ |
| `hooks/useProximity.ts` | Combine location + places for nearby detection | ✅ |
| `hooks/useCheckIn.ts` | Check-in submission with cooldown state | ✅ |

---

## Phase 4: Navigation & Screens ✅ COMPLETE

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
| Screen | Purpose | Status |
|--------|---------|--------|
| `_layout.tsx` | Root layout with auth state handling | ✅ |
| `index.tsx` | Entry redirect based on permission | ✅ |
| `(auth)/welcome.tsx` | Request location permission | ✅ |
| `(tabs)/_layout.tsx` | Tab navigator (Map + Places) | ✅ |
| `(tabs)/index.tsx` | Map with colored markers | ✅ |
| `(tabs)/places.tsx` | FlatList with place cards | ✅ |
| `place/[id].tsx` | Check-in UI with emoji buttons | ✅ |

---

## Phase 5: UI Components ✅ COMPLETE

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `PlaceMarker` | `components/map/` | Colored marker with callout | ✅ |
| `CheckInButtons` | `components/checkin/` | 3 emoji buttons with haptics | ✅ |
| `CooldownTimer` | `components/checkin/` | Auto-updating countdown | ✅ |
| `StaleIndicator` | `components/checkin/` | "Data may be stale" badge | ✅ |
| `PlaceCard` | `components/places/` | List item with busyness color | ✅ |

---

## Phase 6: Cloud Function ✅ COMPLETE

Created `functions/` directory with Firebase Functions:

**aggregateBusyPercent.ts** - Scheduled every 5 minutes: ✅
1. Load check-ins from last 90 minutes
2. Apply exponential decay (30-min half-life)
3. Calculate weighted average per place
4. Normalize to 0-100 busyPercent
5. Write back to places collection

---

## Phase 7: Security & Polish ✅ COMPLETE

### Firestore Rules ✅
- `places`: read-only for clients, write by Cloud Functions only
- `checkins`: authenticated users can create (with validation)

### Firestore Indexes ✅
- Composite index for efficient checkin queries

### Seed Data ✅
- `data/places.json` with Temple University campus locations
- `scripts/seedPlaces.ts` for database initialization

### Final Tasks ✅
- [x] Add loading states and error handling
- [x] Add accessibility labels to buttons
- [x] Component extraction for reusability
- [ ] Test offline behavior
- [ ] Test on iOS and Android

---

## Implementation Order (COMPLETED)

1. ✅ **Setup** - Dependencies, Firebase config, types, constants
2. ✅ **Services** - auth → location → places → proximity → checkin
3. ✅ **Hooks** - useAuth → useLocation → usePlaces → useProximity
4. ✅ **Screens** - _layout → welcome → tabs/index (map) → place/[id]
5. ✅ **Components** - PlaceMarker → CheckInButtons → CooldownTimer
6. ✅ **Backend** - Cloud Function → Firestore rules → seed POI data
7. ✅ **Polish** - Error handling, loading states, accessibility

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Instructions for AI assistance |
| `IMPLEMENTATION_PLAN.md` | This file - project roadmap |
| `SPEC.md` | Technical specification for junior engineers |

---

## Key Files Created

### Configuration
- `config/firebase.ts` - Firebase initialization
- `constants/config.ts` - App-wide constants
- `firebase.json` - Firebase project config
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes

### Types & Utils
- `types/index.ts` - TypeScript interfaces
- `utils/haversine.ts` - Distance calculations

### Services
- `services/auth.ts` - Authentication
- `services/location.ts` - GPS tracking
- `services/places.ts` - Firestore operations
- `services/checkin.ts` - Check-in logic
- `services/proximity.ts` - Distance detection

### Hooks
- `hooks/useAuth.ts` - Auth state management
- `hooks/useLocation.ts` - Location tracking
- `hooks/usePlaces.ts` - Real-time places
- `hooks/useProximity.ts` - Nearby detection
- `hooks/useCheckIn.ts` - Check-in with cooldown

### Components
- `components/checkin/CheckInButtons.tsx`
- `components/checkin/CooldownTimer.tsx`
- `components/checkin/StaleIndicator.tsx`
- `components/map/PlaceMarker.tsx`
- `components/places/PlaceCard.tsx`

### Screens
- `app/_layout.tsx` - Root layout
- `app/index.tsx` - Entry point
- `app/(auth)/welcome.tsx` - Permission request
- `app/(tabs)/_layout.tsx` - Tab navigator
- `app/(tabs)/index.tsx` - Map screen
- `app/(tabs)/places.tsx` - Places list
- `app/place/[id].tsx` - Place detail

### Backend
- `functions/src/index.ts` - Cloud Function
- `data/places.json` - Seed data
- `scripts/seedPlaces.ts` - Seeder script

---

## Verification

### Manual Testing Checklist
- [ ] App loads and signs in anonymously
- [ ] Location permission prompt appears on welcome screen
- [ ] Map shows all POI markers with correct colors
- [ ] Markers update in real-time when busyPercent changes
- [ ] Check-in buttons appear when within 3m of a place
- [ ] Buttons disabled when GPS accuracy > 10m
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
npm run lint           # Run ESLint

# Firebase
firebase emulators:start    # Start local emulators
firebase deploy             # Deploy to production
npx ts-node scripts/seedPlaces.ts  # Seed database
```

---

*Implementation completed: February 2026*
