---
name: Campus Pulse Enhanced Implementation
overview: Build Campus Pulse mobile app with React Native/Expo and Firebase, enhanced with comprehensive error handling, analytics dashboard, and polished UI/UX animations.
todos: []
---

# Cam

pus Pulse - Enhanced Implementation Plan

## Project Overview

Campus Pulse is a React Native (Expo) mobile app for iOS & Android that provides real-time crowd density information for campus locations. The app uses Firebase (Firestore, Anonymous Auth, Cloud Functions) with privacy-first design (foreground-only location, no PII storage).

## Core Features (From TechDoc)

### 1. Anonymous Authentication

- Firebase Anonymous Auth creates per-device UID
- UID reused across sessions
- Automatic token refresh via SDK

### 2. Foreground Location Sensing

- Expo Location requests "when-in-use" permission
- Location stream only in foreground
- Raw coordinates never leave device
- Distance check (≤30m) against predefined campus POIs
- GPS accuracy >15m disables check-in buttons
- Manual place picker if permission denied

### 3. Place Proximity Engine

- Static GeoJSON list (~20 campus POIs)
- Each POI: lat/lon, type tag, capacity integer
- Haversine formula for distance calculation
- 30m radius triggers "at place" state

### 4. Check-In Submission

- Three emoji buttons (😊😊😊) representing levels 0, 1, 2
- Single document write to check-ins collection
- Fields: placeId, level (0-2), server timestamp, anonymous uid
- 90-minute local cooldown per POI
- Offline queue via Firestore persistence

### 5. Real-Time Crowd Score

- POI documents with busyPercent (0-100) and lastUpdate
- Client listens via onSnapshot
- Color mapping: 0-39% green, 40-79% yellow, 80-100% red
- Stale indicator if lastUpdate >90 min

### 6. Server-Side Aggregation

- Scheduled Cloud Function (every 5 minutes)
- Loads last 90 minutes of check-ins
- Exponential decay (half-life = 30 minutes)
- Weighted average normalized to 0-100
- Writes busyPercent back to POI document

### 7. Offline-First Support

- Firestore persistence enabled
- Map colors cached
- Sync indicator for queued data

### 8. Spam & Abuse Controls

- Client-side 90-minute cooldown per POI
- Cloud Function ignores check-ins >90 min old
- Rate limiting: max 20 writes per UID in 5 minutes
- Security rules enforce field validation

## Enhanced Features (New Additions)

### Enhancement 1: Comprehensive Error Handling & User Feedback

**Goal**: Create robust error handling throughout the app with clear user feedback**Components**:

- Global error boundary for React Native
- Network connectivity detection and feedback
- Retry logic with exponential backoff for failed operations
- User-friendly error messages (no technical jargon)
- Toast notifications for transient errors
- Error logging to Firebase Analytics/Crashlytics
- Graceful degradation when services fail
- Loading states for all async operations
- Offline mode indicators

**Implementation Areas**:

- Location permission errors
- Network request failures
- Firestore write/read errors
- Cloud Function failures
- GPS accuracy issues
- Invalid check-in attempts

### Enhancement 2: Analytics Dashboard

**Goal**: Build a full-stack analytics dashboard showing app usage and place statistics**Features**:

- Real-time metrics display
- Historical trend graphs (busy times by day/hour)
- Place popularity rankings
- User engagement metrics
- Check-in success/failure rates
- Location permission grant/deny analytics
- Peak usage times visualization
- Heatmap of campus activity

**Technical Stack**:

- React Native screens for mobile dashboard
- Cloud Functions to aggregate analytics data
- Firestore collections for analytics storage
- Chart library (react-native-chart-kit or victory-native)
- Scheduled functions for daily/weekly aggregations

**Data Points to Track**:

- Check-ins per place per hour
- Average busyPercent by time of day
- User retention metrics
- Feature usage (manual vs auto check-in)
- Error rates by type
- Network connectivity patterns

### Enhancement 3: Polished UI/UX with Animations & Loading States

**Goal**: Create a smooth, professional user experience with animations and proper loading states**UI/UX Improvements**:

- Skeleton loaders for map markers and place data
- Smooth animations for map marker color transitions
- Animated check-in button feedback
- Pull-to-refresh on map view
- Loading spinners with contextual messages
- Smooth transitions between screens
- Haptic feedback for check-in actions
- Micro-interactions for button presses
- Animated progress indicators
- Smooth map zoom/pan animations

**Loading States**:

- Initial app load (splash screen → loading → map)
- Location permission request flow
- Check-in submission (button → loading → success/error)
- Map data sync indicator
- Place detail loading

**Animations**:

- Fade-in for map markers
- Scale animations for check-in buttons
- Slide transitions for modals/sheets
- Pulse animation for user's current location
- Color transition animations for busyPercent changes

## Technical Architecture

### Frontend (React Native/Expo)

- **Framework**: Expo SDK (latest stable)
- **State Management**: React Context API or Zustand
- **Navigation**: React Navigation
- **Maps**: react-native-maps or Expo Maps
- **Animations**: react-native-reanimated
- **Charts**: react-native-chart-kit or victory-native
- **Error Handling**: react-error-boundary
- **Network**: @react-native-async-storage/async-storage for offline

