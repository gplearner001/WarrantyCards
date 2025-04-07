import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useWarrantyStore } from '../../store/warrantyStore';
import { checkAndScheduleWarrantyNotifications, requestNotificationPermissions } from '../../utils/notificationUtils';
import { ArrowLeft, Bell, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { formatDate } from '../../utils/dateUtils';

export default function NotificationTestScreen() {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [testStatus, setTestStatus] = useState<string>('');
  const { warranties } = useWarrantyStore();

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const sendImmediateNotification = async () => {
    if (Platform.OS === 'web') {
      setTestStatus('Notifications are not supported on web platform');
      return;
    }

    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        setTestStatus('Notification permissions not granted');
        return;
      }

      const expiringWarranties = warranties.filter(warranty => {
        if (!warranty.expiryDate) return false;
        const expiryDate = new Date(warranty.expiryDate);
        const selectedDateStart = new Date(selectedDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        const selectedDateEnd = new Date(selectedDate);
        selectedDateEnd.setHours(23, 59, 59, 999);
        
        return expiryDate >= selectedDateStart && expiryDate <= selectedDateEnd;
      });

      console.log("expiring warranties", expiringWarranties);

      for (const warranty of expiringWarranties) {
        console.log("test notification warranty",warranty);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Warranty Expiring: ${warranty.productName}`,
              body: `Your ${warranty.productName} warranty will expire on ${formatDate(new Date(warranty.expiryDate!))}`,
              data: { 
                warrantyId: warranty.id,
                productImage: warranty.productImage || warranty.receiptImage,
                productName: warranty.productName,
                company: warranty.company,
                expiryDate: warranty.expiryDate
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              badge: 1,
          },
          trigger: null, // null means send immediately
        });
      }
      setTestStatus('Test notification sent successfully!');
    } catch (error) {
      setTestStatus('Error sending test notification');
      console.error('Notification test error:', error);
    }
  };

  const sendWarningNotification = async () => {
    if (Platform.OS === 'web') {
      setTestStatus('Notifications are not supported on web platform');
      return;
    }

    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        setTestStatus('Notification permissions not granted');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Warranty Expiring Soon',
          body: 'Your Test Product warranty from Test Company is expiring soon!',
          data: { type: 'warning' },
        },
        trigger: null, // null means send immediately
      });
      
      setTestStatus('Warning notification sent successfully!');
    } catch (error) {
      setTestStatus('Error sending warning notification');
      console.error('Notification test error:', error);
    }
  };

  const testCustomDateNotification = async () => {
    if (Platform.OS === 'web') {
      setTestStatus('Notifications are not supported on web platform');
      return;
    }

    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        setTestStatus('Notification permissions not granted');
        return;
      }

      // Check if there are any warranties expiring on the selected date
      const expiringWarranties = warranties.filter(warranty => {
        if (!warranty.expiryDate) return false;
        const expiryDate = new Date(warranty.expiryDate);
        const selectedDateStart = new Date(selectedDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        const selectedDateEnd = new Date(selectedDate);
        selectedDateEnd.setHours(23, 59, 59, 999);
        
        return expiryDate >= selectedDateStart && expiryDate <= selectedDateEnd;
      });

      if (expiringWarranties.length > 0) {
        // Schedule notifications for warranties expiring on selected date
        for (const warranty of expiringWarranties) {
          const notificationDate = new Date(selectedDate);
          notificationDate.setHours(7, 0, 0, 0); // Set to 7 AM

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Warranty Expiring: ${warranty.productName}`,
              body: `Your ${warranty.company} ${warranty.productName} warranty will expire on ${formatDate(new Date(warranty.expiryDate!))}`,
              data: { 
                warrantyId: warranty.id,
                productImage: warranty.productImage || warranty.receiptImage,
                productName: warranty.productName,
                company: warranty.company,
                expiryDate: warranty.expiryDate
              },
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
        
        setTestStatus(`Scheduled notifications for ${expiringWarranties.length} warranties expiring on ${formatDate(selectedDate)}`);
      } else {
        // If no warranties expire on selected date, send a test notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Test Scheduled Notification',
            body: `This is a test notification scheduled for ${formatDate(selectedDate)}`,
            data: { type: 'test' },
          },
          trigger: {
            date: selectedDate,
            type: Notifications.SchedulableTriggerInputTypes.DATE
          },
        });
        
        setTestStatus(`Test notification scheduled for ${formatDate(selectedDate)}`);
      }
    } catch (error) {
      setTestStatus('Error scheduling test notification');
      console.error('Notification test error:', error);
    }
  };

  const checkScheduledNotifications = async () => {
    if (Platform.OS === 'web') {
      setTestStatus('Notifications are not supported on web platform');
      return;
    }

    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      setTestStatus(`Found ${scheduledNotifications.length} scheduled notifications`);
      
      scheduledNotifications.forEach((notification, index) => {
        console.log(`Notification ${index + 1}:`, {
          title: notification.content.title,
          body: notification.content.body,
          trigger: notification.trigger,
        });
      });
    } catch (error) {
      setTestStatus('Error checking scheduled notifications');
      console.error('Error checking notifications:', error);
    }
  };

  const cancelAllNotifications = async () => {
    if (Platform.OS === 'web') {
      setTestStatus('Notifications are not supported on web platform');
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setTestStatus('All notifications cancelled');
    } catch (error) {
      setTestStatus('Error cancelling notifications');
      console.error('Error cancelling notifications:', error);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#212529" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.webWarning}>
          <AlertTriangle size={48} color="#ffc107" />
          <Text style={styles.webWarningTitle}>Not Available on Web</Text>
          <Text style={styles.webWarningText}>
            Notifications testing is only available on iOS and Android devices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immediate Notifications</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={sendImmediateNotification}
          >
            <Bell size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Send Test Notification Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={sendWarningNotification}
          >
            <AlertTriangle size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Send Warning Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Future Notification</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#4361ee" />
            <Text style={styles.dateButtonText}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={testCustomDateNotification}
          >
            <Bell size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Schedule Future Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Notifications</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={checkScheduledNotifications}
          >
            <Bell size={20} color="#4361ee" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Check Scheduled Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={cancelAllNotifications}
          >
            <Bell size={20} color="#dc3545" />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              Cancel All Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {testStatus ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{testStatus}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4361ee',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  secondaryButton: {
    backgroundColor: '#e9efff',
    borderWidth: 1,
    borderColor: '#4361ee',
  },
  secondaryButtonText: {
    color: '#4361ee',
  },
  dangerButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#dc3545',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 8,
  },
  statusContainer: {
    backgroundColor: '#e9efff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#4361ee',
    textAlign: 'center',
  },
  webWarning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  webWarningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  webWarningText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});