import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuthStore } from '../store';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

import { registerForPushNotificationsAsync, addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../services/notifications';

import { SplashScreen } from '../screens/SplashScreen';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isLoggedIn, hasHydrated, setLoggedIn, setUser, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await Storage.getItem(STORAGE_KEYS.kIsUserLoggedIn);
        if (loggedIn === 'true') {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [setLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token && user) {
        setUser({ ...user, deviceToken: token });
      }
    });

    const sub1 = addNotificationReceivedListener((notification) => {
      console.log('Customer notification received:', notification.request.content);
    });

    const sub2 = addNotificationResponseReceivedListener((response) => {
      console.log('Customer notification opened:', response.notification.request.content);
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [isLoggedIn]);

  if (!isSplashDone || isLoading || !hasHydrated) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} minDuration={2200} />;
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
