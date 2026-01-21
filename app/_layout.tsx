import { Stack } from "expo-router";
import {useAuth} from '@/hooks/useAuth';
import {View, ActivityIndicator} from 'react-native';

export default function RootLayout() {
  //get auth state
  const {isLoading} = useAuth();

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  }
  return <Stack />;
}
