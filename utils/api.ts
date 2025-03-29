import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import axiosRetry from 'axios-retry';

// Get the API URL directly from process.env
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

axiosRetry(api, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  },
  retryCondition: (error) => {
    return !!(
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500 && error.response.status <= 599)
    );
  }
});

const checkNetworkConnectivity = async () => {
  try {
    if (Platform.OS === 'web') {
      if (!navigator.onLine) return false;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(`${BASE_URL}/health`, { 
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      console.log(BASE_URL);
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    }
  } catch (error) {
    console.error('Error checking network connectivity:', error);
    return false;
  }
};

api.interceptors.request.use(async (config) => {
  const isConnected = await checkNetworkConnectivity();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network settings.');
  }

  const token = Platform.OS === 'web' 
    ? localStorage.getItem('accessToken')
    : await SecureStore.getItemAsync('accessToken');
    
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        return Promise.reject(new Error('No internet connection. Please check your network settings.'));
      }
      return Promise.reject(new Error('Unable to reach the server. Please try again later.'));
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        const newToken = response.data.access_token;
        
        if (Platform.OS === 'web') {
          localStorage.setItem('accessToken', newToken);
        } else {
          await SecureStore.setItemAsync('accessToken', newToken);
        }
        
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (Platform.OS === 'web') {
          localStorage.removeItem('accessToken');
        } else {
          await SecureStore.deleteItemAsync('accessToken');
        }
        return Promise.reject(new Error('Your session has expired. Please login again.'));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response.data?.message || error.message);
  }
);

export const authApi = {
  signUp: async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  signIn: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/signin', data);
    const { access_token, user } = response.data;
    
    if (Platform.OS === 'web') {
      localStorage.setItem('accessToken', access_token);
    } else {
      await SecureStore.setItemAsync('accessToken', access_token);
    }
    
    return response.data;
  },

  signOut: async () => {
    const response = await api.post('/auth/signout');
    if (Platform.OS === 'web') {
      localStorage.removeItem('accessToken');
    } else {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return response.data;
  }
};

export const warrantyApi = {
  create: async (data: FormData) => {
    const response = await api.post('/warranties', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/warranties');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/warranties/${id}`);
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await api.put(`/warranties/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/warranties/${id}`);
    return response.data;
  }
};