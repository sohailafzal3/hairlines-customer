// Constants matching iOS Constants.swift
export const kSocketUrl = 'https://api.hairlines.app';
export const kBaseUrl = 'https://api.hairlines.app/api/v1/en/';

// Third-party Keys
// TODO: Move these to .env / EAS Secrets (see AGENTS.md Security Considerations)
export const kGoogleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';
export const kStripeKey = process.env.EXPO_PUBLIC_STRIPE_KEY || '';

// S3 / AWS
export const kS3Prefix = 'https://hairlines-lives.s3.us-west-2.amazonaws.com/';
export const AWSAccesskey = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || '';
export const AWSSecretKey = process.env.EXPO_PUBLIC_AWS_SECRET_KEY || '';

// App Store / Share Links
export const kiOSUserAppUrl = 'https://itunes.apple.com/us/app/id1563168738';
export const kAndroidUserAppUrl = 'https://play.google.com/store/apps/details?id=apps.hairlines.user.barber';
export const kUserAppUrl = 'http://onelink.to/3ekmja';
export const kTermsLink = 'https://www.hairlines.app/termsAndConditions.html';
export const kPrivicyPolicyLink = 'https://www.hairlines.app/privacyPolicy.html';

// Pagination
export const kOffSet = 10;

// Enums
export enum JobStatus {
  noStatus = 0,
  Open = 1,
  Accepted = 2,
  Started = 3,
  Arrived = 4,
  StartJob = 5,
  Completed = 6,
  Finished = 7,
  Rejected = 8,
  Cancelled = 9,
}

export enum SenderType {
  user = 1,
  sp = 2,
}

export enum NotificationType {
  spOfferAccepted = 'spOfferAccepted',
  spOfferRejected = 'spOfferRejected',
  spOnWay = 'spOnWay',
  spArrived = 'spArrived',
  spStartJob = 'spStartJob',
  spCompleteJob = 'spCompleteJob',
  spCancelJob = 'spCancelJob',
  spResumeJob = 'spResumeJob',
  spPauseJob = 'spPauseJob',
  spLocationTracking = 'spLocationTracking',
  newMessage = 'newMessage',
  generalNotifications = 'generalNotifications',
  spAddLineItem = 'spAddLineItem',
  spDeleteLineItem = 'spDeleteLineItem',
  spEditLineItem = 'spEditLineItem',
  customNotification = 'customNotification',
  unregisterFromTwilio = 'unregisterFromTwilio',
  adminCompleteJob = 'adminCompleteJob',
  notificationFromAdmin = 'notificationFromAdmin',
  jobTimeOut = 'jobTimeOut',
  spConsultService = 'spConsultService',
}

export enum UploadImageType {
  profileImage = 'profileImage',
  GeneralImages = 'GeneralImages',
  identityDocumentsImages = 'identityDocumentsImages',
  preferenceImages = 'preferenceImages',
}

export enum Genders {
  MALE = 'male',
  FEMALE = 'female',
}

export enum FontTypeface {
  UbuntuRegular = 'Ubuntu',
  UbuntuMedium = 'Ubuntu-Medium',
  UbuntuBold = 'Ubuntu-Bold',
  UberMoveRegular = 'uber_move_r',
  UberMoveMedium = 'uber_move_m',
  UberMoveBold = 'uber_move_b',
  UberMoveLight = 'uber_move_l',
  ProximaNovaSemibold = 'ProximaNova-Semibold',
}

// AsyncStorage Keys
export const STORAGE_KEYS = {
  kDeviceToken: 'kDeviceToken',
  kIsUserLoggedIn: 'kIsUserLoggedIn',
  kIsGuestUserLoggedIn: 'kIsGuestUserLoggedIn',
  kUserId: 'kUserId',
  kUserFirstName: 'kUserFirstName',
  kUserLastName: 'kUserLastName',
  kUserEmail: 'kUserEmail',
  kUserMobile: 'kUserMobile',
  kUserProfileImageUrl: 'kUserProfileImageUrl',
  kUserMobilecode: 'kUserMobilecode',
  kReferalCode: 'kReferalCode',
  kAccountType: 'kAccountType',
  kAvgRating: 'kAvgRating',
  kCompanyName: 'kCompanyName',
  kCompanyRegistrationNumber: 'kCompanyRegistrationNumber',
  kIsCardInfoAdded: 'kIsCardInfoAdded',
  kPromoCode: 'kPromoCode',
  kPromoCodeApplied: 'kPromoCodeApplied',
  kLanguageCode: 'kLanguageCode',
  kLastLanguageUpdatedTime: 'kLastLanguageUpdatedTime',
} as const;
