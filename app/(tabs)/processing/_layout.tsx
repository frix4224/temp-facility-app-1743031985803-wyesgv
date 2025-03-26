import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProcessingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f9fafb' },
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="quotes"
        options={{
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'none',
        }}
      />
    </Stack>
  );
}