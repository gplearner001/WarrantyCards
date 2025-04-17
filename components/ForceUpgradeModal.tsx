import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Download } from 'lucide-react-native';

interface ForceUpgradeModalProps {
  isVisible: boolean;
  currentVersion: string;
  requiredVersion: string;
  storeUrls?: {
    appstore: string;
    playstore: string;
  };
}

export default function ForceUpgradeModal({
  isVisible,
  currentVersion,
  requiredVersion,
  storeUrls,
}: ForceUpgradeModalProps) {
  const handleUpdate = async () => {
    const storeUrl = Platform.select({
      ios: storeUrls?.appstore,
      android: storeUrls?.playstore,
      default: storeUrls?.playstore, // Default to Play Store URL for web
    });

    if (!storeUrl) {
      console.error('No store URL available for platform');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        console.error('Cannot open store URL:', storeUrl);
      }
    } catch (error) {
      console.error('Error opening store URL:', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Download size={48} color="#4361ee" style={styles.icon} />
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A new version of TrackMyExpiry is available. Please update to continue using the app.
          </Text>
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Current version: {currentVersion}</Text>
            <Text style={styles.versionText}>Required version: {requiredVersion}</Text>
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  versionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  updateButton: {
    backgroundColor: '#4361ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});