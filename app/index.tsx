import { View, ActivityIndicator } from "react-native";
import { Redirect } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';

export default function Index() {
  //get location permission status
  const { permission, isLoading } = useLocation();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  if (permission === 'undetermined') {
    return <Redirect href="/(auth)/welcome" />;
  }
  return <Redirect href="/(tabs)" />;
}
