import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, User } from '../models';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

import { removeCookies } from '../utils/cookies';

interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  account: Account | null;
  user: User | null;
  token: string | null;
  hasHydrated: boolean;

  // Actions
  setAccount: (account: Account | null) => void;
  setUser: (user: User | null) => void;
  setLoggedIn: (value: boolean) => void;
  setGuest: (value: boolean) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  login: (account: Account) => Promise<void>;
  loginGuest: (account: Account) => Promise<void>;
  logout: () => Promise<void>;
  updateUserField: (field: keyof User, value: any) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      isGuest: false,
      account: null,
      user: null,
      token: null,
      hasHydrated: false,

      setAccount: (account) => set({ account }),
      setUser: (user) => set({ user }),
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setGuest: (value) => set({ isGuest: value }),
      setToken: (token) => set({ token }),
      setHasHydrated: (value) => set({ hasHydrated: value }),

      login: async (account: Account) => {
        await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
        await Storage.removeItem(STORAGE_KEYS.kIsGuestUserLoggedIn);
        set({
          account,
          isLoggedIn: true,
          isGuest: false,
        });
      },

      loginGuest: async (account: Account) => {
        await Storage.setItem(STORAGE_KEYS.kIsGuestUserLoggedIn, 'true');
        await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
        set({
          account,
          isLoggedIn: true,
          isGuest: true,
        });
      },

      logout: async () => {
        await Storage.removeItem(STORAGE_KEYS.kIsUserLoggedIn);
        await Storage.removeItem(STORAGE_KEYS.kIsGuestUserLoggedIn);
        await removeCookies();
        set({
          isLoggedIn: false,
          isGuest: false,
          account: null,
          user: null,
          token: null,
        });
      },

      updateUserField: (field, value) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, [field]: value } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        isGuest: state.isGuest,
        account: state.account,
        user: state.user,
        token: state.token,
      }),
    }
  )
);
