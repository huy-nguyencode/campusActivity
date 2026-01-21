import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocation } from '@/hooks/useLocation';
import { router } from 'expo-router';


export default function Welcome() {
    const { requestPermission } = useLocation();

    const handleRequestPermission = async () => {
        await requestPermission();
        router.replace('/(tabs)');
        
    };

    return (
        <View style={styles.container}>
            <Text>Why we need location: We need your location to show you the nearby places and let you check in. Your location is never stored</Text>
            <Pressable style={styles.button} onPress={handleRequestPermission}>
                <Text style={styles.buttonText}>Enable Location</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.buttonText}>Skip for now</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',   
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#0000ff',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});