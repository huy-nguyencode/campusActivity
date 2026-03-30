# Campus Spots MVP - Implementation Plan

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
| `utils/distance.ts` | Distance calculation function | ✅ |

### 1.4 Update app.json ✅
- [x] Add location permission strings for iOS/Android
- [x] Add expo-location plugin

---

## Phase 2: Core Services ✅ COMPLETE

| File | Purpose | Status |
|------|---------|--------|
| `services/authService.ts` | Anonymous sign-in, auth state listener | ✅ |
| `services/locationService.ts` | Permission handling, location watching | ✅ |
| `services/checkInService.ts` | Submit check-ins, manage cooldowns | ✅ |
| `services/placeService.ts` | Firestore real-time subscription for places | ✅ |
| `services/proximityService.ts` | Calculate distance to POIs, find nearby places | ✅ |
| `services/adminService.ts` | Admin check + override management | ✅ |

---

## Phase 3: React Hooks ✅ COMPLETE

| Hook | Purpose | Status |
|------|---------|--------|
| `hooks/useAuth.ts` | Auth state management, auto sign-in | ✅ |
| `hooks/useLocation.ts` | Location tracking with permission flow | ✅ |
| `hooks/usePlaces.ts` | Real-time places subscription | ✅ |
| `hooks/useProximity.ts` | Combine location + places for nearby detection | ✅ |
| `hooks/useCheckIn.ts` | Check-in submission with cooldown state | ✅ |
| `hooks/useAdmin.ts` | Admin status check | ✅ |

---

## Phase 4: Navigation & Screens ✅ COMPLETE

