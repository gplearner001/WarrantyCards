import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setupNotifications, requestNotificationPermissions, scheduleDailyWarrantyCheck } from '../utils/notificationUtils'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.frameworkReady?.();
    } else {
      // Set up notifications
      (async () => {
        await setupNotifications();
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleDailyWarrantyCheck();
        }
      })();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}