import { View, ActivityIndicator } from "react-native";
import { Redirect } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { COLORS } from '@/constants/theme';

export default function Index() {
  const { permission, isLoading } = useLocation();

  // isLoading stays true after permission resolves until the first GPS fix,
  // so only wait while the permission itself is still unknown.
  if (isLoading && permission === 'undetermined') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }
  if (permission === 'undetermined') {
    return <Redirect href="/(auth)/welcome" />;
  }
  // granted / denied / restricted all proceed to the app;
  // check-in flows already gate on granted + accuracy.
  return <Redirect href="/(tabs)" />;
}
