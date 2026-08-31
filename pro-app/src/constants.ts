/**
 * Hairlines Pro — React Native
 * Global constants migrated from the legacy Swift Constants.swift.
 * NOTE: Secrets below are carried over from the original codebase and should
 * eventually be moved to environment variables / build config.
 */

export const APP_NAME = "HareCut Professional";

// MARK: URLs
export const SOCKET_URL = "https://api.hairlines.app";
export const BASE_URL = "https://api.hairlines.app/api/v1/";
export const TWILIO_BASE_URL = "http://3.132.196.32:6002";
export const TERMS_URL = "https://hairlinesondemand.com/terms-conditions/";
export const PRIVACY_URL = "https://hairlinesondemand.com/privacy-policy/";
export const IOS_APP_URL = "https://itunes.apple.com/us/app/id1563168556";
export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=apps.hairlines.pro.worker";

// MARK: Third-party keys
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 
export const STRIPE_PUBLISHABLE_KEY =process.env.STRIPE_PUBLISHABLE_KEY

// MARK: S3
export const S3_PREFIX = "https://hairlines-lives2.s3.us-east-1.amazonaws.com/";
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

// MARK: Defaults
export const DEFAULT_LANGUAGE_CODE = "en/";
export const PAGE_LIMIT = 10;
export const API_TIMEOUT = 40000;

// MARK: Storage keys
export const StorageKeys = {
  isUserLoggedIn: "kIsUserLoggedIn",
  isGuestUserLoggedIn: "kIsGuestUserLoggedIn",
  isSPLoggedIn: "kIsSPLoggedIn",
  removeCookies: "kRemoveCookies",
  deviceToken: "kDeviceToken",
  userId: "kUserId",
  languageCode: "kLanguageCode",
  accountType: "kAccountType",
  companyName: "kCompanyName",
  companyRegistrationNumber: "kCompanyRegistrationNumber",
  referralCode: "kReferalCode",
  isCompanyWorker: "kIsCompanyWorker",
  savedCookies: "savedCookies",
  socketKey: "socket",
  userData: "kUserData",
  onboardingStep: "kOnboardingStep",
} as const;

// MARK: Enums
export enum UploadImageType {
  profileImage = "profileImage",
  generalImages = "GeneralImages",
  identityDocumentsImages = "identityDocumentsImages",
  certificates = "certificates",
}

export enum EarningTimeInterval {
  weekly = 0,
  monthly = 1,
  yearly = 2,
}

export enum MessageType {
  error = 0,
  success = 1,
  info = 2,
}

export enum Gender {
  male = "male",
  female = "female",
}

export enum JobStatus {
  open = 0,
  accepted = 1,
  onTheWay = 2,
  arrived = 3,
  started = 4,
  completed = 5,
  finished = 6,
  rejected = 7,
  cancelled = 8,
}

export const JobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.open]: "Open",
  [JobStatus.accepted]: "Accepted",
  [JobStatus.onTheWay]: "On The Way",
  [JobStatus.arrived]: "Arrived",
  [JobStatus.started]: "Started",
  [JobStatus.completed]: "Completed",
  [JobStatus.finished]: "Finished",
  [JobStatus.rejected]: "Rejected",
  [JobStatus.cancelled]: "Cancelled",
};

export enum SenderType {
  user = 1,
  sp = 2,
}

export enum NotificationType {
  userSendOffer = "userSendOffer",
  userCancelJob = "userCancelJob",
  newMessage = "messageSendingToReceiverKey",
  generalNotifications = "generalNotifications",
  messageSendingKey = "messageSendingKey",
  customNotification = "customNotification",
  adminApproval = "adminApprovedAccount",
  unregisterFromTwilio = "unregisterFromTwilio",
  adminRejectedAccount = "adminRejectedAccount",
  jobTimeOut = "jobTimeOut",
  notificationFromAdmin = "notificationFromAdmin",
  documentExpiryNotification = "expiryNotification",
}

export enum SignType {
  Freelancer = 3,
  Company = 2,
}

// MARK: Socket events
export const SocketEvents = {
  locationUpdate: "locationUpdate",
  markAsRead: "markAsRead",
  messageDelivered: "messageDeliveredKey",
  readNotification: "readNotification",
  startRideTracking: "startRideTracking",
  stopRideTracking: "stopRideTracking",
  ratingReminderReceived: "ratingReminderReceived",
} as const;

// MARK: Errors
export const APIErrorDomain = "com.hairlines.webserviceerror";
export enum APIErrorCode {
  general = 30001,
  noNetwork = 30002,
  timeOut = 30003,
}
