import React, { useEffect } from 'react';
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
import { Bell, CreditCard, CircleHelp as HelpCircle, LogOut, Settings, Shield, Star, User, Globe as Globe2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRatingStore } from '../../store/ratingStore';
import RatingModal from '../../components/RatingModal';
import LanguageSelector from '../../components/LanguageSelector';
import { useLanguageStore, t } from '../../utils/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, isSubscribed, toggleSubscription, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  const { checkRatingStatus } = useRatingStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    checkRatingStatus();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
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
        t('upgradeToPremium'),
        t('premiumFeatures'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('subscribe'),
            onPress: () => toggleSubscription(),
          },
        ]
      );
    } else {
      Alert.alert(
        t('cancelSubscription'),
        t('cancelSubscriptionConfirm'),
        [
          { text: t('keepSubscription'), style: 'cancel' },
          {
            text: t('cancelSubscription'),
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
        <Text style={styles.title}>{t('profile')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <User size={40} color="#4361ee" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || t('guestUser')}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'guest@example.com'}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(300)}>
          <Text style={styles.sectionTitle}>{t('subscription')}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <CreditCard size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('premiumSubscription')}</Text>
              </View>
              <View style={styles.subscriptionContainer}>
                <Text style={[styles.subscriptionStatus, isSubscribed ? styles.activeSubscription : styles.inactiveSubscription]}>
                  {isSubscribed ? t('active') : t('inactive')}
                </Text>
                <TouchableOpacity
                  style={[styles.subscriptionButton, isSubscribed ? styles.cancelButton : styles.upgradeButton]}
                  onPress={handleSubscriptionToggle}
                >
                  <Text style={[styles.subscriptionButtonText, isSubscribed ? styles.cancelButtonText : styles.upgradeButtonText]}>
                    {isSubscribed ? t('cancel') : t('upgrade')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Bell size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('notifications')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#e9ecef', true: '#c7d2fe' }}
                thumbColor={notificationsEnabled ? '#4361ee' : '#f4f3f4'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => setShowLanguageModal(true)}
            >
              <View style={styles.settingLabelContainer}>
                <Globe2 size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('language')}</Text>
              </View>
              <Text style={styles.languageValue}>{t('language')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(500)}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => setShowRatingModal(true)}
            >
              <View style={styles.settingLabelContainer}>
                <Star size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('rateAndFeedback')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <HelpCircle size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('helpAndSupport')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Shield size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('privacyPolicy')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Settings size={22} color="#4361ee" style={styles.settingIcon} />
                <Text style={styles.settingLabel}>{t('appSettings')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={22} color="#dc3545" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>TrackMyExpiry v1.0.0</Text>
        </View>
      </ScrollView>

      <RatingModal
        isVisible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />

      <LanguageSelector
        isVisible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
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
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 6,
  },
  upgradeButton: {
    backgroundColor: '#e9efff',
  },
  cancelButton: {
    backgroundColor: '#fff5f5',
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
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#6c757d',
  },
  languageValue: {
    fontSize: 14,
    color: '#4361ee',
    fontWeight: '500',
  },
});