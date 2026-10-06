import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { storage } from "../utils/storage";
import { StorageKeys, DEFAULT_LANGUAGE_CODE } from "../constants";
import { Account, UserState } from "../types/models";
import { api } from "../services/api";

export const defaultUserState: UserState = {
  languageCode: DEFAULT_LANGUAGE_CODE,
  isLoggedIn: false,
  deviceToken: "",
  token: "",
  id: "",
  firstName: "",
  lastName: "",
  name: "",
  profileImage: "",
  userType: "2",
  isBlocked: false,
  email: "",
  isEmailUpdate: false,
  phoneCode: "+1",
  phoneNumber: "",
  country: "",
  countryCode: "+1",
  avgRating: 0,
  accountType: 0,
  companyName: "",
  companyRegistrationNumber: "",
  referralCode: "",
  notificationBadge: 0,
  isCompanyWorker: false,
  termsDescription: "",
  privacyDescription: "",
  permanentAddress: "",
  postalCode: "",
  city: "",
  state: "",
  lat: 0,
  long: 0,
  provideServicesinPremisis: false,
  provideServicesinUserPrimisis: false,
  tools: [],
  serviceFor: -1,
  isApproved: false,
  signUpStepCompleted: 0,
  isSignUpCompleted: false,
};

interface UserContextValue {
  user: UserState;
  setAccount: (account: Account, markLoggedIn?: boolean) => Promise<void>;
  updateUser: (patch: Partial<UserState>) => Promise<void>;
  setLoggedIn: (value: boolean) => Promise<void>;
  setLanguageCode: (code: string) => Promise<void>;
  clearUser: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserState>(defaultUserState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.get<UserState>(StorageKeys.userData);
        const isLogged =
          (await storage.get<boolean>(StorageKeys.isUserLoggedIn)) ?? false;
        const lang =
          (await storage.get<string>(StorageKeys.languageCode)) ??
          DEFAULT_LANGUAGE_CODE;
        if (saved) {
          if (saved.token) {
            api.setAuthToken(saved.token);
          }
          setUser({
            ...defaultUserState,
            ...saved,
            languageCode: lang,
            isLoggedIn: isLogged || !!saved.isLoggedIn,
          });
        } else {
          setUser((u) => ({ ...u, languageCode: lang, isLoggedIn: isLogged }));
        }
      } catch (err) {
        console.error("Failed to load saved user state:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setAccount = useCallback(
    async (account: Account, markLoggedIn = true) => {
      let nextState: UserState = defaultUserState;
      let isDifferentUser = false;

      setUser((prev) => {
        const raw = (account || {}) as any;
        const userObj = raw.userData || raw.user || raw;
        const addr = (userObj.address || raw.address) as any;

        const resolvedId =
          userObj.id ??
          userObj.userAccountId ??
          userObj._id ??
          raw.id ??
          raw.userAccountId ??
          raw._id ??
          "";

        const resolvedPhoneNumber =
          userObj.phoneNumber ??
          raw.phoneNumber ??
          userObj.mobile ??
          raw.mobile ??
          "";

        const isSameUser =
          Boolean(prev.id && resolvedId && prev.id === resolvedId) ||
          Boolean(
            prev.phoneNumber &&
              resolvedPhoneNumber &&
              prev.phoneNumber === resolvedPhoneNumber
          );

        isDifferentUser = !isSameUser && Boolean(prev.id || prev.phoneNumber);

        // If it's a different user, start strictly from defaultUserState to prevent data leakage
        const base = isSameUser ? prev : defaultUserState;

        // Resolve auth token
        const resolvedToken =
          raw.token ??
          userObj.token ??
          raw.data?.token ??
          base.token ??
          "";

        if (resolvedToken) {
          api.setAuthToken(resolvedToken);
        }

        const resolvedPhoneCode =
          userObj.phoneCode ??
          userObj.phoneNumberPrefix ??
          userObj.countryCode ??
          raw.phoneCode ??
          raw.countryCode ??
          base.phoneCode ??
          "+1";

        const resolvedCountryCode =
          userObj.countryCode ??
          userObj.phoneCode ??
          raw.countryCode ??
          base.countryCode ??
          "+1";

        // Extract Step Completed from all possible keys & sources
        let resolvedStep = 0;
        const rawStep =
          raw.signUpStepCompleted ??
          raw.stepCompleted ??
          userObj.signUpStepCompleted ??
          userObj.stepCompleted;
        if (rawStep !== undefined && rawStep !== null && rawStep !== -1) {
          resolvedStep = Number(rawStep);
        } else if (isSameUser && base.signUpStepCompleted > 0) {
          resolvedStep = base.signUpStepCompleted;
        }

        // Extract isSignUpCompleted from all possible keys & sources
        const rawCompleted =
          raw.isSignUpCompleted ??
          raw.isSignupCompleted ??
          userObj.isSignUpCompleted ??
          userObj.isSignupCompleted ??
          raw.isProfileCompleted ??
          userObj.isProfileCompleted ??
          raw.isSpProfileCompleted ??
          userObj.isSpProfileCompleted;

        let resolvedSignUpCompleted = false;
        if (rawCompleted !== undefined && rawCompleted !== null) {
          resolvedSignUpCompleted =
            rawCompleted === true ||
            rawCompleted === "true" ||
            rawCompleted === 1 ||
            rawCompleted === "1";
        } else if (resolvedStep >= 7) {
          // If step 7 (Thank You) was reached, onboarding is completed
          resolvedSignUpCompleted = true;
        } else if (isSameUser && base.isSignUpCompleted) {
          resolvedSignUpCompleted = true;
        }

        const isExplicitlyIncomplete =
          rawCompleted === false ||
          rawCompleted === "false" ||
          rawCompleted === 0 ||
          rawCompleted === "0" ||
          (rawStep !== undefined && rawStep !== null && Number(rawStep) >= 0 && Number(rawStep) < 7);

        // If the account has administrative verification / approval, mark signup complete only if not explicitly incomplete
        if (!isExplicitlyIncomplete) {
          if (
            userObj.isVerifiedByAdmin === true ||
            raw.isVerifiedByAdmin === true ||
            userObj.isApproved === true ||
            raw.isApproved === true ||
            userObj.isSpApproved === true ||
            raw.isSpApproved === true
          ) {
            resolvedSignUpCompleted = true;
          }
        }

        const resolvedFirstName =
          userObj.firstName ??
          raw.firstName ??
          (isSameUser ? base.firstName : "");

        const resolvedLastName =
          userObj.lastName ??
          raw.lastName ??
          (isSameUser ? base.lastName : "");

        const resolvedName =
          userObj.name ??
          raw.name ??
          (resolvedFirstName && resolvedLastName
            ? `${resolvedFirstName} ${resolvedLastName}`
            : isSameUser
            ? base.name
            : resolvedFirstName || "");

        const resolvedProfileImage =
          userObj.profileImage ??
          userObj.profileImageUrl ??
          raw.profileImage ??
          raw.profileImageUrl ??
          raw.imageUrl ??
          (isSameUser ? base.profileImage : "");

        const resolvedEmail =
          userObj.email ??
          raw.email ??
          (isSameUser ? base.email : "");

        const resolvedAvgRating =
          userObj.avgRating ??
          raw.avgRating ??
          (isSameUser ? base.avgRating : 0);

        const resolvedAccountType =
          userObj.accountType ??
          raw.accountType ??
          (isSameUser ? base.accountType : 0);

        const resolvedCompanyName =
          userObj.companyName ??
          raw.companyName ??
          (isSameUser ? base.companyName : "");

        const resolvedReferralCode =
          userObj.referralCode ??
          raw.referralCode ??
          (isSameUser ? base.referralCode : "");

        const resolvedIsBlocked =
          userObj.isBlocked ??
          raw.isBlocked ??
          (isSameUser ? base.isBlocked : false);

        const resolvedIsCompanyWorker =
          userObj.isCompanyWorker ??
          raw.isCompanyWorker ??
          (isSameUser ? base.isCompanyWorker : false);

        const resolvedProvideInPremises =
          userObj.provideServiceInPremisis ??
          raw.provideServiceInPremisis ??
          userObj.provideServicesinPremisis ??
          (isSameUser ? base.provideServicesinPremisis : true);

        const resolvedProvideInUserPremises =
          userObj.provideServiceInUserPremisis ??
          raw.provideServiceInUserPremisis ??
          userObj.provideServicesinUserPrimisis ??
          (isSameUser ? base.provideServicesinUserPrimisis : true);

        const resolvedTools =
          userObj.tools ??
          raw.tools ??
          (isSameUser ? base.tools : []);

        const resolvedServiceFor =
          userObj.serviceFor ??
          raw.serviceFor ??
          (isSameUser ? base.serviceFor : 1);

        const resolvedIsApproved =
          userObj.isApproved ??
          raw.isApproved ??
          userObj.isVerifiedByAdmin ??
          raw.isVerifiedByAdmin ??
          (isSameUser ? base.isApproved : false);

        nextState = {
          ...base,
          id: resolvedId || base.id,
          token: resolvedToken || base.token || "",
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          name: resolvedName,
          profileImage: resolvedProfileImage,
          email: resolvedEmail,
          phoneCode: resolvedPhoneCode,
          countryCode: resolvedCountryCode,
          phoneNumber: resolvedPhoneNumber || base.phoneNumber,
          avgRating: resolvedAvgRating,
          accountType: resolvedAccountType,
          companyName: resolvedCompanyName,
          referralCode: resolvedReferralCode,
          isBlocked: resolvedIsBlocked,
          isCompanyWorker: resolvedIsCompanyWorker,
          provideServicesinPremisis: resolvedProvideInPremises,
          provideServicesinUserPrimisis: resolvedProvideInUserPremises,
          tools: resolvedTools,
          serviceFor: resolvedServiceFor,
          isApproved: resolvedIsApproved,
          signUpStepCompleted: resolvedStep,
          isSignUpCompleted: resolvedSignUpCompleted,
          permanentAddress:
            addr?.primaryAddress ??
            addr?.streetAddressLine1 ??
            userObj.userPrimaryAddress ??
            userObj.primaryAddress ??
            (isSameUser ? base.permanentAddress : ""),
          city: addr?.city ?? userObj.city ?? userObj.userCity ?? (isSameUser ? base.city : ""),
          state: addr?.state ?? userObj.state ?? userObj.userState ?? (isSameUser ? base.state : ""),
          postalCode: addr?.postalCode ?? userObj.postalCode ?? (isSameUser ? base.postalCode : ""),
          country: addr?.country ?? userObj.country ?? userObj.userCountry ?? (isSameUser ? base.country : "United States"),
          lat: addr?.latitude ?? addr?.lat ?? userObj.latitude ?? userObj.userLat ?? base.lat ?? 0,
          long: addr?.longitude ?? addr?.long ?? userObj.longitude ?? userObj.userLong ?? base.long ?? 0,
          isLoggedIn: markLoggedIn ? true : base.isLoggedIn,
        };
        return nextState;
      });

      if (isDifferentUser) {
        // Purge old user's cached preferences
        await storage.remove(StorageKeys.userServices);
        await storage.remove(StorageKeys.userTools);
        await storage.remove(StorageKeys.userAvailability);
      }

      if (markLoggedIn) {
        await storage.set(StorageKeys.isUserLoggedIn, true);
        await storage.set(StorageKeys.isSPLoggedIn, true);
      }
      await storage.set(StorageKeys.userData, nextState);
    },
    []
  );

  const updateUser = useCallback(
    async (patch: Partial<UserState>) => {
      let nextState: UserState = defaultUserState;
      setUser((prev) => {
        nextState = { ...prev, ...patch };
        if (patch.token) {
          api.setAuthToken(patch.token);
        }
        return nextState;
      });
      await storage.set(StorageKeys.userData, nextState);
    },
    []
  );

  const setLoggedIn = useCallback(
    async (value: boolean) => {
      await storage.set(StorageKeys.isUserLoggedIn, value);
      await storage.set(StorageKeys.isSPLoggedIn, value);
      let nextState: UserState = defaultUserState;
      setUser((prev) => {
        nextState = { ...prev, isLoggedIn: value };
        return nextState;
      });
      await storage.set(StorageKeys.userData, nextState);
    },
    []
  );

  const setLanguageCode = useCallback(
    async (code: string) => {
      await storage.set(StorageKeys.languageCode, code);
      let nextState: UserState = defaultUserState;
      setUser((prev) => {
        nextState = { ...prev, languageCode: code };
        return nextState;
      });
      await storage.set(StorageKeys.userData, nextState);
    },
    []
  );

  const clearUser = useCallback(async () => {
    api.setAuthToken("");
    await storage.remove(StorageKeys.userData);
    await storage.remove(StorageKeys.isUserLoggedIn);
    await storage.remove(StorageKeys.isSPLoggedIn);
    await storage.remove(StorageKeys.isGuestUserLoggedIn);
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
    setUser(defaultUserState);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setAccount,
        updateUser,
        setLoggedIn,
        setLanguageCode,
        clearUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
