import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeTabParamList } from "./types";
import { HomeMapScreen } from "../screens/main/home/HomeMapScreen";
import { JobDetailsScreen } from "../screens/main/home/JobDetailsScreen";
import { JobRequestScreen } from "../screens/main/home/JobRequestScreen";
import { CostBreakdownScreen } from "../screens/main/home/CostBreakdownScreen";
import { CancellationReasonsScreen } from "../screens/main/home/CancellationReasonsScreen";
import { ChatScreen } from "../screens/main/chat/ChatScreen";
import { VoiceCallScreen } from "../screens/main/call/VoiceCallScreen";
import { ServicesSelectionScreen } from "../screens/main/home/ServicesSelectionScreen";
import { ToolsAndEquipmentScreen } from "../screens/main/home/ToolsAndEquipmentScreen";
import { RateUserScreen } from "../screens/main/home/RateUserScreen";

const Stack = createNativeStackNavigator<HomeTabParamList>();

export function HomeTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMap" component={HomeMapScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen
        name="JobRequest"
        component={JobRequestScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="CostBreakdown" component={CostBreakdownScreen} />
      <Stack.Screen
        name="CancellationReasons"
        component={CancellationReasonsScreen}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="VoiceCall" component={VoiceCallScreen} />
      <Stack.Screen name="ServicesSelection" component={ServicesSelectionScreen} />
      <Stack.Screen name="ToolsAndEquipment" component={ToolsAndEquipmentScreen} />
      <Stack.Screen name="RateUser" component={RateUserScreen} />
    </Stack.Navigator>
  );
}
