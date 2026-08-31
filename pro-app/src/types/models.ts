/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ApiResponse<T = any> {
  response?: number;
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorDescription?: string;
}

export interface Address {
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Account {
  userAccountId?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profileImage?: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  avgRating?: number;
  accountType?: number;
  companyName?: string;
  isCompany?: boolean;
  referralCode?: string;
  isBlocked?: boolean;
  isVerifiedByAdmin?: boolean;
  isSignUpCompleted?: boolean;
  stepCompleted?: number;
  isCompanyWorker?: boolean;
  services?: Service[];
  jobCount?: number;
  distance?: number;
  status?: number;
  spEarnings?: number;
  spId?: string;
  address?: Address;
  provideServiceInPremisis?: boolean;
  provideServiceInUserPremisis?: boolean;
  tools?: string[];
  isPhoneNumberRequired?: boolean;
  serviceFor?: number;
}

export interface SignInResponse {
  token?: string;
  isEmailVerified?: boolean;
  isEmailUpdate?: boolean;
  signUpStepCompleted?: number;
  isSignupCompleted?: boolean;
  userData?: Account;
  code?: string;
  imageUrl?: string;
}

export interface Wallet {
  walletAmount?: number;
}

export interface UserState {
  languageCode: string;
  isLoggedIn: boolean;
  deviceToken: string;
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  profileImage: string;
  userType: string;
  isBlocked: boolean;
  email: string;
  isEmailUpdate: boolean;
  phoneCode: string;
  phoneNumber: string;
  country: string;
  countryCode: string;
  avgRating: number;
  accountType: number;
  companyName: string;
  companyRegistrationNumber: string;
  referralCode: string;
  notificationBadge: number;
  isCompanyWorker: boolean;
  termsDescription: string;
  privacyDescription: string;
  permanentAddress: string;
  postalCode: string;
  city: string;
  state: string;
  lat: number;
  long: number;
  provideServicesinPremisis: boolean;
  provideServicesinUserPrimisis: boolean;
  tools: string[];
  serviceFor: number;
  isApproved: boolean;
  signUpStepCompleted: number;
  isSignUpCompleted: boolean;
}

export interface Job {
  id: string;
  spJobStatus: number;
  userAccountId?: string;
  userProfileId?: string;
  userName?: string;
  userProfileImage?: string;
  userAvgRating?: number;
  primaryAddress?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  serviceName?: string;
  serviceImage?: string;
  schdeuleTime?: number;
  jobDuration?: number;
  latitude?: number;
  longitude?: number;
  distanceAway?: number;
  distanceUnit?: string;
  serviceHourlyRate?: number;
  provideServiceInPremises?: boolean;
  totalJobDuration?: number;
  services?: ServiceList[];
}

export interface ServiceList {
  serviceName?: string;
  subServices?: SubService[];
}

export interface SubService {
  subServiceName?: string;
}

export interface PastJob {
  id?: string;
  spEarnedAmount?: number;
  jobEndTime?: number;
  serviceName?: string;
  userName?: string;
  userProfileImage?: string;
  currency?: string;
}

export interface UnHandledJob {
  isUnhandledJobExist: boolean;
  jobId?: string;
  address?: string;
  userAvgRating?: number;
  scheduleTime?: number;
}

export interface JobDetail {
  jobId?: string;
  spJobStatus?: number;
  serviceName?: string;
  serviceImage?: string;
  serviceDescription?: string;
  specialInstruction?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  workDescription?: string;
  userProfileId?: string;
  userName?: string;
  userPhoneNumber?: string;
  userProfileImage?: string;
  userAvgRating?: number;
  jobScheduleTime?: number;
  jobStartTime?: number;
  jobElapsedTime?: number;
  isJobStart?: boolean;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropOffLatitude?: number;
  dropOffLongitude?: number;
  jobPauseStartTiming?: number;
  costBreakDown?: CostBreakDown;
  totalAmount?: number;
  jobHourlyRate?: number;
  jobDuration?: number;
  messageCount?: number;
  stylePreferenceImage?: string;
  facilities?: string[];
  userTwilioUserId?: string;
  routeLocation?: RouteLocation[];
  provideServiceInPremises?: boolean;
  provideServiceInUserPremises?: boolean;
  isSelf?: boolean;
  memberName?: string;
  memberAge?: string;
  memberRelation?: string;
  memberHealth?: string;
  isJobConsultant?: boolean;
  isConsultantServiceSelected?: boolean;
  totalMilage?: number;
}

export interface CostBreakDown {
  totalAmount?: number;
  totalJobAmount?: number;
  serviceCharges?: number;
  totalLineItemAmount?: number;
  discountAmount?: number;
  serviceName?: ServicesList[];
  currency?: string;
  totalHoursSpent?: string;
  totalMinutesSpent?: string;
  lineItems?: LineItem[];
  serviceHourlyRate?: number;
  gratuity?: number;
  checkrAmount?: number;
  commission?: number;
}

export interface LineItem {
  id?: string;
  itemName?: string;
  itemQuantity?: number;
  itemPrice?: number;
  isSelected?: boolean;
}

export interface ServicesList {
  subServiceId?: SubServiceId;
  subServiceCharges?: number;
}

export interface SubServiceId {
  id?: string;
  status?: string;
  subServiceImage?: string;
  isArchive?: boolean;
  subServiceCommision?: number;
  subServiceCharges?: number;
  subServiceDescription?: string;
  subServiceEstimatedJobTime?: string;
  subServiceName?: string;
  serviceId?: ServiceId;
}

export interface ServiceId {
  id?: string;
  serviceName?: string;
}

export interface RouteLocation {
  latitude?: number;
  longitude?: number;
}

export interface Service {
  _id?: string;
  serviceImage?: string;
  serviceDescription?: string;
  serviceName?: string;
  isSelected?: boolean;
  subServiceDetails?: SubServiceDetail[];
  hourlyRate?: number;
  tempHourltRate?: number;
  isAlreadySelected?: boolean;
  selectedCount?: number;
  isCompany?: boolean;
}

export interface SubServiceDetail {
  _id?: string;
  subServiceImage?: string;
  subServiceDescription?: string;
  subServiceName?: string;
  isSelected?: boolean;
  hourlyRate?: number;
  serviceId?: string;
  subServiceCharges?: number;
  plans?: SubServicePlan[];
}

export interface SubServicePlan {
  _id?: string;
  description?: string;
  duration?: number;
  hasDuration?: boolean;
  durationUnit?: string;
  name?: string;
  subServiceId?: string;
  isSelected?: boolean;
  planRate?: number;
}

export interface Document {
  id?: string;
  name?: string;
  isSelected?: boolean;
  subLabel?: string;
  profId?: string;
  profName?: string;
}

export interface SPStatus {
  isSpOnline?: boolean;
  id?: string;
}

export interface Message {
  id?: string;
  jobId?: string;
  createdAt?: number;
  isRead?: boolean;
  title?: string;
  body?: string;
  senderId?: string;
  userId?: string;
  formattedDate?: number;
  senderType?: number;
  receiverType?: number;
  createdAtString?: string;
  updatedAt?: string;
  threadId?: string;
  messageType?: string;
  senderName?: string;
  senderImageUrl?: string;
  profileImage?: string;
  unReadCount?: number;
}

export interface NotificationModel {
  notificationId?: string;
  notificationType?: number;
  jobId?: string;
  isRead?: boolean;
  name?: string;
  message?: string;
  timePassed?: string;
  image?: string;
  shouldNavigate?: boolean;
}

export interface UnRatedJob {
  jobId?: string;
  userProfileId?: string;
  name?: string;
  avgRating?: number;
  profileImage?: string;
}

export interface WeeklyEarnings {
  id?: string;
  weekDayEarnings?: WeekDayEarning[];
  totalSpEarning?: number;
  currency?: string;
  totalJobCount?: number;
  weekTitle?: string;
  refferalEarning?: number;
  gratuity?: number;
}

export interface WeekDayEarning {
  day?: number;
  spEarning?: number;
}

export interface Week {
  title?: string;
  weekNumber?: string;
  weekYear?: string;
}

export interface WeekTransaction {
  spEarnings?: number;
  packageId?: number;
  endTime?: number;
  currency?: string;
  distanceUnit?: string;
  estimatedDistance?: number;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface Mover {
  id?: string;
  name?: string;
  jobsDone?: number;
  avgRating?: number;
  profileImage?: string;
  distance?: string;
  amountEarned?: number;
}

export interface MoverDetail {
  id?: string;
  name?: string;
  bio?: string;
  profileImage?: string;
  avgRating?: number;
  jobsDone?: number;
  services?: Service[];
}

export interface MyProfile {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phonePreFix?: string;
  phoneNumber?: string;
  email?: string;
  profileImage?: string;
  avgRating?: number;
  ratingAndReview?: Rating[];
  currency?: string;
  companyName?: string;
  gender?: string;
  dateOfBirth?: number;
  userLat?: number;
  userLong?: number;
  userPrimaryAddress?: string;
  userCity?: string;
  userState?: string;
  userCountry?: string;
  postalCode?: string;
  provideServiceInPremisis?: boolean;
  provideServiceInUserPremisis?: boolean;
  bio?: string;
  referenceImages?: string[];
  isVerifiedByAdmin?: boolean;
  referralCode?: string;
  isBlocked?: boolean;
  tools?: string[];
  serviceFor?: number;
}

export interface Rating {
  id?: string;
  rating?: number;
  review?: string;
  name?: string;
  profileImage?: string;
  avgRating?: number;
}

export interface AvailabilitySlots {
  id?: string;
  openingHour?: number;
  openingMinute?: number;
  closingHour?: number;
  closingMinute?: number;
  openingUnixTime?: number;
  closingUnixTime?: number;
  isEnabled?: boolean;
  days?: number[];
  slots?: Slot[];
}

export interface Slot {
  id?: string;
  openingHour?: number;
  openingMinute?: number;
  closingHour?: number;
  closingMinute?: number;
  openingUnixTime?: number;
  closingUnixTime?: number;
  isEnabled?: boolean;
  days?: number[];
  isEditting?: boolean;
}

export interface SPDocumentsAndPersonalDetails {
  userProfileId?: string;
  identityDocId?: string;
  identityDocName?: string;
  identityFront?: string;
  identityBack?: string;
  userType?: number;
  professionalLicenseDocuments?: ProfessionalCertificate[];
  accountHolderName?: string;
  bankIbnNumber?: string;
  languages?: SelectedLanguage[];
}

export interface ProfessionalCertificate {
  documentsId?: string;
  professionalDocsTitle?: string;
  professionalDocsFront?: string;
  professionalDocsBack?: string;
  professionalDocsType?: string;
  expiryDate?: string;
}

export interface SelectedLanguage {
  id?: string;
  languageId?: string;
  proficiencyId?: string;
  languageName?: string;
  proficiencyLevel?: string;
}

export interface CancellationReason {
  id?: string;
  reason?: string;
  isSelected?: boolean;
}

export interface Security {
  checkrInvitationLinkSent?: boolean;
  email?: string;
  checkrVerified?: boolean;
  checkrCharges?: number;
  isAdminVerified?: boolean;
  isBankAccountAdded?: boolean;
}

export interface TwilioCallData {
  callerName?: string;
  callerProfileImage?: string;
}

export interface PushNotificationPayload {
  resource?: Record<string, any>;
  notificationType?: string;
  jobId?: string;
  message?: string;
  title?: string;
}
