import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Splash: undefined;
  Landing: undefined;
  SignIn: { mode?: "signIn" | "signUp"; isSignUp?: boolean; selectedCountryCode?: string; selectedFlag?: string } | undefined;
  SignUp: { selectedCountryCode?: string; selectedFlag?: string } | undefined;
  Verification: {
    phoneNumber: string;
    countryCode: string;
    code: string;
    isSignUp: boolean;
    isForgotPassword?: boolean;
  };
  ForgotPassword: { phoneNumber?: string; selectedCountryCode?: string; selectedFlag?: string } | undefined;
  SelectCountry: { selectedCode?: string; returnScreen?: "SignIn" | "SignUp" | "ForgotPassword" } | undefined;
};

export type OnboardingStackParamList = {
  PersonalInfo: { addressData?: any; preservedFormData?: any; isFromSettings?: boolean } | undefined;
  Services: { isFromSettings?: boolean } | undefined;
  ServicesFor: { isFromSettings?: boolean } | undefined;
  Certificates: { isFromSettings?: boolean } | undefined;
  IdentityDocuments: { isFromSettings?: boolean } | undefined;
  BankingLanguages: { isFromSettings?: boolean } | undefined;
  Availability: { isFromSettings?: boolean } | undefined;
  ThankYou: undefined;
  SetLocation: { currentFormData?: any } | undefined;
};

export type MainDrawerParamList = {
  HomeTab: undefined;
  Notifications: undefined;
  Profile: undefined;
  Wallet: undefined;
  Earnings: undefined;
  Settings: undefined;
  ShareReferral: undefined;
  Terms: { url?: string; title?: string } | undefined;
  Support: undefined;
  Workers: undefined;
  CreateWorker: undefined;
  History: undefined;
};

export type HomeTabParamList = {
  HomeMap: undefined;
  JobDetails: { jobId: string; status?: number };
  JobRequest: { job: any };
  CostBreakdown: { jobId: string };
  CancellationReasons: { jobId: string };
  Chat: { jobId: string; receiverId?: string; title?: string };
  VoiceCall: { callSid?: string; phoneNumber?: string };
  ServicesSelection: { jobId?: string };
  ToolsAndEquipment: undefined;
  RateUser: { jobId: string; userProfileId: string; name?: string; image?: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainDrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