### Backend (Firebase)

- **Database**: Firestore
- **Authentication**: Firebase Anonymous Auth
- **Functions**: Cloud Functions (Node.js)
- **Analytics**: Firebase Analytics
- **Crash Reporting**: Crashlytics
- **Storage**: Firestore (no Cloud Storage needed)

### Data Models

**Places Collection**:

```javascript
{
  id: string,
  name: string,
  type: 'dining' | 'truck' | 'library' | ...,
  location: { lat: number, lon: number },
  capacity: number,
  busyPercent: number (0-100),
  lastUpdate: timestamp,
  geoJson: {...}
}
```

**Check-ins Collection**:

```javascript
{
  id: string,
  placeId: string,
  level: 0 | 1 | 2,
  timestamp: serverTimestamp,
  uid: string (anonymous)
}
```

**Analytics Collection**:

```javascript
{
  id: string,
  date: string (YYYY-MM-DD),
  placeId: string,
  hourlyData: {
    [hour: string]: {
      checkInCount: number,
      avgBusyPercent: number,
      peakTime: boolean
    }
  }
}
```



## Implementation Phases

### Phase 1: Core Foundation

1. ✅ Set up Expo project with TypeScript
2. ✅ Configure Firebase project and SDK
3. ✅ Implement anonymous authentication (`services/auth.ts`)
4. ⏳ Set up Firestore collections and security rules
5. Create basic map view with static POI markers

### Phase 2: Location & Proximity

1. ✅ Implement Expo Location with foreground-only permission (`services/location.ts`)
2. ✅ Build proximity detection engine - haversine formula (`utils/haversine.ts`)
3. Create check-in UI with emoji buttons
4. ✅ Implement 90-minute cooldown logic (`services/checkin.ts`)
5. Add manual place picker fallback

### Phase 3: Real-Time Updates

1. Set up Firestore onSnapshot listeners
2. Implement color-coded map markers
3. Create Cloud Function for aggregation (5-min schedule)
4. Add exponential decay algorithm
5. Implement stale data indicators

### Phase 4: Error Handling (Enhancement 1)

1. Create global error boundary component
2. Implement network connectivity detection
3. Add retry logic with exponential backoff
4. Create error message system with user-friendly messages
5. Add toast notification system
6. Implement error logging to Crashlytics
7. Add loading states for all async operations
8. Create offline mode UI indicators

### Phase 5: Analytics Dashboard (Enhancement 2)

1. Design analytics data model
2. Create Cloud Functions for analytics aggregation
3. Build analytics dashboard screens in React Native
4. Implement chart visualizations
5. Add real-time metrics updates
6. Create historical trend views
7. Build heatmap visualization
8. Add peak time recommendations

### Phase 6: UI/UX Polish (Enhancement 3)

1. Implement skeleton loaders
2. Add smooth map marker animations
3. Create check-in button animations
4. Add pull-to-refresh functionality
5. Implement screen transition animations
6. Add haptic feedback
7. Create micro-interactions
8. Polish loading states and progress indicators

### Phase 7: Testing & Optimization

1. Write unit tests for proximity engine
2. Add integration tests for check-in flow
3. Test error handling scenarios
4. Performance optimization (debounce location updates)
5. Test offline functionality
6. Load testing for Cloud Functions
7. Accessibility testing
8. Cross-platform testing (iOS & Android)

## File Structure

```javascript
campus-pulse/
├── app/
│   ├── (tabs)/
│   │   ├── map.tsx
│   │   ├── analytics.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── error-boundary.tsx
├── components/
│   ├── map/
│   │   ├── CampusMap.tsx
│   │   ├── PlaceMarker.tsx
│   │   └── CheckInModal.tsx
│   ├── analytics/
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── TrendChart.tsx
│   │   └── HeatmapView.tsx
│   ├── common/
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Toast.tsx
│   │   └── SkeletonLoader.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
├── services/
│   ├── auth.ts
│   ├── location.ts
│   ├── firestore.ts
│   ├── checkin.ts
│   ├── analytics.ts
│   └── errorHandler.ts
├── hooks/
│   ├── useLocation.ts
│   ├── usePlaces.ts
│   ├── useCheckIn.ts
│   ├── useAnalytics.ts
│   └── useNetworkStatus.ts
├── utils/
│   ├── proximity.ts
│   ├── haversine.ts
│   ├── retry.ts
│   └── constants.ts
├── types/
│   ├── place.ts
│   ├── checkin.ts
│   └── analytics.ts
├── data/
│   └── places.geojson
├── functions/
│   ├── src/
│   │   ├── index.ts
│   │   ├── aggregateBusyPercent.ts
│   │   └── aggregateAnalytics.ts
│   └── package.json
└── app.json
```



## Key Dependencies

- expo
- expo-location
- react-native-maps
- @react-native-firebase/app
- @react-native-firebase/firestore
- @react-native-firebase/auth
- @react-native-firebase/analytics
- @react-native-firebase/crashlytics
- react-native-reanimated
- react-native-chart-kit
- @react-native-async-storage/async-storage
- react-error-boundary
- @react-native-community/netinfo

## Success Metrics

- App loads in <2 seconds
- Location updates with <500ms latency
- Check-in submission <1 second
- Error rate <1%