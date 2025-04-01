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

// API response type
interface APIWarranty {
  warranty_id: string;
  product_name: string;
  company_name: string;
  purchase_date: string;
  expiry_date: string | null;
  additional_info: string | null;
  receipt_image_url: string | null;
  product_image_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

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

// Function to map API warranty to frontend warranty
const mapAPIWarrantyToWarranty = (apiWarranty: APIWarranty): Warranty => ({
  id: apiWarranty.warranty_id,
  productName: apiWarranty.product_name,
  company: apiWarranty.company_name,
  purchaseDate: apiWarranty.purchase_date,
  expiryDate: apiWarranty.expiry_date || undefined,
  additionalInfo: apiWarranty.additional_info || undefined,
  receiptImage: apiWarranty.receipt_image_url || undefined,
  productImage: apiWarranty.product_image_url || undefined,
  createdAt: apiWarranty.created_at,
});

export const useWarrantyStore = create<WarrantyState>((set, get) => ({
  warranties: [], // Initialize with empty array
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchWarranties: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await warrantyApi.getAll();
      
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format from API');
      }
      
      // Map API warranties to frontend warranty format
      const mappedWarranties = response.map(mapAPIWarrantyToWarranty);
      
      set({ warranties: mappedWarranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(mappedWarranties);
      }
    } catch (error: any) {
      console.error('Error fetching warranties:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch warranties',
        warranties: [] // Ensure warranties is always an array
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
      const currentWarranties = get().warranties;
      const updatedWarranties = [...currentWarranties, warranty];
      
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
      const formData = new FormData();
      Object.entries(updatedFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await warrantyApi.update(id, formData);
      const currentWarranties = get().warranties;
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
      await warrantyApi.delete(id);
      const currentWarranties = get().warranties;
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