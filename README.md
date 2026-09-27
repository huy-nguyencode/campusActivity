# Campus Spots

A real-time crowd-tracking iOS app for Temple University's campus. Students can check in at campus locations (dining halls, libraries, food trucks, etc.) to report how busy a spot is — helping others decide where to go before they walk there.

## Features

- **Interactive map** — All campus spots plotted on a live map with type-based icons
- **List view** — Alphabetically sorted list of all locations with busy status
- **Real-time crowd data** — Busy levels update every 5 minutes via a Firebase Cloud Function
- **Anonymous check-in** — Rate a spot as Not Busy / Moderate / Very Busy when you're within 50m
- **90-minute cooldown** — Prevents spam; a countdown timer shows when you can check in again
- **Stale data indicator** — Warns users when data hasn't been updated in a while
- **Admin override** — Admins can manually pin a location's busy level, bypassing the aggregation
- **Privacy first** — No account required; location is used only on-device and never stored

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 57) |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Anonymous Auth |
| Backend | Firebase Cloud Functions (scheduled) |
| Maps | react-native-maps |
| Animation | React Native Reanimated |
| Fonts | Outfit (display) + Figtree (body) |

## How It Works

1. A user opens the app and checks in at a nearby location, selecting a busy level (1–3).
2. Check-ins are written to Firestore. A Cloud Function runs every 5 minutes and computes a weighted average using exponential decay (30-minute half-life) so recent check-ins matter more.
3. The resulting `busyPercent` (0–100) is written back to each place document.
4. All clients subscribed via `onSnapshot` receive the update instantly.

## Project Structure

```
app/                  Expo Router screens
  (auth)/welcome      Location permission onboarding
  (tabs)/index        Map screen
  (tabs)/places       List screen
  place/[id]          Place detail + check-in
components/           Reusable UI components
docs/                 Architecture, spec, implementation, and privacy docs
  admin/              Admin override panel
  checkin/            Check-in buttons, cooldown timer, stale indicator
  map/                Custom map marker
  navigation/         Floating pill tab bar
  places/             Place card
config/               Firebase initialization
constants/            Theme tokens and app config
functions/src/        Cloud Function (busy percent aggregation)
hooks/                Custom React hooks
services/             Purpose-built domain services
types/                TypeScript interfaces
utils/                Shared calculation helpers
```

## Getting Started

```bash
npm install
npm start          # Expo development server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run lint       # ESLint
```

## Campus Data

33 Temple University locations are seeded: dining halls (J&H, Morgan Hall), Charles Library, IBC Student Recreation Center, The Wall vendors, and off-campus food trucks and restaurants.
