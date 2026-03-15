import { useEffect, useReducer } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ExchangeRateProvider } from '../context/ExchangeRateContext';
import { FinanceProvider } from '../context/FinanceContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Forzar re-render de toda la app cuando el sistema cambia entre dark/light.
  // Colors.ts usa un Proxy que lee Appearance.getColorScheme() en cada render,
  // así todos los componentes reciben automáticamente los nuevos valores.
  const [, rerender] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => rerender());
    return () => sub.remove();
  }, []);

  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExchangeRateProvider>
        <AuthProvider>
          <FinanceProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <RootLayoutNav />
          </FinanceProvider>
        </AuthProvider>
      </ExchangeRateProvider>
    </GestureHandlerRootView>
  );
}
