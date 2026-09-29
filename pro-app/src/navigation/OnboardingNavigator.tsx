import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "./types";
import { PersonalInfoScreen } from "../screens/onboarding/PersonalInfoScreen";
import { ServicesForScreen } from "../screens/onboarding/ServicesForScreen";
import { ServicesScreen } from "../screens/onboarding/ServicesScreen";
import { CertificatesScreen } from "../screens/onboarding/CertificatesScreen";
import { IdentityDocumentsScreen } from "../screens/onboarding/IdentityDocumentsScreen";
import { BankingLanguagesScreen } from "../screens/onboarding/BankingLanguagesScreen";
import { AvailabilityScreen } from "../screens/onboarding/AvailabilityScreen";
import { ThankYouScreen } from "../screens/onboarding/ThankYouScreen";
import { SetLocationScreen } from "../screens/onboarding/SetLocationScreen";
import { useUser } from "../context/UserContext";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const { user } = useUser();

  const getInitialRoute = (): keyof OnboardingStackParamList => {
    switch (user.signUpStepCompleted) {
      case 0:
        return "PersonalInfo";
      case 1:
        return "ServicesFor";
      case 2:
        return "Services";
      case 3:
        return "Certificates";
      case 4:
        return "IdentityDocuments";
      case 5:
        return "BankingLanguages";
      case 6:
        return "Availability";
      case 7:
        return "ThankYou";
      default:
        return "PersonalInfo";
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRoute()}
    >
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="ServicesFor" component={ServicesForScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="IdentityDocuments" component={IdentityDocumentsScreen} />
      <Stack.Screen name="BankingLanguages" component={BankingLanguagesScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="ThankYou" component={ThankYouScreen} />
      <Stack.Screen name="SetLocation" component={SetLocationScreen} />
    </Stack.Navigator>
  );
}

