# Campus Spots — `claude-uml-diagram`

A from-source UML walkthrough of the entire app: routing, components, hooks, services, Cloud Functions, Firestore data/security model, and deployment. Every diagram below was checked against the current code (not an older spec), so file paths are exact and you can jump straight to the implementation.

All diagrams use [Mermaid](https://mermaid.js.org/). Most editors/GitHub render them automatically.

---

## 0. How this document is organized

| # | Section | What it answers |
|---|---------|------------------|
| 1 | System context | Who uses the app, what external systems it talks to |
| 2 | Container/component view | The big modules and how they depend on each other |
| 3 | Screen & component tree | What renders what, down to leaf components |
| 4 | Domain model | The TypeScript types and how a Firestore doc becomes a `Place` |
| 5 | Hooks as state machines | The `useSyncExternalStore` pattern used for shared state |
| 6 | Navigation/startup flow | How the app decides Welcome vs. Tabs |
| 7 | Realtime data flow | Seed → Firestore → `onSnapshot` → screens |
| 8 | Check-in sequence | The full client → Cloud Function → transaction path |
| 9 | Check-in button state machine | UI-level guard against double submits |
| 10 | Admin authorization & overrides | Two independent authorization layers |
| 11 | Scheduled aggregation algorithm | How `busyPercent` is computed every 5 minutes |
| 12 | Scheduled cleanup algorithm | Retention/deletion job |
| 13 | Firestore ER model | Collections, keys, and who can touch them |
| 14 | Security model | Rules + callable validation, defense in depth |
| 15 | Deployment & tooling | Expo/EAS, Firebase, emulators, scripts |
| 16 | Design tokens | The theme system class diagram |
| 17 | Known dead code & caveats | Things that exist in source but aren't wired up |
| 18 | Reading guide | Suggested order to read the actual source |

---

## 1. System context

```mermaid
flowchart TB
    student([Student\nend user])
    admin([Admin user\nanonymous UID in config/admins])

    subgraph app [Campus Spots — Expo React Native app]
        direction TB
        client[Client: screens, hooks, services]
    end

    subgraph firebase [Firebase project: campusactivity-ec1f2]
        direction TB
        fbauth[(Firebase Anonymous Auth)]
        firestore[(Cloud Firestore)]
        functions[Cloud Functions\ncallable + scheduled]
    end

    gps[Device GPS\nExpo Location]
    storage[(Device AsyncStorage)]

    student --> app
    admin --> app
    client --> gps
    client --> storage
    client --> fbauth
    client --> firestore
    client --> functions
    functions --> firestore
```

**Key fact:** there is no traditional backend server. The "backend" is entirely Firebase: anonymous auth (no accounts/passwords), Firestore as the database, and two kinds of Cloud Functions (`onCall` for client-invoked logic, `onSchedule` for cron-style jobs).

---

## 2. Container / component view

This is effectively a component diagram: which layer is allowed to depend on which.

```mermaid
flowchart TB
    subgraph routing ["app/ — Expo Router (file-based routes)"]
        rootLayout["_layout.tsx\nRootLayout"]
        idx["index.tsx\nstartup redirect"]
        welcome["(auth)/welcome.tsx"]
        tabsLayout["(tabs)/_layout.tsx"]
        mapScreen["(tabs)/index.tsx\nMapScreen"]
        placesScreen["(tabs)/places.tsx\nPlacesScreen"]
        detailScreen["place/[id].tsx\nPlaceScreen"]
    end

    subgraph hooksLayer ["hooks/ — shared + local state"]
        useAuth["useAuth\n(module store)"]
        useLocation["useLocation\n(module store)"]
        usePlaces["usePlaces\n(module store)"]
        useCheckIn["useCheckIn\n(local state)"]
        useAdmin["useAdmin\n(local state)"]
        useProximity["useProximity\n(derived, UNUSED)"]
    end

    subgraph servicesLayer ["services/ + utils/ — I/O adapters"]
        authService
        locationService
        placeService
        checkInService
        adminService
        proximityService["proximityService (UNUSED by UI)"]
        distanceUtil["utils/distance.ts"]
    end

    subgraph componentsLayer ["components/ — presentational"]
        PlaceMarker
        PlaceCard
        CheckInButtons
        CooldownTimer
        StaleIndicator
        AdminOverridePanel
        FloatingTabBar
        AppErrorBoundary
    end

    subgraph platform ["Platform / Firebase SDKs"]
        firebaseAuthSdk["firebase/auth"]
        firestoreSdk["firebase/firestore"]
        functionsSdk["firebase/functions"]
        expoLocationSdk["expo-location"]
        asyncStorageSdk["AsyncStorage"]
    end

    rootLayout --> useAuth
    rootLayout --> AppErrorBoundary
    idx --> useLocation
    welcome --> useLocation
    tabsLayout --> FloatingTabBar
    mapScreen --> usePlaces
    mapScreen --> useLocation
    mapScreen --> PlaceMarker
    placesScreen --> usePlaces
    placesScreen --> PlaceCard
    detailScreen --> useAuth
    detailScreen --> useLocation
    detailScreen --> useCheckIn
    detailScreen --> useAdmin
    detailScreen --> placeService
    detailScreen --> distanceUtil
    detailScreen --> CheckInButtons
    detailScreen --> CooldownTimer
    detailScreen --> StaleIndicator
    detailScreen --> AdminOverridePanel

    useAuth --> authService
    useLocation --> locationService
    usePlaces --> placeService
    useCheckIn --> checkInService
    useAdmin --> adminService
    useProximity --> proximityService
    proximityService --> distanceUtil

    authService --> firebaseAuthSdk
    placeService --> firestoreSdk
    checkInService --> functionsSdk
    checkInService --> asyncStorageSdk
    checkInService --> authService
    adminService --> functionsSdk
    adminService --> firestoreSdk
    locationService --> expoLocationSdk
```

**Pattern worth learning — layered dependency direction:** screens never touch Firebase SDKs directly (`detailScreen --> placeService`, not `detailScreen --> firestoreSdk`). This means if you ever swapped Firestore for another database, only the `services/` folder would change. This is the **adapter/service layer pattern**.

---

## 3. Screen & component tree

```mermaid
flowchart TB
    Stack["Stack (expo-router)\napp/_layout.tsx"]
    Stack --> TabsGroup["(tabs) group"]
    Stack --> WelcomeModal["(auth)/welcome\nfullScreenModal"]
    Stack --> DetailRoute["place/[id]"]
    Stack --> IndexRoute["index (redirect only, no UI)"]

    TabsGroup --> TabBar["FloatingTabBar\n(custom, replaces default tab bar)"]
    TabsGroup --> MapTab["Map tab → (tabs)/index.tsx"]
    TabsGroup --> ListTab["Places tab → (tabs)/places.tsx"]

    MapTab --> MapView["react-native-maps MapView"]
    MapView --> Markers["PlaceMarker × N\n(one per place, emoji pin)"]

    ListTab --> FlatList["FlatList (alphabetical)"]
    FlatList --> Cards["PlaceCard × N"]

    DetailRoute --> Header["Hero header\n(icon, name, type, busy emoji)"]
    DetailRoute --> Stale["StaleIndicator"]
    DetailRoute --> StatusCards["Conditional status cards\n(location off / too far / low accuracy / ready)"]
    DetailRoute --> Cooldown["CooldownTimer\n(shown only while on cooldown)"]
    DetailRoute --> Buttons["CheckInButtons\n(3 emoji levels)"]
    DetailRoute --> AdminPanel["AdminOverridePanel\n(shown only if isAdmin)"]

    WelcomeModal --> PrivacyCard["Privacy info card"]
    WelcomeModal --> EnableBtn["Enable Location button"]
    WelcomeModal --> SkipBtn["Skip button"]
```

- Source of truth for markers/cards: `place.type` maps to an emoji via a local `PLACE_TYPE_ICONS` record duplicated in three places ([`components/map/PlaceMarker.tsx`](../components/map/PlaceMarker.tsx), [`components/places/PlaceCard.tsx`](../components/places/PlaceCard.tsx), [`app/place/[id].tsx`](../app/place/[id].tsx)) — a small duplication worth refactoring into one shared constant.
- `AppErrorBoundary` ([`components/AppErrorBoundary.tsx`](../components/AppErrorBoundary.tsx)) wraps the entire `<Stack>`, not individual screens, so a render error anywhere replaces the whole navigator with a retry screen.

---

## 4. Domain model (`types/index.ts`) and Firestore mapping

```mermaid
classDiagram
    class Place {
        +string id
        +string name
        +PlaceType type
        +GeoPoint location
        +number busyPercent
        +Date lastUpdate
        +AdminOverride adminOverride
    }

    class AdminOverride {
        +boolean active
        +number busyPercent
        +string setBy
        +Date setAt
    }

    class GeoPoint {
        +number latitude
        +number longitude
    }

    class CheckIn {
        +string id
        +string placeId
        +BusyLevel level
        +Date timestamp
        +string uid
    }

    class LocationState {
        +number latitude
        +number longitude
        +number accuracy
        +number timestamp
    }

    class ProximityResult {
        +Place place
        +number distance
        +boolean isNearby
    }

    class PlaceType {
        <<enumeration>>
        dining_hall
        library
        gym
        cafe
        food_truck
        study
        the_wall
        bagel
        restaurant
    }

    class BusyLevel {
        <<enumeration>>
        level1_notBusy
        level2_moderate
        level3_veryBusy
    }

    Place "1" *-- "0..1" AdminOverride
    Place "1" *-- "1" GeoPoint
    CheckIn --> BusyLevel
    Place --> PlaceType
    ProximityResult --> Place
```

### Firestore document → domain object (`mapPlaceDocument`)

[`services/placeService.ts`](../services/placeService.ts) is a **validating mapper / anti-corruption layer**: it never trusts the raw Firestore document blindly.

```mermaid
flowchart LR
    raw["Raw Firestore doc\n{name, type, location, busyPercent, lastUpdate, adminOverride?}"]
    check1{"location is object\nwith finite lat/lng in range?"}
    check2{"name is non-empty string?"}
    check3{"type in the 9-value\nPLACE_TYPES set?"}
    clamp["clamp busyPercent to [0,100]\n(default 0 if not finite)"]
    convert["Timestamp -> Date\n(lastUpdate, adminOverride.setAt)"]
    place["Place object"]
    skip["return null\n(console.warn, doc silently dropped from list)"]

    raw --> check1
    check1 -- no --> skip
    check1 -- yes --> check2
    check2 -- no --> skip
    check2 -- yes --> check3
    check3 -- no --> skip
    check3 -- yes --> clamp
    clamp --> convert
    convert --> place
```

**Learning point:** because `subscribePlaces` filters out `null` results (`.filter((place): place is Place => place !== null)`), a malformed document in Firestore doesn't crash the app or show a broken card — it just silently disappears from the map/list. That's a deliberate trade-off between availability and strictness.

---

## 5. Hooks as state machines (the `useSyncExternalStore` pattern)

`useAuth`, `useLocation`, and `usePlaces` all use the **same pattern**: a module-level singleton object (outside React) plus a `Set` of listener callbacks, exposed to React via `useSyncExternalStore`. This means every component that calls `useAuth()` shares *one* Firebase subscription instead of each component creating its own.

```mermaid
stateDiagram-v2
    [*] --> NoSubscribers
    NoSubscribers --> Subscribed: first component calls the hook\n(listeners.size goes 0 -> 1)
    Subscribed --> Subscribed: more components subscribe/unsubscribe\nwhile at least 1 remains
    Subscribed --> NoSubscribers: last component unmounts\n(listeners.size hits 0)
    NoSubscribers --> NoSubscribers: store keeps last snapshot\nin memory (no listeners, no I/O)

    state Subscribed {
        [*] --> Loading
        Loading --> Ready: external API resolves\n(auth resolves / GPS fix / Firestore snapshot)
        Loading --> Error: external API rejects
        Error --> Loading: refresh() / retry / permission re-check
        Ready --> Loading: forced restart (usePlaces.refresh(),\n useLocation permission change)
    }
```

### Per-hook specifics

```mermaid
flowchart TB
    subgraph AuthStore ["useAuth module store — hooks/useAuth.ts"]
        A1["ensureAuthSubscription()\ncreates ONE onAuthStateChanged listener"]
        A2{"firebaseUser exists?"}
        A3["emit Ready snapshot with user+uid"]
        A4{"signInPromise\nalready in flight?"}
        A5["coalesce: just mark isLoading,\ndon't start a second sign-in"]
        A6["signInAnon() via authService\n(signInAnonymously)"]
        A1 --> A2
        A2 -- yes --> A3
        A2 -- no --> A4
        A4 -- yes --> A5
        A4 -- no --> A6
        A6 -- resolves --> A3
        A6 -- rejects --> A7["Error snapshot,\nhasResolved=true\n(retrySignIn() available)"]
    end

    subgraph LocationStore ["useLocation module store — hooks/useLocation.ts"]
        L1["ensurePermissionChecked()\ngetForegroundPermissionsAsync()"]
        L2{"permission granted?"}
        L3["ensureLocationWatcher()\nwatchPositionAsync, ONE subscription"]
        L4["stopLocationWatcher()\nno GPS use while denied/undetermined"]
        L5["AppState listener:\non foreground, re-check permission\n(no loading flicker if unchanged)"]
        L1 --> L2
        L2 -- yes --> L3
        L2 -- no --> L4
        L5 -.-> L1
    end

    subgraph PlacesStore ["usePlaces module store — hooks/usePlaces.ts"]
        P1["startPlacesSubscription()\nonSnapshot(collection 'places')"]
        P2["mapPlaceDocument per doc,\nfilter nulls, emit array"]
        P3["onError: null out the unsubscribe ref\nso refresh()/remount can restart it"]
        P4["refresh(): stop + start\n(used by pull-to-refresh & retry button)"]
        P1 --> P2
        P1 -. error .-> P3
        P4 --> P1
    end
```

### Hooks that keep **local** (non-shared) state

- `useCheckIn(placeId)` — [`hooks/useCheckIn.ts`](../hooks/useCheckIn.ts): scoped to one detail screen; uses an `inFlightRef` boolean to prevent overlapping `checkIn()` calls even before `setIsLoading` triggers a re-render.
- `useAdmin(uid)` — [`hooks/useAdmin.ts`](../hooks/useAdmin.ts): re-checks admin status via callable every time `uid` changes; uses a `cancelled` flag to avoid setting state after unmount.
- `useProximity(places, location)` — [`hooks/useProximity.ts`](../hooks/useProximity.ts): pure `useMemo` derivation, **not imported by any screen** (see §17). The detail screen recomputes distance inline instead.

---

## 6. Navigation & startup flow

```mermaid
sequenceDiagram
    actor Student
    participant Root as RootLayout (_layout.tsx)
    participant AuthHook as useAuth
    participant Index as index.tsx
    participant LocHook as useLocation
    participant Welcome as (auth)/welcome
    participant Tabs as (tabs)

    Student->>Root: Cold start
    Root->>AuthHook: subscribe (mount)
    AuthHook-->>Root: hasResolved=false (loading)
    Note over Root: Renders full-screen spinner only\n(fonts + first auth resolution)
    AuthHook-->>Root: hasResolved=true (signed in anonymously\nor persisted uid restored)
    Root->>Index: render Stack -> index route

    Index->>LocHook: read permission + isLoading
    alt permission still undetermined AND isLoading
        Index-->>Student: spinner (waiting on\ngetForegroundPermissionsAsync)
    else permission resolved to undetermined
        Index->>Welcome: <Redirect to (auth)/welcome>
        Student->>Welcome: taps Enable or Skip
        Welcome->>LocHook: requestPermission() [if Enable]
        Welcome->>Tabs: router.replace('/(tabs)') either way
    else permission is granted, denied, or restricted
        Index->>Tabs: <Redirect to (tabs)>
    end
```

**Learning point — why `isLoading` is gated on `permission === 'undetermined'`:** `useLocation`'s `isLoading` stays `true` until the *first GPS fix* arrives, which can take a few seconds even after permission is granted. If `index.tsx` waited for `isLoading` to fully clear, every relaunch would show a spinner. Instead it only blocks while the *permission itself* is unknown, then immediately routes — the Map/Detail screens handle "no GPS fix yet" states independently.

---

## 7. Realtime places data flow

```mermaid
flowchart LR
    json["data/places.json"] --> seed["scripts/seedPlaceCollection.ts"]
    seed -->|"Admin SDK batch writes\n(GeoPoint conversion)"| placesCol[("places" collection)]

    placesCol -->|"onSnapshot(collection)"| placesHook["usePlaces store"]
    placesCol -->|"onSnapshot(doc)"| subscribePlaceFn["subscribePlace()\n(used only by detail screen)"]

    placesHook --> mapScreen["MapScreen"]
    placesHook --> listScreen["PlacesScreen"]
    subscribePlaceFn --> detailScreen["PlaceScreen"]

    mapScreen --> markers["PlaceMarker × N"]
    listScreen --> cards["PlaceCard × N\n(sorted by name.localeCompare)"]

    aggregator["aggregateBusyPercent\n(scheduled function)"] -->|"updates busyPercent + lastUpdate"| placesCol
```

The client **never** writes `busyPercent` under normal operation — it's a derived/read-model field owned by the scheduled Cloud Function (or by an admin override).

---

## 8. Check-in sequence (client → callable → transaction)

This is the most security-sensitive flow in the app, so it's validated **twice**: once client-side for UX speed, once server-side because the client can't be trusted.

```mermaid
sequenceDiagram
    actor Student
    participant Detail as PlaceScreen
    participant Buttons as CheckInButtons
    participant Hook as useCheckIn
    participant Svc as checkInService
    participant Local as AsyncStorage
    participant Fn as submitCheckin (onCall)
    participant FS as Firestore

    Student->>Detail: tap a busy-level emoji
    Detail->>Buttons: onCheckIn(level)
    Note over Buttons: submittingRef guards against\ndouble-tap before any await
    Buttons->>Hook: checkIn(level, location)
    Note over Hook: inFlightRef guards against\nre-entrant calls
    Hook->>Svc: submitCheckin(placeId, level, location)
    Svc->>Local: getCooldownEndTime(placeId)
    alt local cooldown still active
        Local-->>Svc: end time in the future
        Svc-->>Hook: {status:'cooldown', cooldownEndsAt}
        Hook-->>Detail: show CooldownTimer, no network call
    else no local cooldown recorded
        Svc->>Fn: httpsCallable({placeId, level, location:{lat,lng,accuracy}})
        Fn->>Fn: require request.auth (else 'unauthenticated')
        Fn->>Fn: validate placeId (non-empty, no "/")
        Fn->>Fn: validate level in {1,2,3}
        Fn->>Fn: validate lat/lng ranges + accuracy > 0 and <= 30m
        Fn->>FS: transaction: get places/{placeId}\n+ get checkinCooldowns/{uid}_{placeId}
        alt place doc missing
            Fn-->>Svc: HttpsError 'not-found'
        else haversine(client, place.location) > 50m
            Fn-->>Svc: HttpsError 'failed-precondition' (too far)
        else cooldownEndsAt in the future
            Fn-->>Svc: HttpsError 'failed-precondition'\n+ details.cooldownEndsAt
            Svc->>Local: persist cooldown locally too\n(so next attempt short-circuits)
        else all checks pass
            Fn->>FS: transaction.set checkins/{auto-id}\n{placeId, level, timestamp, uid}
            Fn->>FS: transaction.set checkinCooldowns/{uid}_{placeId}\n{uid, placeId, lastCheckInAt, cooldownEndsAt}
            Fn-->>Svc: {id, placeId, level, timestamp, uid}
            Svc->>Local: setCooldown(placeId, timestamp)
            Svc-->>Hook: {status:'success', checkIn}
            Hook-->>Detail: router.back()
        end
    end
```

### Client-side gating vs. server-side authority

| Check | Client (`app/place/[id].tsx`) | Server (`functions/src/index.ts`) |
|---|---|---|
| Signed in | `!!uid && !authLoading` | `request.auth` required |
| Distance | `haversineDistance(...) <= CONFIG.CHECK_IN_RADIUS` (50m) | Recomputed server-side with the same formula, same 50m radius — **not trusted from client** |
| GPS accuracy | `location.accuracy <= CONFIG.MINIMUM_ACCURACY_TO_CHECK_IN` (30m) | Re-validated server-side (30m) |
| Cooldown | `AsyncStorage` lookup (fast, optimistic) | `checkinCooldowns/{uid}_{placeId}` document read inside the transaction (authoritative) |
| Level value | Fixed UI (only 3 buttons exist) | Explicitly checked `level === 1 \|\| 2 \|\| 3` |

**Golden rule demonstrated here:** the client's checks only affect *when the button is enabled* — they are convenience/UX, not security. The Cloud Function repeats every check because a user could call the callable directly (e.g. via curl with a forged auth token) and bypass the UI entirely.

---

## 9. `CheckInButtons` submission guard (UI state machine)

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Idle: press while disabled/isLoading/submittingRef=true\n(no-op, guarded before any await)
    Idle --> Submitting: press while enabled\n(submittingRef set true synchronously)
    Submitting --> Haptics: Haptics.impactAsync(Medium)
    Haptics --> AwaitingResult: await onCheckIn(level)
    AwaitingResult --> Idle: finally block resets submittingRef=false\n(regardless of success/failure)
```

Two layers of guard exist simultaneously: `submittingRef` in the component (prevents a second tap before React even re-renders) and `inFlightRef` in `useCheckIn` (prevents a second logical call). This redundancy is intentional — the ref check happens *before* the `await Haptics.impactAsync(...)` call, closing a race window that `disabled` alone wouldn't close (props only update after a re-render).

---

## 10. Admin authorization & overrides

Two **independent** authorization layers protect admin actions — the callable function (so the UI knows whether to render the panel) and Firestore rules (so a forged direct write is still rejected even if someone reverse-engineers the callable).

```mermaid
sequenceDiagram
    actor Admin
    participant Detail as PlaceScreen
    participant Hook as useAdmin
    participant Svc as adminService
    participant CheckFn as checkAdminStatus (onCall)
    participant ConfigDoc as config/admins
    participant Panel as AdminOverridePanel
    participant Rules as Firestore Rules
    participant PlaceDoc as places/{placeId}

    Admin->>Detail: opens a place
    Detail->>Hook: useAdmin(uid)
    Hook->>Svc: checkIsAdmin(uid)
    Svc->>CheckFn: httpsCallable({})
    CheckFn->>CheckFn: require request.auth
    CheckFn->>ConfigDoc: read uids array (Admin SDK,\nbypasses client-facing rules)
    ConfigDoc-->>CheckFn: uids: string[]
    CheckFn-->>Svc: {isAdmin: uid in uids}
    Svc-->>Hook: boolean (failures collapse to false)
    Hook-->>Detail: isAdmin=true -> render AdminOverridePanel

    Admin->>Panel: pick busy level or "Remove Override"
    Panel->>Svc: setAdminOverride(placeId, percent) / removeAdminOverride(placeId)
    Svc->>Svc: assertCurrentUserIsAdmin()\n(re-checks via checkAdminStatus again!)
    Svc->>Rules: updateDoc(places/{placeId}, {...})
    Rules->>Rules: isAdmin() -- reads config/admins via get()
    Rules->>Rules: onlyAffects(['busyPercent','adminOverride'])
    Rules->>Rules: validAdminOverride(): active must be true,\nsetBy must equal request.auth.uid, setAt is timestamp
    Rules-->>PlaceDoc: accept or permission-denied
    PlaceDoc-->>Detail: realtime onSnapshot update
```

**Learning point — defense in depth in action:** even though `adminService.setAdminOverride` already called `assertCurrentUserIsAdmin()` client-side, the Firestore rule *also* calls `isAdmin()`. If a non-admin user patched their local JS bundle to skip the client check, the rule would still reject the write, because `request.auth.uid` can't be forged.

### Admin data model

```mermaid
classDiagram
    class AdminConfigDoc {
        +string[] uids
    }
    class CheckAdminStatusResponse {
        +boolean isAdmin
    }
    class AdminOverride {
        +boolean active
        +number busyPercent
        +string setBy
        +Timestamp setAt
    }
    AdminConfigDoc "1" --> "*" AnonymousUID : authorizes
    AdminOverride --> AnonymousUID : setBy references
```

`config/admins` is denied to **all** client reads (`allow read, write: if false`), so the admin UID list can never be enumerated by inspecting network traffic — only the boolean result of `checkAdminStatus` is exposed.

---

## 11. Scheduled aggregation algorithm (`aggregateBusyPercent`, every 5 minutes)

```mermaid
flowchart TD
    start(["Scheduled trigger\nevery 5 minutes, us-central1"])
    getPlaces["Get all docs in 'places'"]
    empty{"placesSnapshot.empty?"}
    getCheckins["Query 'checkins'\nwhere timestamp >= now - 90min"]
    group["Group check-ins by placeId\n(Map<placeId, {level,timestamp}[]>)"]
    forEachPlace["For each place doc"]
    override{"place.adminOverride.active\n=== true?"}
    skip["Skip (don't touch this place)"]
    compute["calculateBusyPercent():\nweighted average of LEVEL_TO_PERCENT[level]\nweight = 0.5^(ageMinutes/30)"]
    latest["getLatestTimestamp() of\nthis place's check-ins"]
    changed{"busyPercent or lastUpdate\nactually changed?"}
    queue["Queue update {busyPercent, lastUpdate}"]
    noop["No-op (avoid needless write)"]
    commit["commitInChunks():\nbatch.update() in groups of 500"]
    done(["Done — log summary"])

    start --> getPlaces --> empty
    empty -- yes --> done
    empty -- no --> getCheckins --> group --> forEachPlace --> override
    override -- yes --> skip --> forEachPlace
    override -- no --> compute --> latest --> changed
    changed -- no --> noop --> forEachPlace
    changed -- yes --> queue --> forEachPlace
    forEachPlace -->|"all places processed"| commit --> done
```

**The decay formula**, in plain terms: a check-in from *right now* has weight `1.0`; a check-in from 30 minutes ago has weight `0.5`; one from 60 minutes ago has weight `0.25`; anything older than 90 minutes is excluded entirely. This makes `busyPercent` a *recency-weighted moving average*, so a burst of "very busy" reports 80 minutes ago barely affects the current number, while a report from 2 minutes ago dominates it.

| Level | Meaning | Percent value |
|---|---|---|
| 1 | Not busy | 0 |
| 2 | Moderate | 50 |
| 3 | Very busy | 100 |

---

## 12. Scheduled cleanup algorithm (`cleanupOldCheckins`, every 60 minutes)

```mermaid
flowchart TD
    start(["Scheduled trigger\nevery 60 minutes"])
    cutoff["cutoff = now - 90 minutes"]
    loop1{"Query checkins\nwhere timestamp < cutoff\nlimit 500"}
    empty1{"empty?"}
    delete1["batch.delete() all 500,\ncommit()"]
    full1{"got exactly 500\n(more may remain)?"}
    loop2{"Query checkinCooldowns\nwhere cooldownEndsAt < now\nlimit 500"}
    empty2{"empty?"}
    delete2["batch.delete() all 500,\ncommit()"]
    full2{"got exactly 500?"}
    done(["Done — log counts"])

    start --> cutoff --> loop1
    loop1 --> empty1
    empty1 -- yes --> loop2
    empty1 -- no --> delete1 --> full1
    full1 -- yes --> loop1
    full1 -- no --> loop2
    loop2 --> empty2
    empty2 -- yes --> done
    empty2 -- no --> delete2 --> full2
    full2 -- yes --> loop2
    full2 -- no --> done
```

**Pagination pattern worth learning:** rather than deleting everything in one unbounded query (which could exceed Firestore's 500-writes-per-batch limit or time out), the function loops with `limit(500)` and only stops once a page comes back with fewer than 500 results. This is a standard cursor-free pagination trick for bulk deletes.

---

## 13. Firestore entity-relationship model

```mermaid
erDiagram
    ANONYMOUS_USER ||--o{ CHECKIN : submits
    PLACE ||--o{ CHECKIN : receives
    ANONYMOUS_USER ||--o| CHECKIN_COOLDOWN : owns
    PLACE ||--o| CHECKIN_COOLDOWN : limits
    PLACE ||--o| ADMIN_OVERRIDE : may_have
    ADMIN_CONFIG }o--o{ ANONYMOUS_USER : authorizes

    ANONYMOUS_USER {
        string uid PK
    }
    PLACE {
        string placeId PK
        string name
        string type
        GeoPoint location
        number busyPercent
        Timestamp lastUpdate
    }
    CHECKIN {
        string checkinId PK
        string placeId FK
        number level
        Timestamp timestamp
        string uid FK
    }
    CHECKIN_COOLDOWN {
        string doc_id PK "uid_placeId"
        string uid FK
        string placeId FK
        Timestamp lastCheckInAt
        Timestamp cooldownEndsAt
    }
    ADMIN_CONFIG {
        string doc_id PK "admins"
        string_array uids
    }
    ADMIN_OVERRIDE {
        boolean active
        number busyPercent
        string setBy FK
        Timestamp setAt
    }
```

### Firestore access matrix

```mermaid
flowchart TB
    anyClient["Any client\n(unauthenticated or anonymous)"]
    adminClient["Admin client\n(uid in config/admins)"]
    cloudFn["Cloud Functions\n(Admin SDK — bypasses rules entirely)"]

    places[("places")]
    checkins[("checkins")]
    cooldowns[("checkinCooldowns")]
    config[("config/admins")]

    anyClient -->|"read: allowed"| places
    anyClient -.->|"create/delete: denied"| places
    adminClient -->|"update ONLY busyPercent/adminOverride,\nvalidated shape"| places

    anyClient -.->|"read/write: denied,\nuse submitCheckin callable"| checkins
    anyClient -.->|"read/write: denied"| cooldowns
    anyClient -.->|"read/write: denied,\nuse checkAdminStatus callable"| config

    cloudFn -->|"create/read/update/delete"| checkins
    cloudFn -->|"read/write/delete"| cooldowns
    cloudFn -->|"read only, used by isUidAdmin"| config
    cloudFn -->|"update busyPercent + lastUpdate"| places
```

Dashed arrows = attempted access the security rules reject outright.

---

## 14. Security model — defense in depth

```mermaid
flowchart LR
    ux["1. Client UX checks\n(distance, accuracy, cooldown, auth)\nUNTRUSTED — purely for responsiveness"]
    callable["2. Callable function validation\n(submitCheckin / checkAdminStatus)\nAUTHORITATIVE input validation"]
    txn["3. Firestore transaction\n(atomic read-then-write of\nplace + cooldown docs)"]
    rules["4. Firestore security rules\n(guards ANY direct client write,\neven ones the app never intends)"]
    data[("Stored data")]

    ux -.->|bypassable, not trusted| data
    ux --> callable --> txn --> data
    rules --> data
```

| Layer | File | What it stops |
|---|---|---|
| Client checks | [`app/place/[id].tsx`](../app/place/[id].tsx), [`services/checkInService.ts`](../services/checkInService.ts) | Nothing on its own — just improves UX / avoids obviously-doomed network calls |
| Callable validation | [`functions/src/index.ts`](../functions/src/index.ts) | Malformed input, wrong types, out-of-range values, missing auth |
| Firestore transaction | same file, `db.runTransaction(...)` | Race conditions — two simultaneous check-ins from the same uid+place can't both slip past the cooldown check |
| Security rules | [`firestore.rules`](../firestore.rules) | Any direct Firestore SDK write that skips the callable entirely (e.g. a modified client binary talking straight to Firestore) |

### Rule helper functions (class-diagram style summary)

```mermaid
classDiagram
    class isAuthenticated {
        +returns request.auth != null
    }
    class isAdmin {
        +isAuthenticated() AND
        +config/admins exists AND
        +request.auth.uid in uids
    }
    class onlyAffects {
        +diff(resource.data).affectedKeys()\n.hasOnly(fields)
    }
    class validPercent {
        +is number, 0 to 100 inclusive
    }
    class validAdminOverride {
        +is map with EXACT keys\n[active, busyPercent, setBy, setAt]
        +active == true
        +setBy == request.auth.uid
        +setAt is timestamp
    }
    isAdmin --> isAuthenticated : uses
    validAdminOverride --> validPercent : uses
```

`onlyAffects(['busyPercent', 'adminOverride'])` is the field-level security trick: even a legitimate admin, using their own legitimate credentials, physically cannot change `place.name` or `place.location` through this rule path — the diff between old and new document is inspected key-by-key.

---

## 15. Deployment & tooling

```mermaid
flowchart TB
    subgraph repoSrc ["Repository"]
        appCode["app/, components/, hooks/,\nservices/, constants/, types/"]
        appJson["app.json\n(Expo SDK 54 config)"]
        fnSrc["functions/src/index.ts"]
        rulesFile["firestore.rules"]
        indexesFile["firestore.indexes.json"]
        firebaseJson["firebase.json"]
        seedData["data/places.json"]
    end

    subgraph buildOut ["Build artifacts"]
        expoClient["Expo Go / native build\n(EAS project be5c0765-...)"]
        fnLib["functions/lib (compiled JS)"]
    end

    subgraph cloud ["Firebase project: campusactivity-ec1f2"]
        firestoreCloud[(Firestore)]
        functionsCloud["Deployed Cloud Functions"]
        authCloud["Anonymous Auth"]
    end

    subgraph emulators ["Local Firebase Emulator Suite\n(firebase emulators:start)"]
        authEmu["Auth :9099"]
        fnEmu["Functions :5001"]
        fsEmu["Firestore :8080"]
        ui["Emulator UI"]
    end

    appCode --> expoClient
    appJson --> expoClient
    fnSrc -->|"npm run build (predeploy hook)"| fnLib
    fnLib -->|"firebase deploy --only functions"| functionsCloud
    rulesFile -->|"firebase deploy --only firestore:rules"| firestoreCloud
    indexesFile -->|"firebase deploy --only firestore:indexes"| firestoreCloud
    seedData --> seedScript["scripts/seedPlaceCollection.ts"]
    seedScript -->|"Admin SDK, GOOGLE_APPLICATION_CREDENTIALS"| firestoreCloud
    seedScript -.->|"FIRESTORE_EMULATOR_HOST"| fsEmu
    firebaseJson --> cloud
    firebaseJson --> emulators
    expoClient --> authCloud
    expoClient --> firestoreCloud
    expoClient --> functionsCloud
```

### Operational scripts

```mermaid
flowchart LR
    seed["seedPlaceCollection.ts\nbatch-writes places from JSON"] --> placesCol[("places")]
    test["testCheckInFunction.ts\nAdmin SDK test utility —\nBYPASSES auth/proximity/callable validation"] --> checkinsCol[("checkins")]
    test --> localAgg["local copy of the decay\naggregation logic"] --> placesCol
    cleanupScript["cleanupCheckInTestData.ts\ndeletes only uid='test-script' docs"] --> checkinsCol
```

**Important operational note:** `testCheckInFunction.ts` intentionally writes directly to `checkins` using the Admin SDK — it is a developer testing tool, not a code path any real user can reach (the security rules block `checkins` writes for normal clients; only the Admin SDK, used by Cloud Functions and this script, can write there).

### Runtime facts worth knowing

- `config/firebase.ts` contains a **public** client config (`apiKey`, `projectId`, etc.) — this is normal for Firebase web/mobile apps and is not a secret; security comes from rules + callable validation, not from hiding these values.
- The client never calls `connectAuthEmulator` / `connectFirestoreEmulator` / `connectFunctionsEmulator`, so running `firebase emulators:start` does **not** automatically redirect the running app to local emulators.
- There's no `.firebaserc` committed, so `firebase deploy` depends on the developer's local CLI project selection or an explicit `--project` flag.
- `app.json` declares `output: "static"` for web and `npm run web` exists, but `react-native-maps` (used by `MapScreen`) makes the web target effectively non-functional for the core feature — this is primarily a mobile (iOS/Android) app.

---

## 16. Design tokens (`constants/theme.ts`)

```mermaid
classDiagram
    class COLORS {
        +primary[50..900] : crimson scale
        +secondary[50..900] : teal scale
        +accent[50..900] : amber scale
        +status : green/yellow/red (+Light variants)
        +neutral[0..900] : warm gray scale
    }
    class SEMANTIC_COLORS {
        +background : primary/warm/card/overlay
        +text : primary/secondary/tertiary/inverse
        +interactive : primary/secondary/disabled states
        +border : light/default/focus
    }
    class FONTS {
        +display : Outfit_500/600/700
        +body : Figtree_400/600/700
    }
    class SPACING {
        +scale : 0,4,8,12,16,20,24,32,40,48,64
    }
    class RADIUS {
        +sm..2xl, full
    }
    class SHADOWS {
        +sm, md, lg, primaryGlow, warm
    }
    class ANIMATION {
        +duration : fast/normal/slow
        +spring : damping/stiffness/mass
        +pressScale : 0.97
    }
    class getBusyStatus {
        +percent number
        +returns color, label, lightBg, emoji
    }

    SEMANTIC_COLORS --> COLORS : derived from
    getBusyStatus --> COLORS : reads CONFIG.BUSY_THRESHOLDS
```

`getBusyStatus(percent)` is the single source of truth for how a busy percentage becomes a color/label/emoji (`<=30%` green "Not Busy", `<=60%` yellow "Moderate", else red "Busy"). It's used by `PlaceCard`, `PlaceMarker`'s screen equivalent, and the detail screen's hero section.

---

## 17. Known dead code & implementation caveats

These were confirmed by grepping actual usage across the codebase — call these out explicitly since a lot of "system design" understanding comes from knowing what's *not* actually wired up:

| Symbol | Defined in | Actually imported by a screen/component? |
|---|---|---|
| `useProximity` | [`hooks/useProximity.ts`](../hooks/useProximity.ts) | **No.** `PlaceScreen` computes `isNearby`/distance inline with `haversineDistance` instead. |
| `getPlaceById` | [`services/placeService.ts`](../services/placeService.ts) | **No.** The detail screen uses `subscribePlace` (realtime) exclusively. |
| `getNearbyPlaces`, `findNearbyPlace` | [`services/proximityService.ts`](../services/proximityService.ts) | **No.** Only `calculateProximityForAllPlaces` and `isAccuracyGoodEnough` are reachable, and only through the unused `useProximity`. |
| `CONFIG.LOCATION_UPDATE_INTERVAL`, `MINIMUM_DISTANCE_TO_UPDATE_LOCATION`, `MINIMUM_ACCURACY_TO_UPDATE_LOCATION` | [`constants/config.ts`](../constants/config.ts) | **No.** `locationService.watchLocation` hardcodes its own defaults (`5000`ms / `10`m) that happen to match two of these values by coincidence, not by import. |
| `BUSY_LEVEL_ICONS`, `BUSY_COLORS` | [`constants/theme.ts`](../constants/theme.ts) | **No.** Components define their own local emoji/color maps (see §3's note about `PLACE_TYPE_ICONS` duplication) instead of importing these. |

Other caveats worth knowing while reading the source:

- `mapPlaceDocument` requires an **exact lowercase** match against the 9-value `PLACE_TYPE` set — a typo'd `type` field in Firestore silently drops the whole place from every list/map.
- `adminService.checkIsAdmin` converts *any* failure (network error, function cold-start timeout, etc.) to `false` — a transient failure is indistinguishable from "not an admin" in the UI.
- `adminOverride.setBy` (an admin's UID) is stored inside the publicly-readable `places` document, so it's technically exposed to any client reading that place, even though `config/admins` itself is fully locked down.
- `StaleIndicator` compares `Date.now()` at render time only — it won't automatically re-render exactly when data crosses the 90-minute stale threshold; it just happens to look right on the next unrelated re-render (e.g. the next Firestore snapshot).
- The device's submitted GPS coordinates are used only to validate distance server-side and are **never stored** — the `checkins` document only persists `placeId`, `level`, `timestamp`, and `uid`.

---

## 18. Reading guide (suggested order through the actual source)

1. [`app/_layout.tsx`](../app/_layout.tsx) — global navigation shell, font loading, error boundary.
2. [`hooks/useAuth.ts`](../hooks/useAuth.ts) + [`services/authService.ts`](../services/authService.ts) — the shared external-store pattern, applied to Firebase Auth.
3. [`hooks/useLocation.ts`](../hooks/useLocation.ts) — the same pattern applied to a native device API with foreground/background lifecycle concerns.
4. [`services/placeService.ts`](../services/placeService.ts) — realtime Firestore snapshots turned into validated domain objects.
5. [`services/checkInService.ts`](../services/checkInService.ts) → [`functions/src/index.ts`](../functions/src/index.ts) — compare the "fast but untrusted" client checks against the "slow but authoritative" server checks.
6. [`firestore.rules`](../firestore.rules) — the final, unbypassable permission layer; read the comments, they're written as a mini security-rules tutorial.
7. `aggregateBusyPercent` and `cleanupOldCheckins` in [`functions/src/index.ts`](../functions/src/index.ts) — how raw events (`checkins`) become a derived read model (`places.busyPercent`), and how retention is enforced over time.

If you read those seven files in order, you'll have touched every architectural pattern in this document: shared external stores, service-layer adapters, defense-in-depth security, and event-sourced derived data.
