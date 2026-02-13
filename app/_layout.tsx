/**
 * LEARNING POINT: Root Layout with Font Loading
 *
 * The root layout is the perfect place to load fonts because:
 * 1. It wraps the entire app - fonts are available everywhere
 * 2. We can hold the splash screen until fonts are ready
 * 3. No flash of unstyled text (FOUT) when navigating
 *
 * expo-splash-screen keeps the native splash visible while we load assets.
 * This creates a seamless transition from launch to the app.
 */
import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { COLORS } from '@/constants/theme';

/**
 * LEARNING POINT: Preventing Auto-Hide
 *
 * By default, expo-splash-screen auto-hides after the app mounts.
 * We prevent this so we can control when to hide it (after fonts load).
 * This must be called before the component renders.
 */
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isLoading: authLoading } = useAuth();

    /**
     * LEARNING POINT: useFonts Hook
     *
     * useFonts is a convenience hook from expo-font that:
     * 1. Loads multiple fonts in parallel
     * 2. Returns loading state
     * 3. Handles errors gracefully
     *
     * The font names (Outfit_500Medium, etc.) become the fontFamily
     * values you use in styles.
     */
    const [fontsLoaded, fontError] = useFonts({
        // Display font — Outfit (geometric, modern, playful roundness)
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,
        // Body font — Figtree (warm, friendly, organic readability)
        Figtree_400Regular,
        Figtree_600SemiBold,
        Figtree_700Bold,
    });

    /**
     * LEARNING POINT: Coordinating Async Operations
     *
     * We need both fonts AND auth state before showing the app.
     * Using useCallback ensures the function reference stays stable,
     * which is good practice for effects and event handlers.
     */
    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            // Hide splash screen once fonts are loaded (or failed)
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Hide splash screen when fonts are ready
    useEffect(() => {
        onLayoutRootView();
    }, [onLayoutRootView]);

    /**
     * LEARNING POINT: Loading Priority
     *
     * We wait for fonts to load before rendering anything.
     * Auth loading is handled separately because we want
     * the splash screen to stay visible during font loading,
     * but show our own spinner during auth loading.
     */
    if (!fontsLoaded && !fontError) {
        // Keep splash screen visible while fonts load
        return null;
    }

    // Show loading indicator while checking auth state
    if (authLoading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.neutral[50],
            }}>
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
        );
    }

    /**
     * LEARNING POINT: Edge-to-Edge App Layout
     *
     * For a full-screen app, set headerShown: false globally in the Stack's
     * screenOptions. This means NO screen gets a navigation header bar —
     * every screen is responsible for its own safe area handling via
     * useSafeAreaInsets(). This gives each screen complete control over
     * its layout (maps go truly edge-to-edge, detail screens use floating
     * back buttons, list screens pad their content for the notch).
     *
     * contentStyle sets the default background for the content area behind
     * all screens — prevents white flashes during transitions.
     *
     * StatusBar style="dark" keeps the clock/battery text dark (readable
     * on our light backgrounds). Without this, content behind the status
     * bar might clash with the status bar text.
     */
    return (
        <ErrorBoundary>
        <StatusBar style="dark" />
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                contentStyle: { backgroundColor: COLORS.neutral[0] },
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="(auth)/welcome"
                options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="place/[id]" />
            <Stack.Screen name="index" />
        </Stack>
        </ErrorBoundary>
    );
}
