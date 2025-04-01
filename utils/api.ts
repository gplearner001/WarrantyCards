import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Warranty } from '../store/warrantyStore';

// Get the API URL from environment variables
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Types for API responses
interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface WarrantyResponse {
  warrantyId: string;
  message: string;
}

interface WarrantiesResponse {
  warranties: Warranty[];
}

// Storage implementation
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
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  }
};

// Logger utility
const logger = {
  request: (method: string, url: string, headers: HeadersInit, body?: any) => {
    console.group(`🚀 API Request: ${method} ${url}`);
    console.log('Headers:', headers);
    if (body) {
      console.log('Body:', body instanceof FormData ? 'FormData' : body);
      if (body instanceof FormData) {
        // Log FormData entries safely
        const formDataEntries: { [key: string]: any } = {};
        body.forEach((value, key) => {
          formDataEntries[key] = value;
        });
        console.log('FormData entries:', formDataEntries);
      }
    }
    console.groupEnd();
  },
  response: (method: string, url: string, status: number, data: any) => {
    console.group(`✅ API Response: ${method} ${url}`);
    console.log('Status:', status);
    console.log('Data:', data);
    console.groupEnd();
  },
  error: (method: string, url: string, error: any) => {
    console.group(`❌ API Error: ${method} ${url}`);
    console.error('Error:', error);
    console.groupEnd();
  }
};

// API client implementation
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  try {
    const token = await storage.getItem('accessToken');
    const userDataStr = await storage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(userData?.id && { 'X-User-ID': userData.id }), // Add userId to headers
      ...options.headers
    };

    // Log request
    logger.request(method, url, headers, options.body);

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    // Log response
    logger.response(method, url, response.status, data);

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        await storage.removeItem('accessToken');
        await storage.removeItem('userData');
        throw new Error('Authentication required');
      }

      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    // Log error
    logger.error(method, url, error);
    throw error;
  }
}

// Auth API
export const authApi = {
  async signUp(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async signIn(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Store user data after successful login
    if (response.user) {
      await storage.setItem('userData', JSON.stringify(response.user));
    }
    
    return response;
  },

  async signOut(): Promise<void> {
    const token = await storage.getItem('accessToken');
    if (token) {
      await apiRequest('/api/auth/signout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    await storage.removeItem('accessToken');
    await storage.removeItem('userData');
  }
};

// Warranty API
export const warrantyApi = {
  async create(data: FormData): Promise<WarrantyResponse> {
    const token = await storage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    return apiRequest('/api/warranty', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it automatically with boundary
      },
      body: data
    });
  },

  async getAll(): Promise<WarrantiesResponse> {
    return apiRequest('/api/warranty');
  },

  async getById(warrantyId: string): Promise<Warranty> {
    return apiRequest(`/api/warranty?warrantyId=${warrantyId}`);
  },

  async update(warrantyId: string, data: FormData): Promise<WarrantyResponse> {
    const token = await storage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    return apiRequest(`/api/warranty/${warrantyId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data
    });
  },

  async delete(warrantyId: string): Promise<void> {
    return apiRequest(`/api/warranty/${warrantyId}`, {
      method: 'DELETE'
    });
  }
};