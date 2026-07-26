import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, User } from '../models';
import { Storage } from '../utils/storage';
import { CookieManager } from '../utils/cookies';
import { STORAGE_KEYS } from '../constants';

interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  account: Account | null;
  user: User | null;
  token: string | null;

  // Actions
  setAccount: (account: Account | null) => void;
  setUser: (user: User | null) => void;
  setLoggedIn: (value: boolean) => void;
  setGuest: (value: boolean) => void;
  setToken: (token: string | null) => void;
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

      setAccount: (account) => set({ account }),
      setUser: (user) => set({ user }),
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setGuest: (value) => set({ isGuest: value }),
      setToken: (token) => set({ token }),

      logout: async () => {
        await Storage.removeItem(STORAGE_KEYS.kIsUserLoggedIn);
        await Storage.removeItem(STORAGE_KEYS.kIsGuestUserLoggedIn);
        await CookieManager.clearCookies();
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
