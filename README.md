# Campus Spots

An Expo React Native app for reporting and viewing crowd levels at Temple University campus locations.

Students browse a map or list, then report a crowd level when they are within 50 meters of a place. Firebase Anonymous Auth identifies the user; a callable function validates the location and enforces a 90-minute cooldown. The server stores reports, not submitted GPS coordinates.

## Project layout

```text
app/                         Expo Router routes and navigation layouts
screens/                     Named screen implementations
  AppEntryScreen.tsx         Initial location-permission routing
  LocationWelcomeScreen.tsx  Location onboarding
  MapScreen.tsx              Campus map
  PlacesListScreen.tsx       Campus list
  PlaceDetailsScreen.tsx     Place details, check-in, and admin controls
components/                  Reusable UI (PascalCase filenames)
hooks/                       React state adapters (useName filenames)
services/                    Firebase/device integrations (kebab-case filenames)
  place-subscriptions.ts     Shared, foreground-only collection/document listeners
  place-document-mapper.ts   Validate database documents and convert them to Place
  check-in-service.ts        Callable requests and local cooldown storage
  admin-service.ts           Cached permission hints and protected override writes
config/firebase-client.ts    Client initialization and optional emulator connections
constants/app-config.ts      Client behavior and distance thresholds
constants/theme-tokens.ts    Colors, typography, and spacing
types/domain.ts              Shared client data types
utils/geo-distance.ts        Pure distance calculations
data/campus-places.json      36 campus places for seeding
functions/src/
  index.ts                   Stable Firebase deployment exports
  callable/                  Check-in and admin-status request handlers
  scheduled/                 15-minute crowd refresh and hourly retention cleanup
  operations/                Database orchestration for crowd aggregation
  domain/                    Pure crowd math and server check-in validation
  shared/                    Admin connection, configuration, types, runtime settings
scripts/                     Seed, simulate, clean up test data, and export docs
docs/                        Developer walkthrough, design, costs, product, privacy
```

Expo Router and tools depend on names such as `index.tsx`, `_layout.tsx`, `package.json`, and `firebase.json`. Route files re-export named screens so navigation stays stable. Services and scripts use kebab-case; React components and hooks follow their usual naming conventions.

## Development

```bash
npm install
npm --prefix functions install
npm start
npm run ios
npm run android
```

To use Firebase locally, copy `.env.example` to `.env.local`, then run `npm run emulators` in one terminal and `npm start` in another. Restart Expo after changing environment variables. The Firebase CLI and a Java runtime compatible with its Firestore emulator must be installed.

For an iOS simulator the emulator host is `127.0.0.1`; for an Android emulator use `10.0.2.2`. On a physical device use the computer's LAN IP. Release builds always use the cloud. Omitting the emulator flag during development also uses the cloud.

Seed the running local emulator:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=campusactivity-ec1f2 npm run seed:places
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=campusactivity-ec1f2 npm run simulate:check-ins -- --place charles-library --level 2 --count 3
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=campusactivity-ec1f2 npm run cleanup:test-check-ins
```

Data scripts require the emulator environment variable or an explicit `--production` argument for cloud writes. Production scripts also need Admin SDK credentials. Seeding replaces place documents; use it to initialize data rather than refresh an active campus.

## Cost behavior

Crowd summaries refresh every **15 minutes**. The aggregation queries recent check-ins, places with a saved crowd timestamp, and places with a nonzero crowd level. It fetches any additional places referenced by first check-ins. This avoids scanning every idle place while still resetting expired summaries and preserving admin overrides. Changed documents are written with version checks so concurrent admin edits trigger a retry rather than being overwritten.

Scheduled functions use fractional CPU and zero reserved instances. The hourly cleanup still removes old reports and cooldowns. The app shares listeners between the map, list, and details, falls back to a single-document listener for direct links, and suspends them in the background. Admin permission hints are cached for five minutes; Firestore rules authorize every override write.

See [the cost walkthrough](docs/firebase-costs.md) for exact code paths, estimates, tradeoffs, and deployment instructions. These changes do not guarantee a zero bill: free quotas, database eligibility, credits, active users, and deployment storage also matter.

## Verification

```bash
npm run typecheck
npm run lint
npm test -- --runInBand --watchman=false
npm run test:functions
```

Tests use mocks and local calculations; these commands do not access production Firebase.

## Further reading

- [Developer guide](docs/developer-guide.md)
- [System design](docs/system-design.md)
- [Privacy policy](docs/privacy-policy.md)
