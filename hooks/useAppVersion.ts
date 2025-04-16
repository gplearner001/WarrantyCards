import { useState, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import { appApi } from '../utils/api';

export function useAppVersion() {
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  const compareVersions = (v1: string, v2: string) => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
  };

  const checkVersion = async () => {
    try {
      setIsChecking(true);
      const { version } = await appApi.getVersion();
      setRequiredVersion(version);
      
      const needsUpdate = compareVersions(currentVersion, version) < 0;
      setNeedsUpgrade(needsUpdate);
    } catch (error) {
      console.error('Error checking app version:', error);
      setNeedsUpgrade(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVersion();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkVersion();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    needsUpgrade,
    currentVersion,
    requiredVersion,
    isChecking,
  };
}