import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useRatingStore } from '../../store/ratingStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RatingScreen() {
  const router = useRouter();
  const { rating: savedRating, feedback: savedFeedback, setRating, setFeedback, markAsRated } = useRatingStore();
  const [selectedRating, setSelectedRating] = useState(savedRating || 0);
  const [feedbackText, setFeedbackText] = useState(savedFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === 0) return;

    setIsSubmitting(true);
    try {
      setRating(selectedRating);
      if (feedbackText.trim()) {
        setFeedback(feedbackText.trim());
      }
      markAsRated();
      router.back();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate & Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
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
                  size={40}
                  color={rating <= selectedRating ? '#ffc107' : '#e9ecef'}
                  fill={rating <= selectedRating ? '#ffc107' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.feedbackLabel}>Tell us more about your experience</Text>
          <Text style={styles.feedbackSubtext}>
            Your feedback helps us improve the app for everyone.
          </Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Share your thoughts with us..."
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedRating === 0 && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === 0 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  starButton: {
    padding: 8,
  },
  feedbackLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  feedbackSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  feedbackInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    marginBottom: 24,
    fontSize: 16,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  submitButton: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});