### Structure
```
app/
├── _layout.tsx           # Root layout with font loading + auth
├── index.tsx             # Entry - redirect based on auth/permission
├── (auth)/
│   └── welcome.tsx       # Location permission request
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator (Map + Places)
│   ├── index.tsx         # Map view with POI markers
│   └── places.tsx        # Place list view
└── place/
    └── [id].tsx          # Place detail + check-in
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
| `PlaceMarker` | `components/map/` | Place-type icon marker with callout | ✅ |
| `CheckInButtons` | `components/checkin/` | 3 emoji buttons with haptics | ✅ |
| `CooldownTimer` | `components/checkin/` | Auto-updating countdown | ✅ |
| `StaleIndicator` | `components/checkin/` | "Data may be stale" badge | ✅ |
| `PlaceCard` | `components/places/` | List item with busyness color | ✅ |
| `FloatingTabBar` | `components/navigation/` | Custom floating pill tab bar | ✅ |
| `AdminOverridePanel` | `components/admin/` | Admin busy level override | ✅ |
| `ErrorBoundary` | `components/` | App-wide error boundary | ✅ |

---

## Phase 6: Cloud Function ✅ COMPLETE

Created `functions/` directory with Firebase Functions:

**aggregateBusyPercent** - Scheduled every 5 minutes: ✅
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
- `scripts/seedPlaceCollection.ts` for database initialization

---

## Phase 8: UI/UX Redesign — "Cherry" Theme ✅ COMPLETE

### Design Direction
- **Tone**: Warm & organic, playful but subtle & refined
- **Signature colors**: Cherry red (#C41E3A) + warm whites/creams
- **Typography**: Outfit (display) + Figtree (body)
- **Motion**: Soft springs (damping: 20, stiffness: 120), gentle press scale (0.97)
- **Detail**: Cherry-tinted warm shadows on cards (pink cushion effect)

### Changes Made ✅
| File | Change | Status |
|------|--------|--------|
| `constants/theme.ts` | Full rewrite — cherry palette, Outfit+Figtree fonts, warm shadows, softer animation | ✅ |
| `app/_layout.tsx` | Swapped Quicksand/Nunito for Outfit/Figtree font loading | ✅ |
| `app/(auth)/welcome.tsx` | Cherry-cream gradient, 700ms animations, 250ms stagger | ✅ |
| `app/place/[id].tsx` | Softer animation stagger (200ms gaps), cherry hero gradient | ✅ |
| `components/places/PlaceCard.tsx` | Cherry-tinted warm shadows (SHADOWS.warm) | ✅ |
| `components/map/PlaceMarker.tsx` | Place-type icons instead of busyness emoji, white pin bg | ✅ |
| `components/checkin/CooldownTimer.tsx` | Gentler pulse (1.03 scale, 1200ms cycle) | ✅ |
| `components/checkin/CheckInButtons.tsx` | Updated comments for cherry aesthetic | ✅ |
| `components/AppErrorBoundary.tsx` | Fixed BORDER_RADIUS → RADIUS, SPACING key bugs | ✅ |
| `types/index.ts` | Fixed PlaceType to match Firestore data (lowercase with spaces) | ✅ |

### Dependencies Changed ✅
- **Added**: `@expo-google-fonts/outfit`, `@expo-google-fonts/figtree`
- **Removed**: `@expo-google-fonts/quicksand`, `@expo-google-fonts/nunito`

---

## Remaining Work

### Must-Do Before Launch
- [ ] **Deploy Cloud Function** — `firebase deploy --only functions --project campusactivity-ec1f2`
- [ ] **Deploy Firestore rules** — `firebase deploy --only firestore:rules --project campusactivity-ec1f2`
- [ ] **Deploy Firestore indexes** — `firebase deploy --only firestore:indexes --project campusactivity-ec1f2`
- [ ] **Test on iOS device/simulator** — verify fonts load, map renders, check-in flow works end-to-end
- [ ] **Test on Android device/emulator** — verify shadows (elevation), map markers, haptics
- [ ] **Test offline behavior** — cached data shows, queued check-ins sync when reconnected
- [ ] **Test check-in flow end-to-end** — submit check-in → cloud function runs → busyPercent updates → UI reflects change

### Nice-to-Have / Future
- [ ] Push notifications for crowd level changes
- [ ] Historical busy trends (heatmap by hour/day)
- [ ] User favorites / pinned places
- [ ] Search / filter on places list
- [ ] Onboarding tutorial screens
- [ ] App Store / Play Store submission (icons, screenshots, metadata)

---

## Key Files

### Configuration
- `config/firebase.ts` - Firebase initialization
- `constants/config.ts` - App-wide constants
- `constants/theme.ts` - Cherry design system tokens
- `firebase.json` - Firebase project config
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes

### Types & Utils
- `types/index.ts` - TypeScript interfaces
- `utils/distance.ts` - Distance calculations

### Services
- `services/authService.ts` - Authentication
- `services/locationService.ts` - GPS tracking
- `services/placeService.ts` - Firestore operations
- `services/checkInService.ts` - Check-in logic
- `services/proximityService.ts` - Distance detection
- `services/adminService.ts` - Admin override management

### Hooks
- `hooks/useAuth.ts` - Auth state management
- `hooks/useLocation.ts` - Location tracking
- `hooks/usePlaces.ts` - Real-time places
- `hooks/useProximity.ts` - Nearby detection
- `hooks/useCheckIn.ts` - Check-in with cooldown
- `hooks/useAdmin.ts` - Admin status check

### Components
- `components/checkin/CheckInButtons.tsx`
- `components/checkin/CooldownTimer.tsx`
- `components/checkin/StaleIndicator.tsx`
- `components/map/PlaceMarker.tsx`
- `components/places/PlaceCard.tsx`
- `components/navigation/FloatingTabBar.tsx`
- `components/admin/AdminOverridePanel.tsx`
- `components/AppErrorBoundary.tsx`

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
- `scripts/seedPlaceCollection.ts` - Seeder script

---

## Verification

### Manual Testing Checklist
- [ ] App loads and signs in anonymously
- [ ] Location permission prompt appears on welcome screen
- [ ] Map shows all POI markers with correct place-type icons
- [ ] Markers show busyness in callout on tap
- [ ] Check-in buttons appear when within 3m of a place
- [ ] Buttons disabled when GPS accuracy > 10m
- [ ] Check-in submission shows success feedback
- [ ] Cooldown timer appears (90 min countdown)
- [ ] Cannot check in again until cooldown expires
- [ ] Places list shows correct emoji for each place type
- [ ] Pull-to-refresh works on places list
- [ ] App works offline (shows cached data)
- [ ] Queued check-ins sync when back online

### Run Commands
```bash
npm start              # Start Expo dev server
npm run ios            # Test on iOS simulator
npm run android        # Test on Android emulator
npm run lint           # Run ESLint

# Firebase
firebase deploy --only functions --project campusactivity-ec1f2
firebase deploy --only firestore:rules --project campusactivity-ec1f2
firebase deploy --only firestore:indexes --project campusactivity-ec1f2
```

---

*Implementation completed: February 2026*
*Cherry theme redesign: February 2026*
