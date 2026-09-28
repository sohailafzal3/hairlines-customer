import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function registerForPushNotificationsAsync(): Promise<string | null> {
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
      return webToken;
    }

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

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      const devicePush = await Notifications.getDevicePushTokenAsync();
      token = devicePush.data as string;
    } catch (nativeErr) {
      try {
        const expoPush = await Notifications.getExpoPushTokenAsync();
        token = expoPush.data;
      } catch (expoErr) {
        let simToken = await AsyncStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
        if (!simToken) {
          simToken = `sim_cust_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          await AsyncStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, simToken);
        }
        token = simToken;
      }
    }
  } catch (error) {
    console.warn('Customer push token registration error:', error);
  }

  return token;
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
