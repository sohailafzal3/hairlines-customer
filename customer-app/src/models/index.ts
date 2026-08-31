export interface Account {
  id: string;
  userAccountId: string;
  firstName: string;
  lastName: string;
  name: string;
  profileImage?: string;
  userType: number;
  isBlocked: boolean;
  email: string;
  isEmailUpdate: boolean;
  phoneCode: string;
  phoneNumber: string;
  resetPhoneNumberCode?: string;
  resetPhoneNumber?: string;
  avgRating: number;
  jobsDoneCount: number;
  accountType: string;
  referralCode: string;
  isVerifiedByAdmin: boolean;
  isSignUpCompleted: boolean;
  stepCompleted: number;
  isPhoneNumberRequired: boolean;
}

export interface User {
  languageCode: string;
  lastLanguageUpdatedTime: string;
  isLoggedIn: boolean;
  lastLocation?: { latitude: number; longitude: number };
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  deviceToken: string;
  id: string;
  userAccountId: string;
  firstName: string;
  lastName: string;
  name: string;
  profileImage?: string;
  userType: number;
  isBlocked: boolean;
  email: string;
  isEmailUpdate: boolean;
  phoneCode: string;
  phoneNumber: string;
  avgRating: number;
  accountType: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  referralCode: string;
  notificationBadge: number;
  selectedPromoCode?: PromoCode;
  filters?: Filter;
  orignalFilters?: Filter;
  termsDescription?: string;
  privacyDescription?: string;
  permanentAddress?: NewAddress;
}

export interface MyProfile {
  id: string;
  userAccountId: string;
  name: string;
  firstName: string;
  lastName: string;
  phonePreFix: string;
  phoneNumber: string;
  email: string;
  profileImage?: string;
  avgRating: number;
  ratingAndReview: Rating[];
  currency: string;
  companyName?: string;
  gender: string;
  dateOfBirth: string;
  isPhysicallyDisabled: string;
  residanceName?: string;
  instituteName?: string;
  residanceAddress: NewAddress;
}

