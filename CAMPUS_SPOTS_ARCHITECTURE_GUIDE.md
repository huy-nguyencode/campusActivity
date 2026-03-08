# Campus Spots Architecture Guide

## Full codebase walkthrough for junior developers

## 1. Purpose of the app

Campus Spots is a React Native mobile app built with Expo. The app helps Temple University students quickly see how busy campus locations are before walking there.

Users can:

- open the app without creating a personal account
- browse places on a map
- browse places in a list
- open a detail screen for a place
- check in and report how busy a place feels
- see crowd levels update from Firestore in near real time

The app is privacy-focused. It uses anonymous authentication, and the client uses location on-device to decide whether a user is close enough to check in. The app does not send a full location history to the backend.

## 2. Tech stack

Main technologies used in this repo:

- React Native
- Expo SDK 54
- TypeScript
- Expo Router for file-based navigation
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- AsyncStorage
- expo-location
- react-native-maps
- react-native-reanimated
- expo-linear-gradient

This is a modern mobile stack. A junior developer should notice that the app is not just "React screens". It combines UI, device APIs, realtime data, authentication, backend jobs, and security rules.

## 3. Top-level architecture

This codebase follows a layered structure:

- `app/`: screens and routing
- `components/`: reusable UI
- `hooks/`: React state adapters that connect screens to services
- `services/`: wrappers around Firebase and device APIs
- `config/`: setup code such as Firebase initialization
- `functions/`: backend Cloud Functions
- `constants/`: business constants and theme tokens
- `types/`: shared TypeScript domain types
- `utils/`: pure helper logic
- `data/`: seed data

This separation matters because real apps become hard to maintain if every screen tries to do everything itself.

Good rule of thumb:

- screens coordinate user flows
- components render reusable UI
- hooks expose state to React
- services talk to external systems
- backend functions enforce sensitive logic

## 4. Repository structure

Important folders and files:

- `app/_layout.tsx`: root app layout
- `app/index.tsx`: redirect entry screen
- `app/(auth)/welcome.tsx`: location permission onboarding
- `app/(tabs)/_layout.tsx`: tab configuration
- `app/(tabs)/index.tsx`: map screen
- `app/(tabs)/places.tsx`: places list screen
- `app/place/[id].tsx`: place detail and check-in screen
- `components/checkin/`: cooldown, stale warning, and check-in buttons
- `components/map/PlaceMarker.tsx`: map pin UI
- `components/places/PlaceCard.tsx`: list card UI
- `components/navigation/FloatingTabBar.tsx`: custom bottom navigation
- `components/admin/AdminOverridePanel.tsx`: admin-only override controls
- `hooks/useAuth.ts`: shared auth state
- `hooks/useLocation.ts`: location permission and watcher state
- `hooks/usePlaces.ts`: shared Firestore places subscription
- `hooks/useCheckIn.ts`: check-in and cooldown logic
- `services/auth.ts`: Firebase auth calls
- `services/location.ts`: Expo location calls
- `services/places.ts`: Firestore place reads and subscriptions
- `services/checkin.ts`: callable function submission and local cooldown
- `services/admin.ts`: admin lookups and override writes
- `config/firebase.ts`: Firebase app setup
- `constants/config.ts`: behavioral constants
- `constants/theme.ts`: color, spacing, font, shadow, and helper tokens
- `types/index.ts`: domain models
- `utils/haversine.ts`: distance math
- `functions/src/index.ts`: Cloud Functions backend
- `firestore.rules`: database security rules
- `data/places.json`: seed list of campus places

## 5. App startup flow

The app begins in `app/_layout.tsx`.

This file:

- prevents the splash screen from hiding too early
- loads the custom fonts
- waits for auth state to finish loading
- wraps the app in an error boundary
- creates the root stack navigator

This is a normal production pattern. Real apps often need startup logic before users see their first screen.

Important lesson for junior developers:

- app startup is usually asynchronous
- authentication often needs initialization time
- font loading and asset loading are normal startup tasks
- navigation is often decided after startup checks are complete

## 6. Routing and navigation

This app uses Expo Router, which means the file system defines the route structure.

Main routes:

- `app/index.tsx`
- `app/(auth)/welcome.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/places.tsx`
- `app/place/[id].tsx`

There are two route groups:

- `(auth)` for onboarding
- `(tabs)` for the main app

The flow is:

1. App boots.
2. `app/index.tsx` checks location permission with `useLocation()`.
3. If permission is undetermined, the app redirects to `/(auth)/welcome`.
4. Otherwise the app redirects to `/(tabs)`.

Inside the tabs group, the app uses a custom bottom tab bar instead of the default one. That custom bar lives in `components/navigation/FloatingTabBar.tsx`.

Junior developer lesson:

