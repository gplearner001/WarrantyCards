import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ratingApi } from '../utils/api';

interface RatingState {
  lastRatingDate: string | null;
  warrantyCountSinceLastRating: number;
  hasRated: boolean;
  rating: number | null;
  feedback: string | null;
  isSubmitting: boolean;
  error: string | null;
  setRating: (rating: number) => void;
  setFeedback: (feedback: string) => void;
  incrementWarrantyCount: () => void;
  resetWarrantyCount: () => void;
  markAsRated: () => void;
  shouldShowRatingPrompt: () => boolean;
  submitRating: (rating: number, feedback: string) => Promise<void>;
  checkRatingStatus: () => Promise<void>;
}

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

export const useRatingStore = create<RatingState>((set, get) => ({
  lastRatingDate: null,
  warrantyCountSinceLastRating: 0,
  hasRated: false,
  rating: null,
  feedback: null,
  isSubmitting: false,
  error: null,

  setRating: (rating: number) => {
    set({ rating });
    storage.setItem('app_rating', rating.toString());
  },

  setFeedback: (feedback: string) => {
    set({ feedback });
    storage.setItem('app_feedback', feedback);
  },

  incrementWarrantyCount: () => {
    set(state => ({
      warrantyCountSinceLastRating: state.warrantyCountSinceLastRating + 1
    }));
  },

  resetWarrantyCount: () => {
    set({ warrantyCountSinceLastRating: 0 });
  },

  markAsRated: () => {
    const now = new Date().toISOString();
    set({
      hasRated: true,
      lastRatingDate: now,
      warrantyCountSinceLastRating: 0
    });
    storage.setItem('last_rating_date', now);
  },

  shouldShowRatingPrompt: () => {
    const state = get();
    if (state.hasRated) {
      return (state.warrantyCountSinceLastRating % 2) == 0;
    }
    return state.warrantyCountSinceLastRating > 0;
  },

  checkRatingStatus: async () => {
    try {
      const response = await ratingApi.getRatingStatus();
      set({ 
        hasRated: response.hasRated,
        lastRatingDate: response.lastRatedAt || null,
        rating: response.rating || null,
        feedback: response.feedback || null
      });
    } catch (error) {
      console.error('Error checking rating status:', error);
      // If API fails, fallback to default state
      set({ hasRated: false, lastRatingDate: null, rating: null, feedback: null });
    }
  },

  submitRating: async (rating: number, feedback: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await ratingApi.submitRating({ rating, feedback });
      set({ isSubmitting: false });
      get().markAsRated();
      // Refresh rating status after submission
      await get().checkRatingStatus();
    } catch (error: any) {
      set({ 
        isSubmitting: false,
        error: error.message || 'Failed to submit rating'
      });
      throw error;
    }
  },
}));