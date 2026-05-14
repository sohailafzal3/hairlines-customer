import { apiClient } from './client';
import { Account, CountryCode } from '../models';

export const AuthApi = {
  sendVerificationCode: (countryCode: string, phoneNumber: string) =>
    apiClient.post('sign-up/send-verification-code', {
      countryCode,
      phoneNumber,
      userType: 1,
    }),

  signIn: (params: {
    countryCode: string;
    phoneNumber: string;
    password: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post<Account>('sign-in', {
      ...params,
      userType: 1,
    }),

  forgotPassword: (params: {
    countryCode: string;
    phoneNumber: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post('forgot-password', {
      ...params,
      userType: 1,
    }),

  signUpGuest: (params: {
    countryCode: string;
    phoneNumber: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post<Account>('sign-up/guest', {
      ...params,
      userType: 1,
    }),

  getCountryCodes: () => apiClient.get<CountryCode[]>('country/codes'),

  verifyCode: (params: {
    countryCode: string;
    phoneNumber: string;
    code: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post<Account>('sign-up/verify-verification-code', {
      ...params,
      userType: 1,
    }),

  verifySignInCode: (params: {
    countryCode: string;
    phoneNumber: string;
    code: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post<Account>('sign-in/verify-verification-code', {
      ...params,
      userType: 1,
    }),

  facebookAuth: (accessToken: string, deviceToken: string, deviceType: string) =>
    apiClient.post<Account>('auth/facebook', {
      access_token: accessToken,
      userType: 1,
      deviceType,
      deviceToken,
    }),

  appleAuth: (params: {
    firstName: string;
    lastName: string;
    email: string;
    appleId: string;
    deviceToken: string;
    deviceType: string;
  }) =>
    apiClient.post<Account>('auth/apple', {
      ...params,
      userType: 1,
    }),

  addPhoneNumber: (params: {
    countryCode: string;
    phoneNumber: string;
    userAccountId: string;
    userId: string;
  }) =>
    apiClient.post('add-phoneNumber', {
      ...params,
      userType: 1,
    }),

  logout: () => apiClient.get('logout'),

  basicInfo: (params: any) => apiClient.post<Account>('user/basic-info', params),

  checkVersion: (versionCode: string, deviceType: string, userType: string = 'user') =>
    apiClient.put('check-version', { versionCode, deviceType, userType }),
};
