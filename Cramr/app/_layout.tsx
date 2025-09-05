import { UserProvider } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins/Poppins-Light.ttf'),
  });

  

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={({route}) => {
              const swipeRightSet = new Set<string>([
                'TwoFactor/TwoFAPage',
                'ViewEvent/viewvent',
                'Settings/SettingsFrontPage',
                'Settings/AboutPage',
                'Settings/AccountPage',
                'Settings/PreferencesPage'
              ]);
              return {
                headerShown: false,
                animation: swipeRightSet.has(route.name)
                  ? 'slide_from_right'
                  : 'none'
              };
            }}>
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
