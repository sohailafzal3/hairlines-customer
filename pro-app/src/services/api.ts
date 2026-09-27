import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { BASE_URL, API_TIMEOUT, UploadImageType } from "../constants";
import {
  loadCookies,
  saveCookiesFromResponse,
  removeCookies,
  cookieHeader,
} from "./cookies";
import { storage } from "../utils/storage";
import { StorageKeys, DEFAULT_LANGUAGE_CODE } from "../constants";
import {
  ApiResponse,
  Account,
  Job,
  JobDetail,
  Message,
  NotificationModel,
  WeeklyEarnings,
  WeekTransaction,
  Week,
  Mover,
  MyProfile,
  AvailabilitySlots,
  Document,
  Service,
  PastJob,
  Wallet,
  CancellationReason,
  TwilioCallData,
  Security,
  UnHandledJob,
} from "../types/models";

const authCookieEndpoints = [
  "sign-in/verify-verification-code",
  "sign-up/verify-verification-code",
  "sp/basic-info",
  "sign-in",
];

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const lang =
        (await storage.get<string>(StorageKeys.languageCode)) ??
        DEFAULT_LANGUAGE_CODE;
      const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
      config.baseURL = `${base}${lang}`;
      const cookies = await loadCookies();
      if (cookies.length > 0) {
        config.headers = config.headers ?? {};
        config.headers.Cookie = cookieHeader(cookies);
      }
      return config;
    });

    this.client.interceptors.response.use(
      async (response: AxiosResponse<ApiResponse>) => {
        const endpoint = response.config.url ?? "";
        if (authCookieEndpoints.some((e) => endpoint.includes(e))) {
          const setCookie = response.headers["set-cookie"];
          if (setCookie) await saveCookiesFromResponse(setCookie);
        }
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            return Promise.reject(
              new Error("Request timed out. Please try again.")
            );
          }
          if (!error.response) {
            return Promise.reject(
              new Error("No network connection. Please try again.")
            );
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    const body = response.data;
    if (body.success) {
      return (body.data ?? (true as unknown as T)) as T;
    }
    throw new Error(body.message || body.error || "Request failed");
  }

  // MARK: Auth
  signIn(phoneNumber: string, password: string, countryCode: string) {
    return this.request<Account>("POST", "sign-in", {
      phoneNumber,
      password,
      countryCode,
      userType: 2,
    });
  }

  sendVerificationCode(phoneNumber: string, countryCode: string) {
    return this.request<any>("POST", "sign-up/send-verification-code", {
      phoneNumber,
      countryCode,
      userType: 2,
    });
  }

  verifyCode(
    phoneNumber: string,
    countryCode: string,
    code: string,
    isSignUp: boolean
  ) {
    const url = isSignUp
      ? "sign-up/verify-verification-code"
      : "sign-in/verify-verification-code";
    return this.request<Account>("POST", url, {
      phoneNumber,
      countryCode,
      code,
      userType: 2,
    });
  }

  forgotPassword(phoneNumber: string) {
    return this.request<any>("POST", "forgot-password", { phoneNumber });
  }

  changePassword(password: string, newPassword: string) {
    return this.request<any>("POST", "sp/change-password", {
      password,
      newPassword,
    });
  }

  signUpGuest() {
    return this.request<Account>("POST", "sign-up/guest", { userType: 2 });
  }

  appleSignup(payload: any) {
    return this.request<Account>("POST", "auth/apple", payload);
  }

  facebookSignup(payload: any) {
    return this.request<Account>("POST", "auth/facebook", payload);
  }

  addPhoneNumberUsingFB(payload: any) {
    return this.request<any>("POST", "add-phoneNumber", payload);
  }

  logOut() {
    return this.request<any>("GET", "logout");
  }

  deleteAccount() {
    return this.request<any>("GET", "delete-account");
  }

  // MARK: Onboarding / Profile
  addBasicInfo(payload: any) {
    return this.request<Account>("POST", "sp/basic-info", payload);
  }

  updateBasicInfo(payload: any) {
    return this.request<Account>("POST", "sp/update-profile", payload);
  }

  getSPProfile() {
    return this.request<MyProfile>("GET", "sp/fetch-profile");
  }

  // MARK: Services
  getAllServices() {
    return this.request<{ services: Service[] }>("GET", "sp/all-services");
  }

  getServicesList() {
    return this.request<{ services: Service[] }>("GET", "sp/services/list");
  }

  getSPServices() {
    return this.request<{ services: Service[] }>("GET", "sp/services");
  }

  getCompanySelectedServices() {
    return this.request<{ services: Service[] }>(
      "GET",
      "sp/company/selected/services"
    );
  }

  getSubServicesAndPlans(serviceId: string) {
    return this.request<{ subServices: Service[] }>(
      "GET",
      `sp/selected/sub-services/${serviceId}`
    );
  }

  getSubServicesByServiceId(serviceId: string) {
    return this.request<{ subServices: Service[] }>(
      "GET",
      `sp/sub-services/service/${serviceId}/list`
    );
  }

  selectServices(payload: any) {
    return this.request<any>("POST", "sp/select-services", payload);
  }

  selectServiceFor(payload: any) {
    return this.request<any>("POST", "sp/select-services-for", payload);
  }

  addSubServices(jobId: string, serviceId: string, subServices: any[]) {
    return this.request<any>("POST", "sp/job/select-consultation-services", {
      jobId,
      serviceId,
      subServices,
    });
  }

  fetchAllServices() {
    return this.request<{ services: Service[] }>(
      "GET",
      "sp/job/fetch-all-services"
    );
  }

  updateServicePreference(payload: any) {
    return this.request<any>("POST", "sp/update-service-preference", payload);
  }

  // MARK: Documents
  getAllDocumentTypes() {
    return this.request<{ documents: Document[] }>("GET", "identity-doc");
  }

  addIdentityDocument(payload: any) {
    return this.request<any>("POST", "sp/select-identity-doc", payload);
  }

  // MARK: Languages
  getActiveLanguages() {
    return this.request<{ languageList: Document[] }>("GET", "active-languages");
  }

  getLanguageLevels() {
    return this.request<{ languageLevelList: Document[] }>(
      "GET",
      "language-level"
    );
  }

  // MARK: Bank / Security
  addBankInfo(bankToken: string, ssnLast4: string) {
    return this.request<any>("POST", "bank/account", {
      bankToken,
      ssnLast4,
    });
  }

  getBankDetails() {
    return this.request<any>("GET", "bank/account");
  }

  getCheckrData() {
    return this.request<Security>("GET", "sp/checkr/validation/check");
  }

  postCheckerData(payload: any) {
    return this.request<any>("POST", "sp/checkr/validation", payload);
  }

  // MARK: Availability
  getAvailabilitySlots() {
    return this.request<AvailabilitySlots>("GET", "sp/fetch-availability");
  }

  addAvailability(payload: any) {
    return this.request<any>("POST", "sp/set-availability", payload);
  }

  updateAvailability(payload: any) {
    return this.request<any>("PUT", "sp/update-availability", payload);
  }

  // MARK: Status
  getSPStatus() {
    return this.request<{ isSpOnline: boolean }>("GET", "sp/status");
  }

  updateStatus(status: number) {
    return this.request<any>("GET", `sp/update-status?spStatus=${status}`);
  }

  // MARK: Jobs
  getUnhandledJob() {
    return this.request<UnHandledJob>("GET", "sp/job/unhandled-job");
  }

  getJobs(listType: number, offset = 0, limit = 10) {
    return this.request<{ jobList: Job[] }>(
      "GET",
      `sp/job/listing?listType=${listType}&offset=${offset}&limit=${limit}`
    );
  }

  getJobDetail(jobId: string) {
    return this.request<JobDetail>("GET", `sp/job/${jobId}/detail`);
  }

  getPastJobs(offset = 0, limit = 10) {
    return this.request<{ spJobsFound: PastJob[] }>(
      "GET",
      `sp/job/listing?listType=2&offset=${offset}&limit=${limit}`
    );
  }

  giveJobOffer(jobId: string, status: number) {
    return this.request<any>("PUT", "sp/job/update-offer", {
      jobId,
      spJobStatus: status,
    });
  }

  updateJobStatus(jobId: string, status: number) {
    return this.request<any>("PUT", "sp/job/update-status", {
      jobId,
      spJobStatus: status,
    });
  }

  pauseStartJob(jobId: string) {
    return this.request<any>("GET", `sp/job/${jobId}/pause-start`);
  }

  completeJob(jobId: string) {
    return this.request<any>("GET", `sp/job/${jobId}/complete-job`);
  }

  addServiceItem(jobId: string, payload: any) {
    return this.request<any>("POST", "sp/job/add-another-service", {
      jobId,
      ...payload,
    });
  }

  addLineItem(jobId: string, item: any) {
    return this.request<any>("PUT", "sp/job/add-line-item", { jobId, ...item });
  }

  editLineItem(jobId: string, item: any) {
    return this.request<any>("PUT", "sp/job/edit-line-item", {
      jobId,
      ...item,
    });
  }

  deleteLineItem(jobId: string, lineItemId: string) {
    return this.request<any>("PUT", "sp/job/delete-line-item", {
      jobId,
      lineItemId,
    });
  }

  rateUser(jobId: string, userProfileId: string, rating: number, review = "") {
    return this.request<any>("PUT", "sp/job/rate-user", {
      jobId,
      userProfileId,
      rating,
      review,
    });
  }

  getUnratedJob() {
    return this.request<any>("GET", "last-unrated-job?userType=sp");
  }

  // MARK: Cancellation
  fetchCancellationReasons() {
    return this.request<{ reasonList: CancellationReason[] }>(
      "GET",
      "cancellation-reasons?userType=2"
    );
  }

  cancelJob(jobId: string, reasonId: string, otherReason?: string) {
    return this.request<any>("PUT", "sp/job/cancel", {
      jobId,
      reasonId,
      otherReason,
    });
  }

  // MARK: Notifications
  fetchNotifications(offset = 0, limit = 10) {
    return this.request<{ notificationData: NotificationModel[] }>(
      "GET",
      `sp-notification?limit=${limit}&offset=${offset}`
    );
  }

  actionOnNotification(type: string) {
    return this.request<any>("POST", "action-notifications", { type });
  }

  getBadgeCount() {
    return this.request<{ notificationCount: number }>(
      "GET",
      "notification-count?userType=sp"
    );
  }

  // MARK: Earnings / Wallet
  getEarnings(weekNumber: string, weekYear: string) {
    return this.request<WeeklyEarnings>(
      "GET",
      `sp/job/weekly-earning?weekNumber=${weekNumber}&weekYear=${weekYear}`
    );
  }

  getWeeklyTransactions(weekNumber: string, weekYear: string) {
    return this.request<{ spJobsFound: WeekTransaction[] }>(
      "GET",
      `sp/job/weekly-earning-detail?weekNumber=${weekNumber}&weekYear=${weekYear}`
    );
  }

  getUserWeeklyTransactions(spProfileId: string, weekNumber: string, weekYear: string) {
    return this.request<{ spJobsFound: WeekTransaction[] }>(
      "GET",
      `sp/job/weekly-earning-detail?weekNumber=${weekNumber}&weekYear=${weekYear}&spProfileId=${spProfileId}`
    );
  }

  getWeekList(year: string) {
    return this.request<{ weekList: Week[] }>("GET", `sp/job/week-list?year=${year}`);
  }

  getUserWallet() {
    return this.request<Wallet>("GET", "sp/fetch-wallet");
  }

  // MARK: Chat
  getPreviousChat(packageId: string, offset = 0, limit = 10, spId?: string) {
    let url = `chatting/thread/${packageId}?offset=${offset}&limit=${limit}`;
    if (spId) url += `&spProfileId=${spId}`;
    return this.request<{ messages: Message[] }>("GET", url);
  }

  // MARK: Twilio
  twilioFetchCallData(sid: string) {
    return this.request<TwilioCallData>(
      "GET",
      `twilio/fetch-call-data?sid=${sid}`
    );
  }

  // MARK: Workers
  getMerchantMovers() {
    return this.request<{ movers: Mover[]; totalMovers: number }>(
      "GET",
      "sp/company/worker"
    );
  }

  getMerchantMoversWithType(weekNumber: string, year: string, type: string) {
    return this.request<{ movers: Mover[]; totalMovers: number }>(
      "GET",
      `sp/company/worker?weekNumber=${weekNumber}&year=${year}&type=${type}`
    );
  }

  getMoverDetail(moverId: string) {
    return this.request<Mover>("GET", `merchant/mover/${moverId}`);
  }

  getMerchantServices() {
    return this.request<{ services: Service[] }>("GET", "merchant/services");
  }

  getCompanyMoverServices(moverId: string) {
    return this.request<{ services: Service[] }>(
      "GET",
      `merchant/mover/${moverId}/services`
    );
  }

  updateCompanyMoverServices(moverId: string, payload: any) {
    return this.request<any>(
      "POST",
      `merchant/mover/${moverId}/services/update`,
      payload
    );
  }

  sendInviteToMover(payload: any) {
    return this.request<any>("PUT", "user/invite/worker", payload);
  }

  // MARK: Tools / Contact
  fetchTools() {
    return this.request<{ tools: string[] }>("GET", "sp/tools-equipment");
  }

  updateTools(tools: string[]) {
    return this.request<any>("POST", "sp/tools-equipment", { tools });
  }

  getContactInfo() {
    return this.request<any>("GET", "user/fetch-contact-info");
  }

  // MARK: Upload
  async uploadImage(imageUri: string, type: UploadImageType): Promise<string> {
    let url = "upload/profile-image";
    if (type === UploadImageType.identityDocumentsImages) {
      url = "sp/upload-identity-images";
    } else if (type === UploadImageType.generalImages) {
      url = "upload/general/image";
    } else if (type === UploadImageType.certificates) {
      url = "sp/upload-license-images";
    }

    const form = new FormData();
    const filename = imageUri.split("/").pop() ?? "file.jpg";
    form.append("image", {
      uri: imageUri,
      name: filename,
      type: "image/jpeg",
    } as any);

    const response = await this.client.post<ApiResponse<{ url: string }>>(
      url,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    const body = response.data;
    if (body.success) {
      return (body.data as any)?.url ?? "";
    }
    throw new Error(body.message || "Upload failed");
  }

  async clearSession() {
    await removeCookies();
    await storage.remove(StorageKeys.isUserLoggedIn);
    await storage.remove(StorageKeys.isSPLoggedIn);
    await storage.remove(StorageKeys.userData);
  }
}

export const api = new ApiClient();
