# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run lint       # Run ESLint
```

## Architecture

**Stack**: React Native + Expo (SDK 57) with TypeScript, using Expo Router for file-based navigation.

### Routing Structure

- `app/_layout.tsx` - Root fonts, auth gate, error boundary, and Stack navigator
- `app/(tabs)/` - Map and places-list routes
- `app/(tabs)/_layout.tsx` - Tab navigator with FloatingTabBar
- `app/(auth)/welcome.tsx` - Location permission onboarding route
- `app/place/[id].tsx` - Place details route
- `screens/` - Named screen implementations re-exported by route files

## Remember

- As a CS student, I want to learn every aspect of this project as I am building, explain any valuable patterns, code, structure, optimization, I should know about in any code that is written. For actual important code use in real production, let me manually write them

### Component Patterns

**UI Components**: PascalCase filenames match exported components. Theme tokens live in `constants/theme-tokens.ts`.

**Platform-specific files**: Use `.ios.tsx` and `.web.ts` suffixes for platform variants (e.g., `icon-symbol.ios.tsx`).

**Path alias**: Use `@/*` to import from project root (e.g., `@/components/`, `@/hooks/`).

### Key Directories

- `components/` - Map markers, place cards, check-in controls, and navigation
- `hooks/` - React state adapters such as `useLivePlaces`, `usePlaceCheckIn`, and `useAdminPermissions`
- `services/` - Client integrations; shared foreground-only listeners live in `place-subscriptions.ts`
- `functions/src/` - Callable and scheduled handlers, shared configuration, and domain calculations
- `constants/theme-tokens.ts` - Colors, typography, spacing, and animation tokens
- `docs/firebase-costs.md` - Current cost behavior, code paths, and deployment notes

### Configuration

- New Architecture is required (the `newArchEnabled` option was removed in SDK 55)
- Experimental features: `typedRoutes`, `reactCompiler`
- Supports iOS and Android (edge-to-edge). Web is disabled.
