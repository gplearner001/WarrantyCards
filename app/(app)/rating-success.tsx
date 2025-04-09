import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck as CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function RatingSuccessScreen() {
  const router = useRouter();

  const handleDone = () => {
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View 
        entering={FadeIn.duration(800)}
        style={styles.content}
      >
        <CheckCircle2 size={80} color="#4361ee" />
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.message}>
          We appreciate your feedback. Your input helps us improve TrackMyExpiry for everyone.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDone}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 24,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4361ee',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});