- route groups are useful for organizing screens
- navigation files should focus on route flow, not backend logic
- custom navigation UI can still reuse the navigation library's state

## 7. Main screens

### `app/(auth)/welcome.tsx`

This is the permission onboarding screen.

Responsibilities:

- explain the app
- explain the privacy model
- request location permission
- allow the user to skip for now

It uses:

- `useLocation()`
- Reanimated press interactions
- shared theme tokens

Why this matters:

- permission requests work better when the app explains why it needs them
- onboarding screens are both UX and engineering work

### `app/(tabs)/index.tsx`

This is the map screen.

Responsibilities:

- subscribe to all places with `usePlaces()`
- read current location with `useLocation()`
- set the initial map region
- show the user location on the map
- render each place with `PlaceMarker`
- navigate to a place detail screen when a marker is pressed

This screen is intentionally thin. It does not directly query Firestore. The hook layer handles that.

### `app/(tabs)/places.tsx`

This is the list screen.

Responsibilities:

- subscribe to places with `usePlaces()`
- sort them alphabetically
- render them in a `FlatList`
- navigate to detail pages
- expose pull-to-refresh UX

Important detail:

`usePlaces().refresh()` is basically a UX helper because Firestore snapshots already keep the data current.

### `app/place/[id].tsx`

This is the most important screen in the app.

Responsibilities:

- read the dynamic route parameter
- subscribe to one place document
- read current location
- read current auth UID
- check whether the user is near enough
- check whether GPS accuracy is good enough
- check whether the place is on cooldown for that user
- render busy status
- render stale-data warning
- render check-in buttons
- render admin override controls for admins

This file is the best example of how a screen should coordinate several pieces of logic without owning every low-level detail itself.

## 8. Reusable UI components

### `components/map/PlaceMarker.tsx`

Renders one map marker.

Responsibilities:

- map a place type to an emoji icon
- render a `Marker`
- hide the default map callout bubble
- trigger navigation when tapped

Why it exists:

- the map screen stays simple
- marker visuals are kept in one place

### `components/places/PlaceCard.tsx`

Renders one place in the list view.

Responsibilities:

- show place icon
- show name and type
- show current busy label and color
- animate on press

This component uses `getBusyStatus()` from `constants/theme.ts` to turn raw percent data into user-facing status UI.

### `components/checkin/CheckInButtons.tsx`

Renders the three crowd-report options:

- Not Busy
- Moderate
- Very Busy

Responsibilities:

- display the three options
- disable presses when check-in is not allowed
- show a loading overlay during submit
- trigger haptic feedback

This component is presentational. It does not know how Firestore works.

### `components/checkin/CooldownTimer.tsx`

Shows the remaining wait time before the user can check in again.

Responsibilities:

- receive a cooldown end time
- compute remaining time every second
- display circular progress
- stop when finished

Junior developer lesson:

- interval-based UI must clean itself up on unmount
- time-based components usually keep their own local display state

### `components/checkin/StaleIndicator.tsx`

Shows whether a place has stale or missing crowd data.

Responsibilities:

- show a "no data" state when no update exists
- show nothing if the data is fresh
- show a warning if the update is older than the stale threshold

This is a good product detail. It tells users how trustworthy the number is.

### `components/admin/AdminOverridePanel.tsx`

Admin-only control panel for setting a place's busy level manually.

Responsibilities:

- render override options
- call the override functions
- show active state and loading state
- let admins remove an override

Why it matters:

- it gives humans a way to intervene when needed
- it fits into the backend aggregation system cleanly

### `components/navigation/FloatingTabBar.tsx`

Custom bottom tab bar.

Responsibilities:

- render a floating pill UI
- use navigation state from React Navigation / Expo Router
- highlight the active tab
- handle tab presses

### `components/ErrorBoundary.tsx`

Global error boundary for the React tree.

Responsibilities:

- catch render-time errors
- log them
- show fallback UI
- let the user retry

Junior developer lesson:

- error boundaries are one of the few React cases where class components are still common

## 9. Hooks: the state layer

The hooks in this project are where React-friendly app state is assembled.

### `hooks/useAuth.ts`

Responsibilities:

- subscribe to Firebase auth state
- automatically sign in anonymously if no user exists
- expose `user`, `uid`, `isLoading`, and `error`

Important pattern:

This hook uses module-level state plus `useSyncExternalStore`.

Why that is useful:

- there is one shared auth snapshot for the app
- there is one auth subscription instead of many duplicate subscriptions
- multiple components can read the same state safely

### `hooks/useLocation.ts`

Responsibilities:

- check current permission state
- expose `requestPermission()`
- start watching location if permission is granted
- expose current location, permission, loading, and error state

Important detail:

The hook stops the location watcher when nobody is listening anymore. That saves resources.

