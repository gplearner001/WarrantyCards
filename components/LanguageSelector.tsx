import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useLanguageStore, LANGUAGES, t, LanguageCode } from '../utils/i18n';
import { Check } from 'lucide-react-native';

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ isVisible, onClose }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguageStore();

  const handleLanguageSelect = async (code: LanguageCode) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('language')}</Text>
          
          <ScrollView style={styles.languageList}>
            {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.languageOption,
                  language === code && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageSelect(code)}
              >
                <Text style={[
                  styles.languageName,
                  language === code && styles.selectedLanguageText,
                ]}>
                  {name}
                </Text>
                {language === code && (
                  <Check size={20} color="#4361ee" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>{t('cancel')}</Text>
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
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageList: {
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedLanguage: {
    backgroundColor: '#e9efff',
  },
  languageName: {
    fontSize: 16,
    color: '#495057',
  },
  selectedLanguageText: {
    color: '#4361ee',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});