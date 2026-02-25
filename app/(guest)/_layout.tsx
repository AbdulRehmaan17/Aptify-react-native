import { Stack } from 'expo-router';

export default function GuestLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="home" />
      <Stack.Screen name="listing" />
    </Stack>
  );
}
