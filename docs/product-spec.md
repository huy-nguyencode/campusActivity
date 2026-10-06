# Campus Spots - Technical Specification

For the current implementation and cost behavior, see [the project layout](../README.md#project-layout) and [Firebase costs](firebase-costs.md). Examples below are design references; source modules are authoritative.

A comprehensive guide to the Campus Spots mobile application architecture, patterns, and implementation details. Written for junior engineers learning mobile development.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture Layers](#architecture-layers)
3. [Directory Structure](#directory-structure)
4. [Core Concepts for Junior Engineers](#core-concepts-for-junior-engineers)
5. [Data Flow](#data-flow)
6. [Component Deep Dives](#component-deep-dives)
7. [State Management](#state-management)
8. [Firebase Integration](#firebase-integration)
9. [Security Considerations](#security-considerations)
10. [Testing Strategies](#testing-strategies)
11. [Performance Optimizations](#performance-optimizations)
12. [Deployment](#deployment)

---

## Application Overview

### What Is Campus Spots?

Campus Spots is a privacy-focused mobile app that shows real-time crowd levels at campus locations. Users anonymously check in to report how busy a location is, and the app aggregates this data to display color-coded busyness indicators.

### Key Features

| Feature | Description |
|---------|-------------|
| **Anonymous Auth** | Users sign in without providing personal information |
| **Real-time Updates** | Map markers update automatically as crowd levels change |
| **Proximity Check-in** | Users must be physically present (within 3m) to check in |
| **Cooldown System** | 90-minute cooldown prevents spam submissions |
| **Stale Data Warnings** | UI indicates when crowd data might be outdated |
| **Offline Support** | App works offline with cached data |

### Tech Stack

```
Frontend:
├── React Native (Expo SDK 57)
├── TypeScript
├── Expo Router (file-based navigation)
└── react-native-maps

Backend:
├── Firebase Authentication (anonymous)
├── Cloud Firestore (real-time database)
├── Cloud Functions (scheduled aggregation)
└── AsyncStorage (local cooldown storage)
```

---

## Architecture Layers

### The Layered Architecture Pattern

Campus Spots follows a **layered architecture** where each layer has a specific responsibility. Data flows down through layers, and each layer only talks to the layer directly below it.

```
┌─────────────────────────────────────┐
│           UI Components             │  ← What users see and interact with
│    (Screens, Buttons, Markers)      │
├─────────────────────────────────────┤
│           Custom Hooks              │  ← Bridge between UI and services
│   (useAuth, useLivePlaces, usePlaceCheckIn)  │
├─────────────────────────────────────┤
│             Services                │  ← Business logic and API calls
│  (auth, places, checkin, location)  │
├─────────────────────────────────────┤
│        External APIs/Storage        │  ← Firebase, GPS, AsyncStorage
│   (Firestore, Auth, Location API)   │
└─────────────────────────────────────┘
```

### Why Layers Matter (Junior Engineer Note)

**Without layers:** A button click might directly call Firebase, handle errors, update multiple pieces of state, and navigate—all in one function. This becomes impossible to test, debug, or modify.

**With layers:**
- Button calls a hook function
- Hook calls a service function
- Service calls Firebase
- Each piece can be tested independently
- Changing Firebase to another backend only affects the service layer

---

## Directory Structure

```
campusActivity/
├── app/                          # Screens and navigation (Expo Router)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry point with redirect logic
│   ├── (auth)/                   # Auth-related screens
│   │   └── welcome.tsx           # Location permission request
│   ├── (tabs)/                   # Tab-based navigation group
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Map screen (default tab)
│   │   └── places.tsx            # Places list screen
│   └── place/
│       └── [id].tsx              # Dynamic place detail screen
│
├── components/                   # Reusable UI components
│   ├── checkin/                  # Check-in related components
│   │   ├── CrowdLevelButtons.tsx    # Emoji selection buttons
│   │   ├── CooldownTimer.tsx     # Countdown display
│   │   ├── StaleCrowdIndicator.tsx    # Outdated data warning
│   │   └── index.ts              # Barrel export
│   ├── map/
│   │   ├── PlaceMarker.tsx       # Map marker with callout
│   │   └── index.ts
│   └── places/
│       └── PlaceCard.tsx         # List item for places
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication state
│   ├── useLocation.ts            # GPS tracking
│   ├── useLivePlaces.ts              # Real-time places subscription
│   ├── usePlaceProximity.ts           # Distance calculations
│   └── usePlaceCheckIn.ts             # Check-in with cooldown
│
├── services/                     # Business logic layer
│   ├── auth.ts                   # Firebase Auth operations
│   ├── location.ts               # Expo Location API
│   ├── places.ts                 # Firestore places operations
│   ├── checkin.ts                # Check-in submission + cooldown
│   └── proximity.ts              # Haversine distance calculations
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # All interfaces and types
│
├── constants/                    # App-wide constants
│   └── config.ts                 # Radii, timeouts, colors
│
├── config/                       # External service config
│   └── firebase.ts               # Firebase initialization
│
├── utils/                        # Pure utility functions
│   └── haversine.ts              # Distance calculation
│
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       └── index.ts              # aggregateBusyPercent function
│
├── data/                         # Seed data
│   └── places.json               # Initial POI data
│
├── scripts/                      # Development scripts
│   └── seedPlaces.ts             # Database seeder
│
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
└── firebase.json                 # Firebase project config
```

---

## Core Concepts for Junior Engineers

### 1. TypeScript Interfaces

**What:** TypeScript interfaces define the "shape" of your data.

**Why:** They catch errors before your app runs and provide autocomplete.

```typescript
// types/domain.ts
interface Place {
  id: string;
  name: string;
  type: PlaceType;           // Restricted to specific values
  location: GeoPoint;
  busyPercent: number;       // 0-100
  lastUpdate: Date | null;   // null if never updated
}

// Using the interface
function displayPlace(place: Place) {
  console.log(place.name);      // ✅ Works
  console.log(place.address);   // ❌ TypeScript error! 'address' doesn't exist
}
```

**Junior Tip:** Start with interfaces for your main data structures. You'll thank yourself when refactoring.

---

### 2. Custom Hooks

**What:** Functions that encapsulate React state logic for reuse.

**Why:** DRY (Don't Repeat Yourself) + separation of concerns.

```typescript
// hooks/usePlaceCheckIn.ts
export function usePlaceCheckIn(placeId: string | null) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to check cooldown status
  useEffect(() => { /* ... */ }, [placeId]);

  // Memoized check-in function
  const checkIn = useCallback(async (level: BusyLevel) => {
    /* ... */
  }, [placeId]);

  return { checkIn, isOnCooldown, cooldownEndTime, isLoading };
}

// Usage in component - clean and simple!
function PlaceScreen() {
  const { checkIn, isOnCooldown, cooldownEndTime } = usePlaceCheckIn(placeId);
  // All the complex state logic is hidden inside the hook
}
```

**Junior Tip:** If you find yourself copying state logic between components, it's time for a custom hook.

---

### 3. Services Layer

**What:** Functions that handle external operations (API calls, storage).

**Why:** Isolates side effects from UI code.

```typescript
// services/check-in-service.ts
export async function submitCheckin(placeId: string, level: BusyLevel): Promise<CheckIn | null> {
  // Get authenticated user
  const uid = await getCurrentUserUID();
  if (!uid) return null;

  // Check cooldown
  if (await isOnCoolDown(placeId)) return null;

  // Submit to Firestore
  const ref = await addDoc(collection(db, 'checkins'), {
    placeId,
    level,
    timestamp: serverTimestamp(),
    uid,
  });

  // Set local cooldown
  await setCooldown(placeId);

  return { id: ref.id, placeId, level, /* ... */ };
}
```

**Junior Tip:** Services should be pure functions when possible—same input = same output. This makes testing trivial.

---

### 4. Real-Time Subscriptions

**What:** Instead of fetching data once, you subscribe to changes.

**Why:** UI updates automatically when data changes, without manual refresh.

```typescript
// services/place-service.ts
export function subscribePlaces(
  onUpdate: (places: Place[]) => void,
  onError: (error: Error) => void
): () => void {
  // onSnapshot returns an unsubscribe function
  return onSnapshot(
    collection(db, 'places'),
    (snapshot) => {
      const places = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(places);  // Called every time data changes!
    },
    (error) => onError(error)
  );
}

// hooks/useLivePlaces.ts
useEffect(() => {
  const unsubscribe = subscribePlaces(setPlaces, setError);
  return unsubscribe;  // Cleanup on unmount
}, []);
```

**Junior Tip:** Always return cleanup functions from useEffect. Forgetting to unsubscribe causes memory leaks.

---

### 5. Component Composition

**What:** Building complex UIs from simple, reusable pieces.

**Why:** Each component is easy to understand, test, and reuse.

```tsx
// Before: Monolithic component (bad)
function PlaceScreen() {
  return (
    <View>
      {/* 100+ lines of header, timer, buttons, all inline */}
    </View>
  );
}

// After: Composed components (good)
function PlaceScreen() {
  return (
    <View>
      <PlaceHeader place={place} />
      <StaleCrowdIndicator lastUpdate={place.lastUpdate} />
      {isOnCooldown && <CooldownTimer endTime={cooldownEndTime} />}
      <CrowdLevelButtons onCheckIn={handleCheckIn} disabled={!canCheckIn} />
    </View>
  );
}
```

**Junior Tip:** If a component exceeds ~100 lines or handles multiple concerns, split it.

---

### 6. Pure Functions

**What:** Functions with no side effects—same input always gives same output.

**Why:** Easy to test, reason about, and debug.

```typescript
// utils/geo-distance.ts - Pure function
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Testing is trivial:
test('calculates distance between two points', () => {
  const distance = haversineDistance(39.98, -75.15, 39.99, -75.16);
  expect(distance).toBeCloseTo(1414, 0); // ~1.4km
});
```

**Junior Tip:** Extract logic into pure functions whenever possible. Your future self will thank you.

---

## Data Flow

### Check-In Flow (Example)

```
User taps "😴 Not Busy"
        │
        ▼
┌─────────────────────┐
│  CrowdLevelButtons     │  Component calls onCheckIn(1)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  PlaceScreen        │  Calls handleCheckIn -> checkIn(level)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  usePlaceCheckIn hook    │  Validates, sets loading, calls service
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  checkin service    │  submitCheckin(placeId, level)
└─────────────────────┘
        │
        ├──► Firebase Auth (get UID)
        ├──► AsyncStorage (check cooldown)
        ├──► Firestore (write checkin doc)
        └──► AsyncStorage (set cooldown)
        │
        ▼
┌─────────────────────┐
│  Cloud Function     │  (runs every 15 min)
│  aggregateBusyPercent│  Calculates weighted average
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Firestore          │  Updates place.busyPercent
└─────────────────────┘
        │
        ▼ (real-time subscription)
┌─────────────────────┐
│  useLivePlaces hook     │  Receives updated place
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  MapScreen          │  Marker color updates automatically!
└─────────────────────┘
```

---

## Component Deep Dives

### CrowdLevelButtons Component

**Purpose:** Render emoji buttons for busyness selection.

**Key Patterns:**

1. **Props Interface:** Clearly defines what the component needs
2. **Haptic Feedback:** Provides tactile response for better UX
3. **Accessibility:** Labels for screen readers
4. **Visual States:** Disabled, pressed, loading

```typescript
interface CrowdLevelButtonsProps {
  onCheckIn: (level: BusyLevel) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function CrowdLevelButtons({ onCheckIn, disabled = false, isLoading = false }) {
  const handlePress = async (level: BusyLevel) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCheckIn(level);
  };

  return (
    <View>
      {BUSY_LEVELS.map(({ level, emoji, label }) => (
        <Pressable
          key={level}
          onPress={() => handlePress(level)}
          disabled={disabled || isLoading}
          accessibilityLabel={`Rate as ${label}`}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
        >
          <Text>{emoji}</Text>
          <Text>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

### CooldownTimer Component

**Purpose:** Display countdown until user can check in again.

**Key Patterns:**

1. **Interval Management:** setInterval with proper cleanup
2. **Derived State:** Calculate remaining time from endTime
3. **Auto-cleanup:** Clear interval when countdown reaches zero

```typescript
export function CooldownTimer({ endTime, onComplete }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, endTime.getTime() - Date.now())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = Math.max(0, endTime.getTime() - Date.now());
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);  // CRITICAL: Always cleanup!
  }, [endTime, onComplete]);

  if (remaining <= 0) return null;

  return <Text>{formatTime(remaining)}</Text>;
}
```

---

## State Management

### State Location Decision Tree

```
Is the state needed by multiple unrelated components?
├── YES → Consider Context or global state (not used in this app)
└── NO → Keep in closest common ancestor

Does the state represent server data?
├── YES → Use real-time subscriptions + hooks (useLivePlaces)
└── NO → Use local state (useState)

Does the state persist across sessions?
├── YES → Use AsyncStorage (cooldowns)
└── NO → Use React state (UI state like loading)
```

### State Types in Campus Spots

| State Type | Storage | Example |
|------------|---------|---------|
| UI State | useState | `isLoading`, `error` |
| Server Data | Firestore + Hooks | `places`, `busyPercent` |
| Auth State | Firebase Auth | `user`, `uid` |
| Persistent Local | AsyncStorage | `cooldownEndTime` |
| Ephemeral Local | useState | `selectedLevel` |

---

## Firebase Integration

### Firestore Data Model

```
/places/{placeId}
  ├── name: string
  ├── type: string ("dining hall" | "library" | ...)
  ├── location: GeoPoint
  ├── busyPercent: number (0-100)
  └── lastUpdate: timestamp | null

/checkins/{checkinId}
  ├── placeId: string (references /places/{placeId})
  ├── level: number (1 | 2 | 3)
  ├── timestamp: timestamp
  └── uid: string (anonymous user ID)
```

### Cloud Function: Aggregation Algorithm

The `aggregateBusyPercent` function runs every 15 minutes and calculates weighted busyness:

1. **Load Recent Check-ins:** Get all check-ins from the last 90 minutes
2. **Apply Exponential Decay:** Recent check-ins count more than old ones
3. **Calculate Weighted Average:** Sum(value × weight) / Sum(weights)
4. **Update Places:** Write new busyPercent to each place

**Exponential Decay Formula:**
```
weight = 0.5 ^ (age_minutes / half_life_minutes)

With 30-minute half-life:
- Just now:    weight = 1.0
- 30 min ago:  weight = 0.5
- 60 min ago:  weight = 0.25
- 90 min ago:  weight = 0.125
```

---

## Security Considerations

### Firestore Rules Explained

```javascript
// places: Read-only for clients
match /places/{placeId} {
  allow read: if true;           // Anyone can read
  allow write: if false;         // Only Cloud Functions can write
}

// checkins: Authenticated create with validation
match /checkins/{checkinId} {
  allow create: if
    request.auth != null &&                    // Must be signed in
    request.resource.data.uid == request.auth.uid &&  // Can't impersonate
    request.resource.data.level >= 1 &&        // Valid level
    request.resource.data.level <= 3;
  allow update, delete: if false;              // Immutable
}
```

### Security Principles Applied

1. **Principle of Least Privilege:** Users can only create check-ins, nothing else
2. **Input Validation:** All fields validated in rules
3. **Identity Verification:** UID must match authenticated user
4. **Immutability:** Check-ins cannot be modified after creation

---

## Testing Strategies

### Unit Tests (Services Layer)

```typescript
// services/__tests__/haversine.test.ts
describe('haversineDistance', () => {
  it('calculates distance between two points', () => {
    const distance = haversineDistance(39.98, -75.15, 39.99, -75.16);
    expect(distance).toBeCloseTo(1414, 0);
  });

  it('returns 0 for same point', () => {
    expect(haversineDistance(39.98, -75.15, 39.98, -75.15)).toBe(0);
  });
});
```

### Component Tests

```typescript
// components/__tests__/CrowdLevelButtons.test.tsx
describe('CrowdLevelButtons', () => {
  it('calls onCheckIn with correct level', () => {
    const mockOnCheckIn = jest.fn();
    render(<CrowdLevelButtons onCheckIn={mockOnCheckIn} />);

    fireEvent.press(screen.getByText('Not Busy'));

    expect(mockOnCheckIn).toHaveBeenCalledWith(1);
  });

  it('disables buttons when disabled prop is true', () => {
    render(<CrowdLevelButtons onCheckIn={jest.fn()} disabled />);

    expect(screen.getByText('Not Busy')).toBeDisabled();
  });
});
```

### Integration Tests (Hooks)

```typescript
// hooks/__tests__/usePlaceCheckIn.test.ts
describe('usePlaceCheckIn', () => {
  it('starts not on cooldown', () => {
    const { result } = renderHook(() => usePlaceCheckIn('place-1'));
    expect(result.current.isOnCooldown).toBe(false);
  });

  it('enters cooldown after check-in', async () => {
    const { result } = renderHook(() => usePlaceCheckIn('place-1'));

    await act(async () => {
      await result.current.checkIn(2);
    });

    expect(result.current.isOnCooldown).toBe(true);
  });
});
```

---

## Performance Optimizations

### 1. Memoization

```typescript
// Prevent re-renders with useCallback
const handleCheckIn = useCallback(async (level: BusyLevel) => {
  // ...
}, [checkIn]);  // Only recreate if checkIn changes

// Prevent expensive recalculations with useMemo
const sortedPlaces = useMemo(
  () => places.sort((a, b) => a.name.localeCompare(b.name)),
  [places]
);
```

### 2. FlatList Virtualization

```tsx
// FlatList only renders visible items
<FlatList
  data={places}
  renderItem={renderPlace}
  keyExtractor={(item) => item.id}  // Stable keys for efficient updates
  initialNumToRender={10}            // Render 10 items initially
  maxToRenderPerBatch={5}            // Render 5 at a time when scrolling
/>
```

### 3. Constants Outside Components

```typescript
// BAD: Recreated every render
function MyComponent() {
  const options = [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }];
  // ...
}

// GOOD: Created once
const OPTIONS = [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }];
function MyComponent() {
  // Use OPTIONS
}
```

---

## Deployment

### Development Workflow

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run linter
npm run lint
```

### Firebase Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Seeding the Database

```bash
# Start emulators (optional, for local testing)
firebase emulators:start

# Seed places to Firestore
npx ts-node scripts/seed-campus-places.ts
```

---

## Quick Reference

### File Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `camelCase.ts` | `useAuth.ts` | Hooks, services, utils |
| `PascalCase.tsx` | `CrowdLevelButtons.tsx` | Components |
| `[param].tsx` | `[id].tsx` | Dynamic routes |
| `_layout.tsx` | `_layout.tsx` | Expo Router layouts |
| `index.ts` | `index.ts` | Barrel exports |

### Common Patterns Cheat Sheet

```typescript
// Custom Hook
export function useXxx() {
  const [state, setState] = useState();
  useEffect(() => { /* ... */ }, []);
  return { state, /* ... */ };
}

// Service Function
export async function doXxx(param: Type): Promise<Result> {
  try {
    // External operation
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Component
interface XxxProps { /* ... */ }
export function Xxx({ prop }: XxxProps) {
  return <View>...</View>;
}
```

---

## Summary

Campus Spots demonstrates modern React Native development with:

1. **TypeScript** for type safety and better developer experience
2. **Layered Architecture** separating UI, logic, and data
3. **Custom Hooks** for reusable state logic
4. **Real-time Subscriptions** for automatic UI updates
5. **Firebase** for authentication, database, and serverless functions
6. **Security Rules** protecting data at the database level

The codebase is designed to be educational—look for "LEARNING POINT" comments throughout the code for explanations of key patterns and decisions.

---

*Last updated: February 2026*
