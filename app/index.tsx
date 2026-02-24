import { View, ActivityIndicator } from "react-native";
import { Redirect } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { COLORS } from '@/constants/theme';

export default function Index() {
  const { permission, isLoading } = useLocation();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }
  if (permission === 'undetermined') {
    return <Redirect href="/(auth)/welcome" />;
  }
  return <Redirect href="/(tabs)" />;
}
