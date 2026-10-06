# Firebase costs and the code that produces them

The September report records $0.047282 before any credits outside that export: $0.024298 for reads, $0.022223 for CPU, and smaller writes, memory, and transfer amounts. It is a service/SKU report, not a profile of individual functions. The source here describes the refactored application; deployed behavior changes after redeployment.

## Start here in the source

| Action | Entry point | Where cloud usage happens |
| --- | --- | --- |
| Refresh crowd levels every 15 minutes | `functions/src/scheduled/aggregate-crowd-levels.ts` | `functions/src/operations/aggregate-place-crowds.ts` queries reports and candidate places, then commits only changed summaries |
| Clean up every hour | `functions/src/scheduled/prune-expired-check-ins.ts` | Queries expired reports/cooldowns and commits bounded delete batches |
| Open map/list | `screens/MapScreen.tsx`, `screens/PlacesListScreen.tsx` → `hooks/useLivePlaces.ts` | `services/place-subscriptions.ts` opens one shared collection listener |
| Open details | `screens/PlaceDetailsScreen.tsx` → `subscribePlace()` | Reuses the collection stream when present, otherwise opens one shared document listener |
| Submit a check-in | `hooks/usePlaceCheckIn.ts` → `services/check-in-service.ts` | Callable in `functions/src/callable/submit-check-in.ts` reads place and cooldown, then writes report and cooldown in a transaction |
| Check admin permissions | `hooks/useAdminPermissions.ts` → `services/admin-service.ts` | Callable in `functions/src/callable/check-admin-status.ts` reads `config/admins`; results are coalesced and cached per UID for five minutes |
| Override crowd level | `services/admin-service.ts` | `updateDoc()` writes a place; Firestore rules independently read the admin configuration and authorize the request |

Constructing `collection()`, `doc()`, or `httpsCallable()` prepares a reference. `.get()`, `getDoc()`, `onSnapshot()`, calling the callable, and committing writes are the operations that request cloud work. Server-side computation consumes CPU and memory; local distance calculations and AsyncStorage do not invoke Cloud Functions.

## Aggregation changes

Previously each five-minute execution read every place, then all recent check-ins. With 36 idle places and an empty check-in query this was 37 read operations per execution: approximately **10,656/day**, excluding cleanup and app clients.

Now there are 96 scheduled executions per day, and three queries:

1. Check-ins whose timestamps are in the last 90 minutes.
2. Places with a saved `lastUpdate` timestamp after the Unix epoch.
3. Places whose `busyPercent` is greater than zero.

An idle campus with no reports, saved timestamps, nonzero values, or overrides has three empty queries. Firestore charges a minimum read per query, yielding approximately **288/day** for aggregation: **97.3% less than that old idle baseline**. Executions fall from 8,640 to 2,880 per 30-day month.

Actual usage rises with recent reports and saved crowd states. A place returned by both place queries incurs a read in each query; it is deduplicated before calculation and writes. Active admin overrides can also be returned and read, but are never changed by aggregation. At the first check-in, a place missing from the candidate queries is fetched by ID. No schema migration or additional composite index is needed: the queries use existing single-field indexes.

Expired summaries must still be visited when the recent-report query is empty. Otherwise a place could display a stale busy percentage indefinitely. Both old timestamps and legacy nonzero values are candidates so they can reset. Once reset to zero with `lastUpdate` deleted, that place drops out of subsequent aggregation queries until another check-in or override.

A write includes the document's read version (`lastUpdateTime`). If an admin changes a place after the read, Firestore rejects the batch and the scheduler retries using fresh documents. Unchanged crowd percentages and timestamps generate no writes.

## Other changes and tradeoffs

- `functions/src/shared/runtime-options.ts` gives scheduled jobs `cpu: 'gcf_gen1'`, `concurrency: 1`, `minInstances: 0`, and `maxInstances: 1`. At 256 MiB this requests fractional CPU instead of the second-generation default full CPU. CPU-bound work or cold starts may take longer, so savings depend on actual duration. User-facing callable functions keep their existing CPU/concurrency behavior and five-instance limit.
- Crowd changes can take up to about 15 minutes plus execution time to publish, instead of five minutes. The 90-minute report window and cooldown remain the same.
- The hourly cleanup is unchanged in frequency. Check-ins may physically remain until the next cleanup; aggregation excludes those older than 90 minutes.
- Details share an already-open collection listener. A direct detail link still reads just one place. Backgrounding closes listeners; returning creates fresh listeners and can incur fresh reads. This avoids continuous background updates but may not save reads during frequent brief background transitions.
- Cached admin status is a UI hint. Changes to the admin list may take five minutes to appear in the UI. Writes are always checked by the current Firestore rules. Failed lookups are not cached, and concurrent lookups for one UID share a request.
- `.env.example` documents emulator connections for development. Scripts require emulator configuration or `--production`, and the simulator now uses the real aggregation operation instead of duplicating its math.
- Routine aggregation logging uses one summary per execution rather than several lines.

## Deployment and measurement

This refactor preserves deployed export names: `aggregateBusyPercent`, `cleanupOldCheckins`, `submitCheckin`, and `checkAdminStatus`. File renames do not create extra cloud functions.

Run the documented checks before deployment. To activate backend changes in the intended project:

```bash
firebase deploy --only functions --project campusactivity-ec1f2
```

Release an updated app to activate listener sharing, background suspension, and admin caching on users' devices. A backend deployment alone does not update installed clients. No Firestore rules or schema migration is needed for this refactor.

Compare daily read counts and CPU usage before and after deployment using matching dates and project filters. Check credits as well: Cloud Run applies its free allowance as a spending-based discount shared across a billing account. A raw service-cost export can differ from the final discounted total. Confirm which Firestore database receives the free quota rather than inferring eligibility from the SKU label.

References: [Firestore billing](https://firebase.google.com/docs/firestore/pricing), [function resource settings](https://firebase.google.com/docs/functions/manage-functions), [Cloud Run pricing](https://cloud.google.com/run/pricing).
