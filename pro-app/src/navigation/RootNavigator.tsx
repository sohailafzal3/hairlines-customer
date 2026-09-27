import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { useUser } from "../context/UserContext";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { DrawerNavigator } from "./DrawerNavigator";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { socketManager } from "../services/socket";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from "../services/notifications";
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

    socketManager.connect(user.id);
    if (user.id) startLocationUpdates(user.id);

    const sub1 = addNotificationReceivedListener((n) => {
      console.log("notification received", n.request.content);
    });
    const sub2 = addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as Record<string, any>;
      const type = data?.notificationType || data?.resource?.notificationType;
      const jobId = data?.jobId || data?.resource?.jobId;
      if (type === "messageSendingToReceiverKey" && jobId) {
        navigationRef.navigate("Main", { screen: "HomeTab", params: { screen: "Chat", params: { jobId } } } as any);
      } else if (jobId) {
        navigationRef.navigate("Main", { screen: "HomeTab", params: { screen: "JobDetails", params: { jobId } } } as any);
      }
    });

    return () => {
      socketManager.disconnect();
      sub1.remove();
      sub2.remove();
    };
  }, [user.isLoggedIn, user.id]);

  if (loading) {
    return <LoadingOverlay visible />;
  }

  let initialRoute: keyof RootStackParamList = "Auth";
  if (user.isLoggedIn && !user.isSignUpCompleted) {
    initialRoute = "Onboarding";
  } else if (user.isLoggedIn) {
    initialRoute = "Main";
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