export interface NewAddress {
  type: string;
  latitude: number;
  longitude: number;
  primaryAddress: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateJobData {
  primaryAddress?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  serviceId?: string;
  serviceName?: string;
  servicesName?: string;
  servicesDescription?: string;
  serviceImage?: string;
  serviceHourlyRate?: number;
  serviceTypeId?: string;
  serviceTypeName?: string;
  serviceTypeDescription?: string;
  serviceTypeImage?: string;
  subServiceTypeId?: string;
  memberId?: string;
  serviceFor?: string;
  bookingType?: string;
  weekDay?: string;
  timeZone?: string;
  isJobOfferedFor?: boolean;
  barberGender?: string;
  isFilterApplied?: boolean;
  minRating?: number;
  maxRating?: number;
  distance?: number;
  subServiceTypeRate?: number;
  subServiceId?: string;
  subServiceName?: string;
  worker?: SP;
  merchantId?: string;
  descriptionText?: string;
  jobDuration?: number;
  jobStartTime?: string;
  jobEndTime?: string;
  selectedSp?: SP;
  specialInstruction?: string;
  promoCode?: string;
  jobId?: string;
  atUserLocation?: boolean;
  atSpLocation?: boolean;
  stylePreferenceImage?: string;
  referenceImages?: string[];
  isOldJob?: boolean;
}

export interface SP {
  id: string;
  userId: string;
  name: string;
  profileImage?: string;
  avgRating: number;
  currency: string;
  latitude: number;
  longitude: number;
  distanceAway: string;
  spJobCompletedCount: number;
  serviceHourRate?: number;
  numberOfEmployees?: number;
  jobsDone: number;
  spPrimaryAddress: string;
  spCity: string;
  spState: string;
  spCountry: string;
  provideServiceInPremisis: boolean;
  provideServiceInUserPremisis: boolean;
  permanentAddressLat: number;
  permanentAddressLong: number;
}

export interface SPProfile {
  id: string;
  about: string;
  name: string;
  firstName: string;
  lastName: string;
  phonePreFix: string;
  phoneNumber: string;
  email: string;
  profileImage?: string;
  avgRating: number;
  ratingAndReview: Rating[];
  currency: string;
  companyName?: string;
  languages: SelectedLanguage[];
  services: Service[];
  jobCount: number;
  tools: string[];
  referenceImages: string[];
  gender: string;
}

export interface Rating {
  id: string;
  review: string;
  rating: number;
  createdAt: string;
  userName: string;
  userImage?: string;
}

export interface SelectedLanguage {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  serviceImage?: string;
  serviceDescription: string;
  serviceName: string;
  serviceHourlyRate?: number;
  subServices: SubService[];
  serviceTypeName?: string;
  serviceTypeDescription?: string;
  serviceTypeImage?: string;
}

export interface SubService {
  id: string;
  subServiceName: string;
  subServiceImage?: string;
  serviceDescription: string;
  serviceName: string;
  serviceId: string;
  serviceInfo: SubServiceInfo[];
}

export interface SubServiceInfo {
  id: string;
  description: string;
  duration: number;
  hasDuration: boolean;
  durationUnit: string;
  name: string;
  subServiceId: string;
}

export interface Job {
  id: string;
  userId: string;
  spJobStatus: number;
  jobStartTime: string;
  currency: string;
  primaryAddress: string;
  serviceName: string;
  serviceImage?: string;
  spProfileId: string;
  avgRating: number;
  name: string;
  serviceHourlyRate: number;
  JobIdIdentifier?: string;
  provideServiceInPremises: boolean;
  provideServiceInUserPremises: boolean;
  totalAmount: number;
  subServiceTypeRate: number;
  costBreakDown?: CostBreakDown;
}

export interface JobDetail {
  subServiceId: string;
  jobId: string;
  serviceName: string;
  serviceImage?: string;
  serviceId: string;
  subserviceTypeId: string;
  serviceDescription: string;
  specialInstruction?: string;
  workDescription?: string;
  expectedJobStartTime?: string;
  spProfileId: string;
  name: string;
  phoneNumber: string;
  profileImage?: string;
  avgRating: number;
  currency: string;
  spJobStatus: number;
  primaryAddress: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  city: string;
  state: string;
  country: string;
  destinationLat: number;
  destinationLong: number;
  workerLat?: number;
  workerLong?: number;
  isUserRatingScreenShown: boolean;
  isUserRated: boolean;
  costBreakDown?: CostBreakDown;
  totalAmount: number;
  messageCount: number;
  statusArray: StatusModel[];
  routeLocation: RouteLocation[];
  isJobStart: boolean;
  jobStartTime?: string;
  jobScheduleTime?: string;
  jobPauseStartTiming?: string;
  jobElapsedTime?: number;
  gratuities: number[];
  provideServiceInPremises: boolean;
  provideServiceInUserPremises: boolean;
  stylePreferenceImage?: string;
  referenceImages?: string[];
  spTwilioUserId?: string;
  serviceHourlyRate: number;
  subServiceTypeRate: number;
  bookingType?: string;
  memberId?: string;
  isJobConsultant: boolean;
  isJobOfferedFor: boolean;
}

export interface StatusModel {
  status: number;
  statusName: string;
  statusTime: string;
}

export interface RouteLocation {
  latitude: number;
  longitude: number;
}

export interface CostBreakDown {
  totalAmount: number;
  totalJobAmount: number;
  serviceCharges: number;
  totalLineItemAmount: number;
  discountAmount: number;
  referralDiscount: number;
  serviceName: string;
  currency: string;
  totalHoursSpent: number;
  totalMinutesSpent: number;
  serviceHourlyRate: number;
  lineItems: Item[];
  cenclationCharges?: number;
  gratuity?: number;
  walletAmount?: number;
}

export interface Item {
  id: string;
  itemName: string;
  itemQuantity: number;
  itemPrice: number;
  isSelected: boolean;
}

export interface Message {
  id: string;
  createdAt: string;
  isRead: boolean;
  title?: string;
  body: string;
  senderId: string;
  userId: string;
  formattedDate?: string;
  senderType: number;
  receiverType: number;
  updatedAt: string;
  createdAtString: string;
  jobId: string;
  threadId?: string;
  messageType?: string;
  senderName: string;
  senderImageUrl?: string;
}

export interface Messages {
  messages: Message[];
  badgeValue: number;
  totalParticipant: number;
  totalMessages: number;
}

export interface NotificationModel {
  notificationId: string;
  notificationType: string;
  jobId?: string;
  isRead: boolean;
  name?: string;
  message: string;
  timePassed: string;
  image?: string;
  shouldNavigate: boolean;
}

export interface StripeCustomer {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  userId: string;
  defaultSource?: string;
  cards: CreditCards[];
}

export interface CreditCards {
  cardId: string;
  brand: string;
  expMonth: number;
  expYear: number;
  lastFour: string;
  id: string;
  isDefaultCard: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  startDate: string;
  expiryDate: string;
  percentage: number;
  maxDiscount: number;
  promoType: string;
  name: string;
  totalCount: number;
  promoText: string;
  promoImage?: string;
  isAdded: boolean;
  canUse: boolean;
  applicantType: string;
  isPromoApplied: boolean;
  isExpired: boolean;
  promoCodeName: string;
}

export interface Member {
  id: string;
  memberFirstName: string;
  memberLastName: string;
  memberAge: number;
  memberRelation: string;
  memberHealth: string;
}

export interface MembersFound {
  membersFound: Member[];
}

export interface AddressList {
  addresses: NewAddress[];
}

export interface Filter {
  minAge?: number;
  maxAge?: number;
  distance?: number;
  communities?: string[];
}

export interface TermsCondition {
  isPrivacyPolicyUpdated: boolean;
  isTermAndConditionUpdated: boolean;
  privacyPolicyId: string;
  privacyPolicyDescription: string;
  privacyPolicyVersion: string;
  termAndConditionId: string;
  termAndConditionDescription: string;
  termAndConditionVersion: string;
}

export interface UserPushNotification {
  appTitle?: string;
  message: string;
  jobId?: string;
  type: string;
  latitude?: number;
  longitude?: number;
  bearing?: number;
  name?: string;
  avgRating?: number;
  profileImage?: string;
  spProfileId?: string;
  image?: string;
  spName?: string;
  gratuities?: number[];
  completeJobName?: string;
  completeJobAvgRating?: number;
  completeJobProfileImage?: string;
}

export interface SocketMessagePayload {
  body: string;
  jobId: string;
  senderUserType: string;
  receiverUserType: string;
  senderUserId: string;
}

export interface CountryCode {
  id: string;
  name: string;
  phoneCode: string;
  countryCode: string;
  flag?: string;
}
