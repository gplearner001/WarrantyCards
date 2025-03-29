import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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

  // Get expiring warranties from storage
  const storedWarranties = await storage.getItem('warranties');
  const warranties: Warranty[] = storedWarranties ? JSON.parse(storedWarranties) : [];
  
  // Find warranties expiring soon (within 30 days)
  const now = new Date();
  const expiringWarranties = warranties.filter((warranty: Warranty) => {
    if (!warranty.expiryDate) return false;
    const expiryDate = new Date(warranty.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  // Schedule daily check at 9:00 AM
  const trigger: Notifications.CalendarTriggerInput = {
    hour: 14,
    minute: 38,
    repeats: true,
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR
  };

  // If there are expiring warranties, include them in the notification
  if (expiringWarranties.length > 0) {
    const firstExpiring = expiringWarranties[0];
    const imageUrl = firstExpiring.productImage || firstExpiring.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Warranty Expiring: ${firstExpiring.productName}`,
        body: expiringWarranties.length > 1 
          ? `${firstExpiring.productName} and ${expiringWarranties.length - 1} other warranties are expiring soon`
          : `Your ${firstExpiring.company} ${firstExpiring.productName} warranty is expiring soon`,
        data: { warrantyId: firstExpiring.id },
        attachments: Platform.OS === 'ios' ? [{
          identifier: `warranty-${firstExpiring.id}-image`,
          url: imageUrl,
          type: 'image' as const
        }] : undefined,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
  } else {
    // If no expiring warranties, schedule a simple check notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "No Expiring Warranties",
        body: "All your warranties are up to date",
        sound: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger,
    });
  }
}

export async function checkAndScheduleWarrantyNotifications(warranties: Warranty[]) {
  if (Platform.OS === 'web') {
    return;
  }

  // Cancel existing warranty notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  
  warranties.forEach(async (warranty: Warranty) => {
    if (!warranty.expiryDate) return;

    const expiryDate = new Date(warranty.expiryDate);
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - 5); // Start notifications 5 days before expiry
    
    // Only schedule if notification start date is in the future
    if (notificationDate > now) {
      const imageUrl = warranty.productImage || warranty.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070';

      // Schedule initial notification for 5 days before expiry
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Warranty Expiring Soon: ${warranty.productName}`,
          body: `Your ${warranty.company} ${warranty.productName} warranty will expire in 5 days`,
          data: { 
            warrantyId: warranty.id,
            productImage: imageUrl,
            productName: warranty.productName,
            company: warranty.company,
            expiryDate: warranty.expiryDate
          },
          attachments: Platform.OS === 'ios' ? [{
            identifier: `warranty-${warranty.id}-image`,
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

      // Schedule daily reminders starting from notification date until expiry
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = daysUntilExpiry - 1; i > 0; i--) {
        const reminderDate = new Date(expiryDate);
        reminderDate.setDate(reminderDate.getDate() - i);
        
        if (reminderDate > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Warranty Reminder: ${warranty.productName}`,
              body: `Your ${warranty.company} ${warranty.productName} warranty will expire in ${i} day${i !== 1 ? 's' : ''}`,
              data: { 
                warrantyId: warranty.id,
                productImage: imageUrl,
                productName: warranty.productName,
                company: warranty.company,
                expiryDate: warranty.expiryDate
              },
              attachments: Platform.OS === 'ios' ? [{
                identifier: `warranty-${warranty.id}-reminder-${i}`,
                url: imageUrl,
                type: 'image' as const
              }] : undefined,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              badge: 1,
            },
            trigger: {
              date: reminderDate,
              type: Notifications.SchedulableTriggerInputTypes.DATE
            },
          });
        }
      }

      // Schedule expiry notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Warranty Expired: ${warranty.productName}`,
          body: `Your ${warranty.company} ${warranty.productName} warranty has expired today`,
          data: { 
            warrantyId: warranty.id,
            productImage: imageUrl,
            productName: warranty.productName,
            company: warranty.company,
            expiryDate: warranty.expiryDate
          },
          attachments: Platform.OS === 'ios' ? [{
            identifier: `warranty-${warranty.id}-expired-image`,
            url: imageUrl,
            type: 'image' as const
          }] : undefined,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: 1,
        },
        trigger: {
          date: expiryDate,
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