import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { checkAndScheduleWarrantyNotifications } from '../utils/notificationUtils';
import { warrantyApi } from '../utils/api';

export type Warranty = {
  id: string;
  productName: string;
  company: string;
  purchaseDate: string;
  expiryDate?: string;
  additionalInfo?: string;
  receiptImage?: string | null;
  productImage?: string | null;
  createdAt: string;
};

type WarrantyState = {
  warranties: Warranty[];
  isLoading: boolean;
  error: string | null;
  fetchWarranties: () => Promise<void>;
  addWarranty: (warranty: Warranty) => Promise<void>;
  updateWarranty: (id: string, warranty: Partial<Warranty>) => Promise<void>;
  deleteWarranty: (id: string) => Promise<void>;
  clearError: () => void;
};

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

// Initialize with empty array to prevent undefined errors
const initialState = {
  warranties: [],
  isLoading: false,
  error: null
};

export const useWarrantyStore = create<WarrantyState>((set, get) => ({
  ...initialState,

  clearError: () => set({ error: null }),

  fetchWarranties: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await warrantyApi.getAll();
      // Ensure we always set an array, even if empty
      const warranties = response?.warranties || [];
      set({ warranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(warranties);
      }
    } catch (error: any) {
      console.error('Error fetching warranties:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch warranties',
        warranties: [] // Ensure we have an empty array on error
      });
    }
  },

  addWarranty: async (warranty: Warranty) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      Object.entries(warranty).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await warrantyApi.create(formData);
      const currentWarranties = get().warranties || []; // Ensure we have an array
      const updatedWarranties = [...currentWarranties, response.warranty];
      
      set({ warranties: updatedWarranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(updatedWarranties);
      }
    } catch (error: any) {
      console.error('Error adding warranty:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to add warranty'
      });
      throw error;
    }
  },

  updateWarranty: async (id: string, updatedFields: Partial<Warranty>) => {
    set({ isLoading: true, error: null });
    try {
      const currentWarranties = get().warranties || []; // Ensure we have an array
      const updatedWarranties = currentWarranties.map(warranty => 
        warranty.id === id ? { ...warranty, ...updatedFields } : warranty
      );
      
      set({ warranties: updatedWarranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(updatedWarranties);
      }
    } catch (error: any) {
      console.error('Error updating warranty:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update warranty'
      });
      throw error;
    }
  },

  deleteWarranty: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentWarranties = get().warranties || []; // Ensure we have an array
      const updatedWarranties = currentWarranties.filter(warranty => warranty.id !== id);
      
      set({ warranties: updatedWarranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(updatedWarranties);
      }
    } catch (error: any) {
      console.error('Error deleting warranty:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to delete warranty'
      });
      throw error;
    }
  },
}));