### `hooks/usePlaces.ts`

Responsibilities:

- subscribe to the `places` collection
- expose `places`, `isLoading`, `error`, and `refresh`

This is another shared external-store hook. It is a lightweight alternative to adding a global state library.

### `hooks/useCheckIn.ts`

Responsibilities:

- track whether the current place is on cooldown
- compute the cooldown end time
- expose a `checkIn()` function
- expose loading and error state for the submission

This hook mixes local UI state with service-level async actions.

### `hooks/useProximity.ts`

Responsibilities:

- compute distance from the user to places
- return ordered proximity results
- return the nearest nearby place
- check whether GPS accuracy is good enough

This is a derived-data hook. It mostly turns raw location and place data into something the UI can use.

### `hooks/useAdmin.ts`

Responsibilities:

- check whether the current UID is an admin
- expose admin-only actions for overrides

## 10. Services: the API layer

The service layer hides direct Firebase and device API details from the rest of the app.

### `services/auth.ts`

Provides:

- anonymous sign-in
- auth-state listener
- access to the current Firebase user

### `services/location.ts`

Provides:

- permission request
- permission check
- live location watching

This wraps `expo-location` so React screens do not need to deal with raw API details.

### `services/places.ts`

Provides:

- subscription to all places
- subscription to one place
- place document mapping from Firestore shape to app shape

Why the mapping matters:

- Firestore returns generic objects and timestamps
- the UI wants typed values like `Date | null`
- keeping this translation in one place reduces bugs

### `services/checkin.ts`

Provides:

- submission of check-ins through a callable Firebase function
- local cooldown mirroring through AsyncStorage
- helper functions for checking, reading, and clearing cooldown state

Important design point:

The client stores cooldown locally for good UX, but the server also enforces cooldown so users cannot bypass it by modifying the app.

### `services/proximity.ts`

Provides:

- distance calculations
- nearby-place detection
- accuracy checks

This is mostly pure business logic and is easy to reason about because it is not tightly coupled to React.

### `services/admin.ts`

Provides:

- admin lookup through `config/admins`
- admin override writes
- override removal

## 11. Firebase setup

`config/firebase.ts` initializes the Firebase app and exports:

- `auth`
- `db`
- `functions`

Important detail:

Firebase auth is configured with React Native persistence using AsyncStorage. That lets the anonymous session survive app restarts.

Junior developer lesson:

- Firebase web config values in a client app are not treated like secret server credentials
- real protection comes from security rules and server-side validation

## 12. Backend Cloud Functions

The `functions/` folder is its own TypeScript backend project.

There are two key backend functions.

### `submitCheckin`

This is a callable function.

Responsibilities:

- require authentication
- validate `placeId`
- validate `level`
- ensure the place exists
- enforce cooldown server-side
- write a new check-in document
- write a cooldown document

This function is important because it moves sensitive business logic off the client.

### `aggregateBusyPercent`

This is a scheduled function that runs every 5 minutes.

Responsibilities:

- load recent check-ins
- group them by place
- apply exponential decay so recent reports matter more
- calculate a weighted busy percent
- write `busyPercent` and `lastUpdate` to each place
- skip places that have active admin overrides

This design lets the client read a simple summary field instead of recomputing crowd math on every device.

## 13. Firestore data model

Main collections:

- `places`
- `checkins`
- `checkinCooldowns`
- `config`

### `places`

Stores information needed by the UI:

- name
- type
- coordinates
- busy percent
- last update timestamp
- optional admin override metadata

This is the collection the app subscribes to in real time.

### `checkins`

Stores raw user-submitted crowd reports:

- place ID
- level
- timestamp
- anonymous user ID

These are input events, not final display values.

### `checkinCooldowns`

Stores cooldown enforcement data per user and place.

This supports secure server-side cooldown enforcement.

### `config/admins`

Stores the list of admin UIDs.

The client reads this to decide whether to show admin controls.

## 14. Firestore security rules

`firestore.rules` is one of the most important files in the repo.

It enforces:

- anyone can read `places`
- clients cannot create or delete places
- only admins can update the allowed override fields on places
- clients cannot directly write to `checkins`
- clients cannot directly read or write `checkinCooldowns`
- config documents are readable by authenticated users but not writable by clients

Junior developer lesson:

- client-side guards improve UX
- security rules enforce truth
- never trust the client to protect your backend

## 15. Constants and theme system

### `constants/config.ts`

Defines app behavior values like:

- check-in radius
- location update interval
- minimum accuracy for check-in
- cooldown length
- stale-data threshold
- busy threshold values

This is where product behavior becomes concrete code.

### `constants/theme.ts`

Defines UI tokens like:

- color palette
- semantic colors
- font families
- font sizes
- spacing values
- radii
- shadows
- animation constants
- helper functions such as `getBusyStatus()`

