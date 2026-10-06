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
import { ErrorBoundary } from '@/components/AppErrorBoundary';
import { COLORS } from '@/constants/theme-tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { hasResolved: authResolved } = useAuth();

    const [fontsLoaded, fontError] = useFonts({
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,
        Figtree_400Regular,
        Figtree_600SemiBold,
        Figtree_700Bold,
    });

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    useEffect(() => {
        onLayoutRootView();
    }, [onLayoutRootView]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    // Only gate the first auth check; later retries must not unmount the navigator.
    if (!authResolved) {
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
