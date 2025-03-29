import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Bell, CreditCard, CircleHelp as HelpCircle, LogOut, Settings, Shield, User } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, isSubscribed, toggleSubscription } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleSubscriptionToggle = () => {
    if (!isSubscribed) {
      Alert.alert(
        'Upgrade to Premium',
        'Get warranty expiry notifications and more features for just $4.99/month',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Subscribe',
            onPress: () => toggleSubscription(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your premium subscription?',
        [
          { text: 'Keep Subscription', style: 'cancel' },
          {
            text: 'Cancel Subscription',
            style: 'destructive',
            onPress: () => toggleSubscription(),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <User size={40} color="#4361ee" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(300)}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <CreditCard size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>Premium Subscription</Text>
              </View>
              <View style={styles.subscriptionContainer}>
                <Text style={[styles.subscriptionStatus, isSubscribed ? styles.activeSubscription : styles.inactiveSubscription]}>
                  {isSubscribed ? 'Active' : 'Inactive'}
                </Text>
                <TouchableOpacity
                  style={[styles.subscriptionButton, isSubscribed ? styles.cancelButton : styles.upgradeButton]}
                  onPress={handleSubscriptionToggle}
                >
                  <Text style={[styles.subscriptionButtonText, isSubscribed ? styles.cancelButtonText : styles.upgradeButtonText]}>
                    {isSubscribed ? 'Cancel' : 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Bell size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#e9ecef', true: '#c7d2fe' }}
                thumbColor={notificationsEnabled ? '#4361ee' : '#f4f3f4'}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(500)}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <HelpCircle size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>Help & Support</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Shield size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Settings size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>App Settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={22} color="#dc3545" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>WarrantyCards v1.0.0</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e9efff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#212529',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  subscriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  activeSubscription: {
    color: '#198754',
  },
  inactiveSubscription: {
    color: '#6c757d',
  },
  subscriptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButton: {
    backgroundColor: '#e9efff',
  },
  cancelButton: {
    backgroundColor: '#fff1f1',
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButtonText: {
    color: '#4361ee',
  },
  cancelButtonText: {
    color: '#dc3545',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f1',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#adb5bd',
  },
});