Junior developer lesson:

- a theme system is not just for colors
- it keeps UI consistent and easier to refactor

## 16. Types and utility helpers

### `types/index.ts`

Defines the app's domain model:

- `Place`
- `AdminOverride`
- `CheckIn`
- `BusyLevel`
- `LocationState`
- `ProximityResult`
- `LocationPermissionStatus`

Understanding these types makes the rest of the codebase much easier to follow.

### `utils/haversine.ts`

Defines the geographic distance helper used for proximity checks.

This is a good example of pure utility code:

- it is independent of React
- it is independent of Firebase
- it is easy to test

## 17. Full data flow from launch to check-in

This is the most useful system-level walkthrough.

1. The app boots in `app/_layout.tsx`.
2. `useAuth()` initializes Firebase anonymous auth state.
3. `app/index.tsx` uses `useLocation()` to check permission.
4. The user is routed either to `/(auth)/welcome` or the main tabs.
5. The map and list screens subscribe to `places` in Firestore.
6. The user opens `app/place/[id].tsx`.
7. The detail screen subscribes to the selected place and reads local location state.
8. The app computes proximity and GPS accuracy.
9. The app checks cooldown state for that place.
10. If allowed, the user taps one of the check-in buttons.
11. `services/checkin.ts` calls the callable backend function.
12. `submitCheckin` validates and writes the event server-side.
13. The scheduled aggregation function recomputes `busyPercent`.
14. Firestore `onSnapshot` pushes the updated place data to the client.
15. The map, list, and detail UIs refresh automatically.

That is the heart of the app.

## 18. Important engineering lessons for junior developers

### Separation of concerns

Do not put every piece of logic inside a screen. This repo shows a cleaner pattern:

- services for external APIs
- hooks for React state integration
- components for reusable UI
- backend for sensitive business rules

### Shared external stores

`useSyncExternalStore` is used to build lightweight shared state for auth, location, and places. This is a useful pattern when you want globally shared live data without adding Redux or another state library.

### Client checks versus server checks

The app disables check-in when:

- the user is too far away
- GPS accuracy is too low
- cooldown is active

That improves UX, but the backend still validates important rules. This is the correct architecture.

### Realtime data changes UI design

Because Firestore snapshots are live:

- screens do not need manual polling
- the UI can be simple and reactive
- a "refresh" action may exist for UX even if it does not trigger a true fetch

### Derived data should stay derived

Examples:

- busy label from `busyPercent`
- stale warning from `lastUpdate`
- nearest place from places plus location

These should be computed, not redundantly stored.

### Cleanup matters

Location subscriptions and intervals should be cleaned up when no longer needed. This codebase does a good job of handling that.

## 19. Admin override system

The admin override system is a controlled exception to the normal aggregation model.

Flow:

1. `useAdmin(uid)` checks the current UID against `config/admins`.
2. If the user is an admin, `app/place/[id].tsx` shows `AdminOverridePanel`.
3. The admin can set a manual busy value.
4. The place document stores override metadata.
5. The scheduled aggregation job skips overridden places.

This is a good example of adding operational controls without breaking the rest of the architecture.

## 20. Non-app documentation in the repo

Useful reference docs already present:

- `README.md`
- `SPEC.md`
- `IMPLEMENTATION_PLAN.md`
- `PRIVACY.md`

These are helpful for context, but the code should still be treated as the final source of truth if a doc and the implementation differ.

## 21. What to study first if you want to learn this repo

Recommended reading order:

1. `types/index.ts`
2. `constants/config.ts`
3. `config/firebase.ts`
4. `app/_layout.tsx`
5. `app/index.tsx`
6. `hooks/useAuth.ts`
7. `hooks/useLocation.ts`
8. `hooks/usePlaces.ts`
9. `services/places.ts`
10. `app/(tabs)/index.tsx`
11. `app/(tabs)/places.tsx`
12. `app/place/[id].tsx`
13. `services/checkin.ts`
14. `functions/src/index.ts`
15. `firestore.rules`

Why this order works:

- types define the data model
- config defines the rules
- app files define the user flow
- hooks and services show how state and APIs connect
- backend files explain what is really enforced

## 22. Final mental model

If you want one short summary of the whole architecture:

Campus Spots is a realtime Expo app where screens stay relatively thin, hooks expose app state, services wrap Firebase and device APIs, and backend functions plus security rules protect the important business logic.

If you want to remember each layer:

- `app/` decides where the user is
- `components/` decide what the UI looks like
- `hooks/` decide what state the UI receives
- `services/` decide how external systems are called
- `functions/` decide what the backend allows and computes
- `firestore.rules` decide what the database rejects
- `constants/` keep visual and behavioral rules centralized
- `types/` define the shared language of the app
