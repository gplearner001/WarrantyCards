import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { groceryApi } from '../utils/api';
import { Warranty } from './warrantyStore';

export interface GroceryItem {
  id: string;
  warrantyId: string;
  quantity: number;
  notes?: string;
  warranty?: Warranty;
}

interface GroceryState {
  groceries: GroceryItem[];
  isLoading: boolean;
  error: string | null;
  fetchGroceries: () => Promise<void>;
  addToGroceryList: (warrantyId: string, quantity?: number, notes?: string) => Promise<void>;
  removeFromGroceryList: (groceryId: string) => Promise<void>;
  clearError: () => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  groceries: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGroceries: async () => {
    set({ isLoading: true, error: null });
    try {
      const groceries = await groceryApi.getAll();
      set({ groceries, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching groceries:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch groceries',
        groceries: []
      });
    }
  },

  addToGroceryList: async (warrantyId: string, quantity: number = 1, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      await groceryApi.create({ warrantyId, quantity, notes });
      await get().fetchGroceries(); // Refresh the list
    } catch (error: any) {
      console.error('Error adding to grocery list:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to add to grocery list'
      });
      throw error;
    }
  },

  removeFromGroceryList: async (groceryId: string) => {
    set({ isLoading: true, error: null });
    try {
      await groceryApi.delete(groceryId);
      const currentGroceries = get().groceries;
      const updatedGroceries = currentGroceries.filter(item => item.id !== groceryId);
      set({ groceries: updatedGroceries, isLoading: false });
    } catch (error: any) {
      console.error('Error removing from grocery list:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to remove from grocery list'
      });
      throw error;
    }
  },
}));