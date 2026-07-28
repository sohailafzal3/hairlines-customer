import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginSignUpScreen from '../screens/Auth/LoginSignUpScreen';
import SignInScreen from '../screens/Auth/SignInScreen';
import VerificationScreen from '../screens/Auth/VerificationScreen';
import SignUpFirstScreen from '../screens/Auth/SignUpFirstScreen';
import ThankYouScreen from '../screens/Auth/ThankYouScreen';
import NewPasswordScreen from '../screens/Auth/NewPasswordScreen';
import SelectCountryScreen from '../screens/Auth/SelectCountryScreen';
import SelectLanguageScreen from '../screens/Auth/SelectLanguageScreen';

export type AuthStackParamList = {
  LoginSignUp: undefined;
  SignIn: { isSignUp: boolean; selectedCountryCode?: string; selectedFlag?: string };
  Verification: { countryCode: string; phoneNumber: string; isSignUp: boolean; isForgotPassword?: boolean };
  SignUpFirst: undefined;
  ThankYou: undefined;
  NewPassword: undefined;
  SelectCountry: { selectedCode?: string };
  SelectLanguage: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LoginSignUp" component={LoginSignUpScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="SignUpFirst" component={SignUpFirstScreen} />
      <Stack.Screen name="ThankYou" component={ThankYouScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="SelectCountry" component={SelectCountryScreen} />
      <Stack.Screen name="SelectLanguage" component={SelectLanguageScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
