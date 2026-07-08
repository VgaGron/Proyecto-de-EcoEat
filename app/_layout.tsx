import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboardRestaurant" options={{ gestureEnabled: false }} />
      <Stack.Screen name="menuUser" options={{ gestureEnabled: false }} />
    </Stack>
  );
}