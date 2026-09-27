import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "./types";
import { PersonalInfoScreen } from "../screens/onboarding/PersonalInfoScreen";
import { ServicesScreen } from "../screens/onboarding/ServicesScreen";
import { ServicesForScreen } from "../screens/onboarding/ServicesForScreen";
import { CertificatesScreen } from "../screens/onboarding/CertificatesScreen";
import { IdentityDocumentsScreen } from "../screens/onboarding/IdentityDocumentsScreen";
import { BankingLanguagesScreen } from "../screens/onboarding/BankingLanguagesScreen";
import { AvailabilityScreen } from "../screens/onboarding/AvailabilityScreen";
import { ThankYouScreen } from "../screens/onboarding/ThankYouScreen";
import { SetLocationScreen } from "../screens/onboarding/SetLocationScreen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="ServicesFor" component={ServicesForScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="IdentityDocuments" component={IdentityDocumentsScreen} />
      <Stack.Screen name="BankingLanguages" component={BankingLanguagesScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="ThankYou" component={ThankYouScreen} />
      <Stack.Screen name="SetLocation" component={SetLocationScreen} />
    </Stack.Navigator>
  );
}
