import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="list/[id]"
          options={{ headerShown: true, headerTitle: 'Einkaufsliste', presentation: 'card' }}
        />
        <Stack.Screen
          name="recipe/[id]"
          options={{ headerShown: true, headerTitle: 'Rezept', presentation: 'card' }}
        />
      </Stack>
    </>
  );
}
