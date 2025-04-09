import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  InputAccessoryView,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { useRatingStore } from '../store/ratingStore';

interface RatingModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RatingModal({ isVisible, onClose }: RatingModalProps) {
  const { submitRating } = useRatingStore();
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputAccessoryViewID = 'feedbackInput';

  const handleSubmit = async () => {
    if (selectedRating === 0) return;

    setIsSubmitting(true);
    try {
      await submitRating(selectedRating, feedbackText.trim());
      Alert.alert(
        'Thank You!',
        'Thanks for rating TrackMyExpiry app. Your feedback helps us improve!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Rate Your Experience</Text>
              <Text style={styles.subtitle}>
                How would you rate your experience with TrackMyExpiry?
              </Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setSelectedRating(rating)}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color={rating <= selectedRating ? '#ffc107' : '#e9ecef'}
                      fill={rating <= selectedRating ? '#ffc107' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.feedbackLabel}>Additional Feedback (Optional)</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us what you think..."
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                inputAccessoryViewID={inputAccessoryViewID}
                editable={!isSubmitting}
              />

              {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={inputAccessoryViewID}>
                  <View style={styles.inputAccessory}>
                    <TouchableOpacity
                      onPress={dismissKeyboard}
                      style={styles.doneButton}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </InputAccessoryView>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    selectedRating === 0 && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={selectedRating === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 8,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 24,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#4361ee',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputAccessory: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    padding: 8,
    alignItems: 'flex-end',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: '#4361ee',
    fontSize: 16,
    fontWeight: '600',
  },
});