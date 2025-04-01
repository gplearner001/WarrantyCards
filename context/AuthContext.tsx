import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authApi } from '../utils/api';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubscribed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleSubscription: () => void;
  user: any | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  isSubscribed: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  toggleSubscription: () => {},
  user: null,
});

export const useAuth = () => useContext(AuthContext);

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
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await storage.getItem('accessToken');
        const userDataStr = await storage.getItem('userData');
        const subscriptionStatus = await storage.getItem('subscriptionStatus');
        
        if (token && userDataStr) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userDataStr));
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
        
        setIsSubscribed(subscriptionStatus === 'active');
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.signIn({ email, password });
      
      await storage.setItem('accessToken', response.token);
      await storage.setItem('userData', JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.signUp({ name, email, password });
      
      await storage.setItem('accessToken', response.token);
      await storage.setItem('userData', JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = () => {
    setIsSubscribed(prev => {
      const newStatus = !prev;
      storage.setItem('subscriptionStatus', newStatus ? 'active' : 'inactive');
      return newStatus;
    });
  };

  const value = {
    isAuthenticated,
    isLoading,
    isSubscribed,
    login,
    register,
    logout,
    toggleSubscription,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};