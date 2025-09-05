import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="Messages" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="List"
        options={{ headerShown: false }} 
      />
      {/* Add other routes as needed */}
    </Stack>
  );
}