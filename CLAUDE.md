# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

## Architecture

**Stack**: React Native + Expo (SDK 54) with TypeScript, using Expo Router for file-based navigation.

### Routing Structure

- `app/_layout.tsx` - Root layout with ThemeProvider and Stack navigator
- `app/(tabs)/` - Tab group containing main screens (Home, Explore)
- `app/(tabs)/_layout.tsx` - Tab navigator configuration with HapticTab buttons
- `app/modal.tsx` - Modal screen example

## Remember

- As a CS student, I want to learn every aspect of this project as I am building, explain any valuable patterns, code, structure, optimization, I should know about in any code that is written. For actual important code use in real production, let me manually write them

### Component Patterns

**Themed Components**: `ThemedText` and `ThemedView` accept optional `lightColor` and `darkColor` props for theme-aware styling.

**Platform-specific files**: Use `.ios.tsx` and `.web.ts` suffixes for platform variants (e.g., `icon-symbol.ios.tsx`).

**Path alias**: Use `@/*` to import from project root (e.g., `@/components/`, `@/hooks/`).

### Key Directories

- `components/` - Reusable components; `components/ui/` contains low-level primitives
- `hooks/` - Custom hooks (`useColorScheme`, `useThemeColor`)
- `constants/theme.ts` - Color palette (`Colors.light`, `Colors.dark`) and font definitions

### Configuration

- New Architecture enabled (`newArchEnabled: true`)
- Experimental features: `typedRoutes`, `reactCompiler`
- Supports iOS (with tablet), Android (edge-to-edge), and Web
