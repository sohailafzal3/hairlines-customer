import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuthStore } from '../store';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import { SplashScreen } from '../screens/SplashScreen';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  fontsLoaded?: boolean;
}

const RootNavigator: React.FC<RootNavigatorProps> = ({ fontsLoaded = true }) => {
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await Storage.getItem(STORAGE_KEYS.kIsUserLoggedIn);
        setLoggedIn(loggedIn === 'true');
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, [setLoggedIn]);

  if (isAuthLoading || !isSplashDone || !fontsLoaded) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} minDuration={1000} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
