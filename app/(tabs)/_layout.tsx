import { Tabs } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '@/constants/theme';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary[500],
                tabBarInactiveTintColor: COLORS.neutral[400],
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size }) => (
                        <Entypo name="map" size={size} color={color} />
                    ),
                    // Allow the map to render beyond safe-area clipped scene bounds.
                    sceneStyle: {
                        overflow: 'visible',
                        backgroundColor: 'transparent',
                    },
                }}
            />
            <Tabs.Screen
                name="places"
                options={{
                    title: 'Places',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="list" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
