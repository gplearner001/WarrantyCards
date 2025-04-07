import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface RatingState {
  lastRatingDate: string | null;
  warrantyCountSinceLastRating: number;
  hasRated: boolean;
  rating: number | null;
  feedback: string | null;
  setRating: (rating: number) => void;
  setFeedback: (feedback: string) => void;
  incrementWarrantyCount: () => void;
  resetWarrantyCount: () => void;
  markAsRated: () => void;
  shouldShowRatingPrompt: () => boolean;
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
    storage.setItem('has_rated', 'true');
  },

  shouldShowRatingPrompt: () => {
    const state = get();
    if (state.hasRated) {
      return (state.warrantyCountSinceLastRating % 2) == 0;
    }
    return state.warrantyCountSinceLastRating > 0;
  },
}));