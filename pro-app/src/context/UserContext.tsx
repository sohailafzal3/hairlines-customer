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

export const defaultUserState: UserState = {
  languageCode: DEFAULT_LANGUAGE_CODE,
  isLoggedIn: false,
  deviceToken: "",
  id: "",
  firstName: "",
  lastName: "",
  name: "",
  profileImage: "",
  userType: "2",
  isBlocked: false,
  email: "",
  isEmailUpdate: false,
  phoneCode: "",
  phoneNumber: "",
  country: "",
  countryCode: "",
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
      setUser((prev) => {
        const addr = account.address as any;
        const resolvedId =
          account.id ?? account.userAccountId ?? account._id ?? prev.id;
        const resolvedPhoneCode =
          account.phoneCode ?? account.phoneNumberPrefix ?? prev.phoneCode;
        const resolvedStep =
          account.stepCompleted ?? prev.signUpStepCompleted;
        const resolvedSignUpCompleted =
          account.isSignUpCompleted !== undefined
            ? account.isSignUpCompleted
            : prev.isSignUpCompleted;

        nextState = {
          ...prev,
          id: resolvedId,
          firstName: account.firstName ?? prev.firstName,
          lastName: account.lastName ?? prev.lastName,
          name:
            account.name ??
            (account.firstName && account.lastName
              ? `${account.firstName} ${account.lastName}`
              : prev.name),
          profileImage: account.profileImage ?? prev.profileImage,
          email: account.email ?? prev.email,
          phoneCode: resolvedPhoneCode,
          phoneNumber: account.phoneNumber ?? prev.phoneNumber,
          avgRating: account.avgRating ?? prev.avgRating,
          accountType: account.accountType ?? prev.accountType,
          companyName: account.companyName ?? prev.companyName,
          referralCode: account.referralCode ?? prev.referralCode,
          isBlocked: account.isBlocked ?? prev.isBlocked,
          isCompanyWorker: account.isCompanyWorker ?? prev.isCompanyWorker,
          provideServicesinPremisis:
            account.provideServiceInPremisis ?? prev.provideServicesinPremisis,
          provideServicesinUserPrimisis:
            account.provideServiceInUserPremisis ??
            prev.provideServicesinUserPrimisis,
          tools: account.tools ?? prev.tools,
          serviceFor: account.serviceFor ?? prev.serviceFor,
          signUpStepCompleted: resolvedStep,
          isSignUpCompleted: resolvedSignUpCompleted,
          permanentAddress:
            addr?.primaryAddress ?? addr?.streetAddressLine1 ?? prev.permanentAddress,
          city: addr?.city ?? prev.city,
          state: addr?.state ?? prev.state,
          postalCode: addr?.postalCode ?? prev.postalCode,
          country: addr?.country ?? prev.country,
          isLoggedIn: markLoggedIn ? true : prev.isLoggedIn,
        };
        return nextState;
      });

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
    await storage.remove(StorageKeys.userData);
    await storage.remove(StorageKeys.isUserLoggedIn);
    await storage.remove(StorageKeys.isSPLoggedIn);
    await storage.remove(StorageKeys.isGuestUserLoggedIn);
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
