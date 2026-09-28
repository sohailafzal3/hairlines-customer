import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { useUser } from "../context/UserContext";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { DrawerNavigator } from "./DrawerNavigator";
import { SplashScreen } from "../screens/SplashScreen";
import { socketManager } from "../services/socket";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  scheduleLocalNotification,
} from "../services/notifications";
import { NotificationType } from "../constants";
import { startLocationUpdates } from "../services/location";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading, updateUser } = useUser();

  useEffect(() => {
    if (!user.isLoggedIn) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) updateUser({ deviceToken: token });
    });

    // Setup socket notification listeners to trigger local notifications
    const unsubOffer = socketManager.on(NotificationType.userSendOffer, (data) => {
      const socketData = data?.socket || data;
      const title = socketData?.appTitle || "New Appointment Request";
      const message = socketData?.message || "A customer sent a new service request!";
      const jobId = socketData?.jobId;
      scheduleLocalNotification(title, message, { jobId, notificationType: NotificationType.userSendOffer });
    });

    const unsubMsg = socketManager.on(NotificationType.newMessage, (data) => {
      const socketData = data?.socket || data;
      const msgObj = socketData?.message || socketData;
      const title = msgObj?.title || msgObj?.senderName || "New Message";
      const body = msgObj?.body || msgObj?.message || "You received a new message";
      const jobId = msgObj?.jobId;
      scheduleLocalNotification(title, body, { jobId, notificationType: NotificationType.newMessage });
    });

    const unsubCancel = socketManager.on(NotificationType.userCancelJob, (data) => {
      const socketData = data?.socket || data;
      const title = socketData?.appTitle || "Appointment Cancelled";
      const message = socketData?.message || "A customer cancelled their booking";
      const jobId = socketData?.jobId;
      scheduleLocalNotification(title, message, { jobId, notificationType: NotificationType.userCancelJob });
    });

    const unsubApproval = socketManager.on(NotificationType.adminApproval, (data) => {
      const socketData = data?.socket || data;
      const title = socketData?.appTitle || "Account Approved";
      const message = socketData?.message || "Your professional profile has been verified!";
      scheduleLocalNotification(title, message, { notificationType: NotificationType.adminApproval });
    });

    const unsubAdmin = socketManager.on(NotificationType.notificationFromAdmin, (data) => {
      const socketData = data?.socket || data;
      const title = socketData?.appTitle || "Hairlines Update";
      const message = socketData?.message || "New announcement from administration";
      scheduleLocalNotification(title, message, { notificationType: NotificationType.notificationFromAdmin });
    });

    const unsubGeneral = socketManager.on(NotificationType.generalNotifications, (data) => {
      const socketData = data?.socket || data;
      const title = socketData?.appTitle || "Notification";
      const message = socketData?.message || "You have a new update";
      scheduleLocalNotification(title, message, { notificationType: NotificationType.generalNotifications });
    });

    const sub1 = addNotificationReceivedListener((n) => {
      console.log("Notification received:", n.request.content);
    });

    const sub2 = addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as Record<string, any>;
      const type = data?.notificationType || data?.resource?.notificationType || data?.resource?.type;
      const jobId = data?.jobId || data?.resource?.jobId;
      if ((type === NotificationType.newMessage || type === "messageSendingToReceiverKey") && jobId) {
        navigationRef.navigate("Main", { screen: "HomeTab", params: { screen: "Chat", params: { jobId } } } as any);
      } else if (jobId) {
        navigationRef.navigate("Main", { screen: "HomeTab", params: { screen: "JobDetails", params: { jobId } } } as any);
      } else {
        navigationRef.navigate("Main", { screen: "Notifications" } as any);
      }
    });

    return () => {
      socketManager.disconnect();
      unsubOffer();
      unsubMsg();
      unsubCancel();
      unsubApproval();
      unsubAdmin();
      unsubGeneral();
      sub1.remove();
      sub2.remove();
    };
  }, [user.isLoggedIn, user.id]);

  const [isSplashDone, setIsSplashDone] = useState(false);

  if (!isSplashDone || loading) {
    return <SplashScreen onFinish={() => setIsSplashDone(true)} minDuration={2200} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user.isLoggedIn ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !user.isSignUpCompleted ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
            <Stack.Screen name="Main" component={DrawerNavigator} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
