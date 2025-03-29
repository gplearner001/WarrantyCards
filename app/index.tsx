import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth state to be determined
  if (isLoading) {
    return null;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}