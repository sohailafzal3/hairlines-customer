import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DUMMY_DEVICE_TOKEN } from '../constants';
import { Storage } from '../utils/storage';

const LOCAL_DEVICE_TOKEN_KEY = 'kCustomerLocalDeviceTokenKey';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Booking Updates & Offers',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#2563EB',
        sound: 'default',
      });
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await Notification.requestPermission();
        }
      }
      let webToken = await AsyncStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
      if (!webToken) {
        webToken = `web_cust_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        await AsyncStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, webToken);
      }
      token = webToken;
    } else {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        try {
          const devicePush = await Notifications.getDevicePushTokenAsync();
          if (devicePush?.data && typeof devicePush.data === 'string' && devicePush.data.trim()) {
            token = devicePush.data.trim();
          }
        } catch (nativeErr) {
          try {
            const expoPush = await Notifications.getExpoPushTokenAsync();
            if (expoPush?.data && typeof expoPush.data === 'string' && expoPush.data.trim()) {
              token = expoPush.data.trim();
            }
          } catch (expoErr) {
            let simToken = await AsyncStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
            if (!simToken) {
              simToken = `sim_cust_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
              await AsyncStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, simToken);
            }
            token = simToken;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Customer push token registration error:', error);
  }

  const resolvedToken =
    token && typeof token === 'string' && token.trim().length > 0
      ? token.trim()
      : DUMMY_DEVICE_TOKEN;

  try {
    await Storage.setItem(STORAGE_KEYS.kDeviceToken, resolvedToken);
    await AsyncStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, resolvedToken);
  } catch (e) {
    console.warn('Failed to persist customer device token:', e);
  }

  return resolvedToken;
}

export async function getDeviceToken(): Promise<string> {
  try {
    const cached = await Storage.getItem(STORAGE_KEYS.kDeviceToken);
    if (cached && typeof cached === 'string' && cached.trim().length > 0) {
      return cached.trim();
    }
    const token = await registerForPushNotificationsAsync();
    if (token && typeof token === 'string' && token.trim().length > 0) {
      return token.trim();
    }
  } catch (err) {
    console.warn('getDeviceToken error:', err);
  }
  return DUMMY_DEVICE_TOKEN;
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          data: data ?? {},
          icon: '/favicon.ico',
        });
        return;
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, {
            body,
            data: data ?? {},
            icon: '/favicon.ico',
          });
          return;
        }
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('scheduleLocalNotification failed:', err);
  }
}
