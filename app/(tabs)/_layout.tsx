import {Tabs} from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo'; 
import Feather from '@expo/vector-icons/Feather';

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{
                title: 'Map',
                tabBarIcon: ({ color, size }) => (
                    <Entypo name="map" size={size} color={color} />
                ),
            }} />
            <Tabs.Screen name="places" options={{
                title: 'Places',
                tabBarIcon: ({ color, size }) => (
                    <Feather name="list" size={size} color={color} />
                ),
            }} />
        </Tabs>
    )
}