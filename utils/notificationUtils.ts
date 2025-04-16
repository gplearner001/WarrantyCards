import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Warranty } from '../store/warrantyStore';

// Storage implementation for web and native platforms
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
};

export async function scheduleDailyWarrantyCheck() {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web platform');
    return;
  }

  // Cancel any existing scheduled checks
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule daily check at 7:00 AM
  const trigger: Notifications.CalendarTriggerInput = {
    hour: 7,
    minute: 0,
    repeats: true,
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Checking warranties...",
      body: "Checking for warranties expiring tomorrow",
      sound: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger,
  });
}

export async function checkAndScheduleWarrantyNotifications(warranties: Warranty[]) {
  if (Platform.OS === 'web') {
    return;
  }

  // Cancel existing warranty notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  // Schedule notifications for each warranty based on custom notification days
  warranties.forEach(async (warranty: Warranty) => {
    if (!warranty.expiryDate) return;

    const expiryDate = new Date(warranty.expiryDate);
    const notificationDays = warranty.notificationDays || 1; // Default to 1 day if not set
    
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - notificationDays); // Notify X days before expiry
    notificationDate.setHours(7, 0, 0, 0); // At 7 AM
    
    // Only schedule if notification date is in the future
    if (notificationDate > now) {
      const imageUrl = warranty.productImage || warranty.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Warranty Expiring in ${notificationDays} days: ${warranty.productName}`,
          body: `Your ${warranty.company} ${warranty.productName} warranty will expire on ${formatDate(new Date(warranty.expiryDate))}`,
          data: { 
            warrantyId: warranty.id,
            productImage: imageUrl,
            productName: warranty.productName,
            company: warranty.company,
            expiryDate: warranty.expiryDate
          },
          attachments: Platform.OS === 'ios' ? [{
            identifier: `warranty-${warranty.id}-expiring-soon`,
            url: imageUrl,
            type: 'image' as const
          }] : undefined,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: 1,
        },
        trigger: {
          date: notificationDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE
        },
      });
    }
  });
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function setupNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  // Configure how notifications are handled when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Set up notification received handler
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    const { productName, company, expiryDate } = notification.request.content.data;
    console.log(`Notification received for ${productName} from ${company}, expiring on ${expiryDate}`);
  });

  // Set up notification response handler
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { warrantyId } = response.notification.request.content.data;
    // Here you could navigate to the warranty details screen
    console.log(`User tapped notification for warranty: ${warrantyId}`);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}