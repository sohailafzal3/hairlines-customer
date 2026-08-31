import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Landing: undefined;
  SignIn: { mode?: "signIn" | "signUp" } | undefined;
  Verification: {
    phoneNumber: string;
    countryCode: string;
    code: string;
    isSignUp: boolean;
  };
  ForgotPassword: { phoneNumber?: string } | undefined;
};

export type OnboardingStackParamList = {
  PersonalInfo: { addressData?: any } | undefined;
  Services: undefined;
  ServicesFor: undefined;
  Certificates: undefined;
  IdentityDocuments: undefined;
  BankingLanguages: undefined;
  Availability: undefined;
  ThankYou: undefined;
  SetLocation: undefined;
};

export type MainDrawerParamList = {
  HomeTab: undefined;
  Notifications: undefined;
  Profile: undefined;
  Wallet: undefined;
  Earnings: undefined;
  Settings: undefined;
  ShareReferral: undefined;
  Terms: undefined;
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
