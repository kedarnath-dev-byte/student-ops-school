import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useMockStore } from '../src/store/mockStore';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const activePartnerId = useMockStore((s) => s.activePartnerId);
  const hydrated = useMockStore((s) => s.hydrated);

  useEffect(() => {
    // Safety: unblock if persist callback never fires (e.g. storage quirks)
    const t = setTimeout(() => {
      if (!useMockStore.getState().hydrated) {
        useMockStore.getState().setHydrated(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const onLogin = segments[0] === 'login';
    if (!activePartnerId && !onLogin) {
      router.replace('/login');
    } else if (activePartnerId && onLogin) {
      router.replace('/(tabs)/attendance');
    }
  }, [activePartnerId, hydrated, segments, router]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a5f' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGate>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="students/add"
          options={{ headerShown: true, title: 'Add Student', presentation: 'modal' }}
        />
        <Stack.Screen
          name="students/[id]"
          options={{ headerShown: true, title: 'Student' }}
        />
      </Stack>
    </AuthGate>
  );
}
