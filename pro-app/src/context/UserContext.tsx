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
  setAccount: (account: Account) => Promise<void>;
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

  const persistUser = useCallback(async (state: UserState) => {
    setUser(state);
    await storage.set(StorageKeys.userData, state);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await storage.get<UserState>(StorageKeys.userData);
      const lang =
        (await storage.get<string>(StorageKeys.languageCode)) ??
        DEFAULT_LANGUAGE_CODE;
      if (saved) {
        setUser({ ...defaultUserState, ...saved, languageCode: lang });
      } else {
        setUser((u) => ({ ...u, languageCode: lang }));
      }
      setLoading(false);
    })();
  }, []);

  const setAccount = useCallback(
    async (account: Account) => {
      const next: UserState = {
        ...user,
        id: account.id ?? account.userAccountId ?? user.id,
        firstName: account.firstName ?? user.firstName,
        lastName: account.lastName ?? user.lastName,
        name: account.name ?? user.name,
        profileImage: account.profileImage ?? user.profileImage,
        email: account.email ?? user.email,
        phoneCode: account.phoneCode ?? user.phoneCode,
        phoneNumber: account.phoneNumber ?? user.phoneNumber,
        avgRating: account.avgRating ?? user.avgRating,
        accountType: account.accountType ?? user.accountType,
        companyName: account.companyName ?? user.companyName,
        referralCode: account.referralCode ?? user.referralCode,
        isBlocked: account.isBlocked ?? user.isBlocked,
        isCompanyWorker: account.isCompanyWorker ?? user.isCompanyWorker,
        provideServicesinPremisis:
          account.provideServiceInPremisis ?? user.provideServicesinPremisis,
        provideServicesinUserPrimisis:
          account.provideServiceInUserPremisis ??
          user.provideServicesinUserPrimisis,
        tools: account.tools ?? user.tools,
        serviceFor: account.serviceFor ?? user.serviceFor,
        signUpStepCompleted:
          account.stepCompleted ?? user.signUpStepCompleted,
        isSignUpCompleted:
          account.isSignUpCompleted ?? user.isSignUpCompleted,
      };
      await persistUser(next);
    },
    [persistUser, user]
  );

  const updateUser = useCallback(
    async (patch: Partial<UserState>) => {
      await persistUser({ ...user, ...patch });
    },
    [persistUser, user]
  );

  const setLoggedIn = useCallback(
    async (value: boolean) => {
      await storage.set(StorageKeys.isUserLoggedIn, value);
      await storage.set(StorageKeys.isSPLoggedIn, value);
      await persistUser({ ...user, isLoggedIn: value });
    },
    [persistUser, user]
  );

  const setLanguageCode = useCallback(
    async (code: string) => {
      await storage.set(StorageKeys.languageCode, code);
      await persistUser({ ...user, languageCode: code });
    },
    [persistUser, user]
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
