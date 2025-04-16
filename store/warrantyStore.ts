import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { checkAndScheduleWarrantyNotifications } from '../utils/notificationUtils';
import { warrantyApi, ratingApi } from '../utils/api';

export type Warranty = {
  id: string;
  productName: string;
  company: string;
  expiryDate?: string;
  additionalInfo?: string;
  receiptImage?: string | null;
  productImage?: string | null;
  createdAt: string;
  notificationDays?: number;
};

interface APIWarranty {
  warranty_id: string;
  product_name: string;
  company_name: string;
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
  addWarranty: (warranty: Warranty) => Promise<boolean>;
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

const mapAPIWarrantyToWarranty = (apiWarranty: APIWarranty): Warranty => ({
  id: apiWarranty.warranty_id,
  productName: apiWarranty.product_name,
  company: apiWarranty.company_name,
  expiryDate: apiWarranty.expiry_date || undefined,
  additionalInfo: apiWarranty.additional_info || undefined,
  receiptImage: apiWarranty.receipt_image_url || undefined,
  productImage: apiWarranty.product_image_url || undefined,
  createdAt: apiWarranty.created_at,
});

const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const filename = uri.split('/').pop() || 'image.jpg';
      const downloadPath = `${FileSystem.cacheDirectory}${filename}`;
      
      const { uri: localUri } = await FileSystem.downloadAsync(uri, downloadPath);
      
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      
      return `data:image/jpeg;base64,${base64}`;
    } else {
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export const useWarrantyStore = create<WarrantyState>((set, get) => ({
  warranties: [],
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
        warranties: []
      });
    }
  },

  addWarranty: async (warranty: Warranty) => {
    set({ isLoading: true, error: null });
    try {
      let productImageBase64: string | undefined;
      let receiptImageBase64: string | undefined;

      if (warranty.productImage) {
        productImageBase64 = await convertImageToBase64(warranty.productImage);
      }
      if (warranty.receiptImage) {
        receiptImageBase64 = await convertImageToBase64(warranty.receiptImage);
      }

      const payload = {
        productName: warranty.productName,
        companyName: warranty.company,
        expiryDate: warranty.expiryDate,
        additionalInfo: warranty.additionalInfo,
        receiptImage: receiptImageBase64,
        productImage: productImageBase64,
      };

      await warrantyApi.create(payload);
      const currentWarranties = get().warranties;
      const updatedWarranties = [...currentWarranties, warranty];
      
      set({ warranties: updatedWarranties, isLoading: false });
      
      if (Platform.OS !== 'web') {
        await checkAndScheduleWarrantyNotifications(updatedWarranties);
      }

      try {
        const response = await ratingApi.getRatingStatus();
        return !response || !response.rating_id;
      } catch (error) {
        console.error('Error checking rating status:', error);
        return false;
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
      let receiptImageBase64: string | undefined;
      let productImageBase64: string | undefined;

      if (updatedFields.receiptImage) {
        receiptImageBase64 = await convertImageToBase64(updatedFields.receiptImage);
      }
      if (updatedFields.productImage) {
        productImageBase64 = await convertImageToBase64(updatedFields.productImage);
      }

      const payload = {
        ...updatedFields,
        companyName: updatedFields.company,
        receiptImage: receiptImageBase64,
        productImage: productImageBase64,
      };

      await warrantyApi.update(id, payload);
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