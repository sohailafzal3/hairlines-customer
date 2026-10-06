import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Platform } from "react-native";
import { BASE_URL, API_TIMEOUT, UploadImageType } from "../constants";
import {
  loadCookies,
  saveCookiesFromResponse,
  setCookieDirect,
  removeCookies,
  cookieHeader,
} from "./cookies";
import { storage } from "../utils/storage";
import { StorageKeys, DEFAULT_LANGUAGE_CODE, DUMMY_DEVICE_TOKEN } from "../constants";
import { getDeviceToken } from "./notifications";

async function captureSessionIdFromData(data: any): Promise<void> {
  if (!data || typeof data !== "object") return;
  const sessionIdFields = [
    "sessionId",
    "sessionID",
    "session_id",
    "sid",
    "token",
    "connect.sid",
  ];
  for (const field of sessionIdFields) {
    const value = data[field];
    if (value && typeof value === "string") {
      await setCookieDirect("connect.sid", value);
      await setCookieDirect("sessionId", value);
      return;
    }
  }
}
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
  TermsCondition,
} from "../types/models";

class ApiClient {
  private client: AxiosInstance;
  private authToken: string = "";

  setAuthToken(token: string) {
    this.authToken = token;
    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      this.client.defaults.headers.common["x-access-token"] = token;
      this.client.defaults.headers.common["token"] = token;
      setCookieDirect("connect.sid", token).catch(() => {});
      setCookieDirect("sessionId", token).catch(() => {});
      setCookieDirect("token", token).catch(() => {});
    } else {
      delete this.client.defaults.headers.common["Authorization"];
      delete this.client.defaults.headers.common["x-access-token"];
      delete this.client.defaults.headers.common["token"];
    }
  }

  getAuthToken(): string {
    return this.authToken;
  }

  constructor() {
    this.client = axios.create({
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(async (config) => {
      const lang =
        (await storage.get<string>(StorageKeys.languageCode)) ??
        DEFAULT_LANGUAGE_CODE;
      const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
      config.baseURL = `${base}${lang}`;
      config.headers = config.headers ?? {};

      // 1. Load and attach cookies
      const cookies = await loadCookies();
      let headerCookie = cookieHeader(cookies);

      // 2. Token auth headers (in-memory or stored user)
      let token = this.authToken;
      if (!token) {
        try {
          const user = await storage.get<any>(StorageKeys.userData);
          token =
            user?.token ||
            user?.sessionId;
          if (token) {
            this.authToken = token;
          }
        } catch {
          // Ignore storage read error
        }
      }

      if (token) {
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers["x-access-token"] = token;
        config.headers["token"] = token;
        try {
          const user = await storage.get<any>(StorageKeys.userData);
          config.headers["user-id"] =
            user?.id || user?._id || user?.userAccountId || "";
        } catch {
          // Ignore
        }

        // Ensure token cookies are present in Cookie header
        if (!headerCookie) {
          headerCookie = `connect.sid=${token}; sessionId=${token}; token=${token}`;
        } else {
          if (!headerCookie.includes("connect.sid=")) {
            headerCookie += `; connect.sid=${token}`;
          }
          if (!headerCookie.includes("sessionId=")) {
            headerCookie += `; sessionId=${token}`;
          }
          if (!headerCookie.includes("token=")) {
            headerCookie += `; token=${token}`;
          }
        }
      }

      if (headerCookie) {
        config.headers.Cookie = headerCookie;
      }

      return config;
    });

    this.client.interceptors.response.use(
      async (response: AxiosResponse<ApiResponse>) => {
        // 1. Capture cookies from all responses
        const setCookie =
          response.headers["set-cookie"] ||
          response.headers["Set-Cookie"] ||
          (response.headers as any)?.get?.("set-cookie");
        if (setCookie) {
          await saveCookiesFromResponse(setCookie);
        }

        // 2. Capture session ID / auth token from response payload if present
        const body = response.data;
        if (body) {
          const rawBody = body as any;
          await captureSessionIdFromData(body);
          if (body.data) {
            await captureSessionIdFromData(body.data);
          }
          const token =
            rawBody.token ||
            rawBody.data?.token ||
            rawBody.data?.userData?.token ||
            rawBody.userData?.token ||
            rawBody.sessionId ||
            rawBody.data?.sessionId;
          if (token && typeof token === "string") {
            this.setAuthToken(token);
            await setCookieDirect("connect.sid", token);
            await setCookieDirect("sessionId", token);
            await setCookieDirect("token", token);
          }
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
    const rawBody = body as any;
    if (body.success) {
      if (rawBody.token && rawBody.data && typeof rawBody.data === "object" && !rawBody.data.token) {
        rawBody.data.token = rawBody.token;
      }
      return (body.data ?? (true as unknown as T)) as T;
    }
    throw new Error(body.message || body.error || "Request failed");
  }

  // MARK: Auth
  async signIn(phoneNumber: string, password: string, countryCode: string) {
    const deviceToken = await getDeviceToken();
    const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    const res: any = await this.request<any>("POST", "sign-in", {
      phoneNumber,
      password,
      countryCode,
      userType: 2,
      deviceToken,
      deviceType,
    });
    const token =
      res?.token ||
      res?.userData?.token ||
      res?.account?.token ||
      res?.data?.token;
    if (token) {
      this.setAuthToken(token);
    }
    return res as Account;
  }

  sendVerificationCode(phoneNumber: string, countryCode: string) {
    return this.request<any>("POST", "sign-up/send-verification-code", {
      phoneNumber,
      countryCode,
      userType: 2,
    });
  }

  async verifyCode(
    phoneNumber: string,
    countryCode: string,
    code: string,
    isSignUp: boolean
  ) {
    const deviceToken = await getDeviceToken();
    const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    const url = isSignUp
      ? "sign-up/verify-verification-code"
      : "sign-in/verify-verification-code";
    const res: any = await this.request<any>("POST", url, {
      phoneNumber,
      countryCode,
      code,
      userType: 2,
      deviceToken,
      deviceType,
    });
    const token =
      res?.token ||
      res?.userData?.token ||
      res?.account?.token ||
      res?.data?.token;
    if (token) {
      this.setAuthToken(token);
    }
    return res as Account;
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

  async signUpGuest() {
    const deviceToken = await getDeviceToken();
    const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    return this.request<Account>("POST", "sign-up/guest", {
      userType: 2,
      deviceToken,
      deviceType,
    });
  }

  async appleSignup(payload: any) {
    const deviceToken = await getDeviceToken();
    const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    return this.request<Account>("POST", "auth/apple", {
      ...payload,
      deviceToken,
      deviceType,
      userType: 2,
    });
  }

  async facebookSignup(payload: any) {
    const deviceToken = await getDeviceToken();
    const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    return this.request<Account>("POST", "auth/facebook", {
      ...payload,
      deviceToken,
      deviceType,
      userType: 2,
    });
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
  async addBasicInfo(payload: any) {
    const deviceToken = await getDeviceToken();
    const deviceType =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    const savedUser = await storage.get<any>(StorageKeys.userData);
    const countryCode =
      payload?.countryCode || savedUser?.countryCode || savedUser?.phoneCode || "+1";
    const phoneNumber =
      payload?.phoneNumber || savedUser?.phoneNumber || "";
    const profileImageUrl =
      payload?.profileImageUrl || payload?.profileImage || savedUser?.profileImage || "";

    const finalPayload = {
      countryCode,
      phoneNumber,
      userType: 2,
      deviceToken,
      deviceType,
      profileImageUrl,
      ...payload,
      ...(profileImageUrl ? { profileImageUrl } : {}),
    };
    return this.request<Account>("POST", "sp/basic-info", finalPayload);
  }

  async updateBasicInfo(payload: any) {
    const deviceToken = await getDeviceToken();
    const deviceType =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    const savedUser = await storage.get<any>(StorageKeys.userData);
    const countryCode =
      payload?.countryCode || savedUser?.countryCode || savedUser?.phoneCode || "+1";
    const phoneNumber =
      payload?.phoneNumber || savedUser?.phoneNumber || "";
    const profileImageUrl =
      payload?.profileImageUrl || payload?.profileImage || savedUser?.profileImage || "";

    const finalPayload = {
      countryCode,
      phoneNumber,
      userType: 2,
      deviceToken,
      deviceType,
      profileImageUrl,
      ...payload,
      ...(profileImageUrl ? { profileImageUrl } : {}),
    };
    return this.request<Account>("POST", "sp/update-profile", finalPayload);
  }

  getSPProfile() {
    return this.request<MyProfile>("GET", "sp/fetch-profile");
  }

  getSPRatings(offset = 0, limit = 10) {
    return this.request<{ ratings: any[] }>(
      "GET",
      `sp/over-all-rating?offset=${offset}&limit=${limit}`
    );
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
      ssnNumber: ssnLast4,
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

  async getPastJobs(offset = 0, limit = 10, weekNumber?: string, weekYear?: string): Promise<{ spJobsFound: PastJob[] }> {
    let url = `sp/job/listing?listType=2&offset=${offset}&limit=${limit}`;
    if (weekNumber && weekYear) {
      url += `&weekNumber=${weekNumber}&weekYear=${weekYear}`;
    }
    const res = await this.request<any>("GET", url);
    const list: PastJob[] =
      res?.spJobsFound ||
      res?.jobList ||
      res?.jobs ||
      res?.data ||
      (Array.isArray(res) ? res : []);
    return { spJobsFound: list };
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

  // MARK: Terms & Conditions
  getTermsConditions() {
    return this.request<TermsCondition>("GET", "privacy-term-conditions?userType=sp");
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
  async fetchNotifications(offset = 0, limit = 10): Promise<{ notificationData: NotificationModel[] }> {
    const res = await this.request<any>(
      "GET",
      `sp-notification?limit=${limit}&offset=${offset}`
    );
    const list: NotificationModel[] =
      res?.notificationData ||
      res?.notifications ||
      res?.data ||
      (Array.isArray(res) ? res : []);
    return { notificationData: list };
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

  // MARK: Referral
  async getReferralInfo(): Promise<any> {
    try {
      return await this.request<any>("GET", "user/getReferralInfo");
    } catch {
      try {
        return await this.request<any>("GET", "sp/getReferralInfo");
      } catch (e) {
        return null;
      }
    }
  }

  // MARK: Earnings / Wallet
  getEarnings(weekNumber: string, weekYear: string) {
    return this.request<WeeklyEarnings>(
      "GET",
      `sp/job/weekly-earning?weekNumber=${weekNumber}&weekYear=${weekYear}`
    );
  }

  async getWeeklyTransactions(weekNumber: string, weekYear: string): Promise<{ spJobsFound: WeekTransaction[] }> {
    const res = await this.request<any>(
      "GET",
      `sp/job/weekly-earning-detail?weekNumber=${weekNumber}&weekYear=${weekYear}`
    );
    const list: WeekTransaction[] =
      res?.spJobsFound ||
      res?.transactions ||
      res?.jobs ||
      res?.data ||
      (Array.isArray(res) ? res : []);
    return { spJobsFound: list };
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
  async fetchTools(): Promise<{ tools: string[] }> {
    try {
      const response = await this.client.get("sp/tools-equipment");
      const body = response.data;
      let tools: string[] = [];
      if (Array.isArray(body)) {
        tools = body;
      } else if (Array.isArray(body?.data)) {
        tools = body.data;
      } else if (Array.isArray(body?.data?.tools)) {
        tools = body.data.tools;
      } else if (Array.isArray(body?.tools)) {
        tools = body.tools;
      } else if (Array.isArray((body?.data as any)?.spTools)) {
        tools = (body.data as any).spTools;
      } else if (Array.isArray((body as any)?.spTools)) {
        tools = (body as any).spTools;
      }
      return { tools };
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        // Expected when user is not logged in or session is unauthenticated
        return { tools: [] };
      }
      return { tools: [] };
    }
  }

  async updateTools(tools: string[]): Promise<any> {
    const response = await this.client.post("sp/tools-equipment", { tools });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || body.error || "Failed to update tools");
    }
    return body?.data ?? body;
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
    await storage.remove(StorageKeys.isGuestUserLoggedIn);
    await storage.remove(StorageKeys.userData);
    await storage.remove(StorageKeys.userId);
    await storage.remove(StorageKeys.userServices);
    await storage.remove(StorageKeys.userTools);
    await storage.remove(StorageKeys.userAvailability);
    await storage.remove(StorageKeys.onboardingStep);
    await storage.remove(StorageKeys.accountType);
    await storage.remove(StorageKeys.companyName);
    await storage.remove(StorageKeys.companyRegistrationNumber);
    await storage.remove(StorageKeys.referralCode);
    await storage.remove(StorageKeys.isCompanyWorker);
    await storage.remove(StorageKeys.savedCookies);
  }
}

export const api = new ApiClient();
