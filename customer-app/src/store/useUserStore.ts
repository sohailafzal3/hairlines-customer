import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member, NewAddress, Filter } from '../models';

interface UserState {
  members: Member[];
  addresses: NewAddress[];
  notificationBadge: number;
  filters: Filter | null;
  walletAmount: number;

  // Actions
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  setAddresses: (addresses: NewAddress[]) => void;
  setNotificationBadge: (count: number) => void;
  setFilters: (filters: Filter | null) => void;
  setWalletAmount: (amount: number) => void;
}

const zustandStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      members: [],
      addresses: [],
      notificationBadge: 0,
      filters: null,
      walletAmount: 0,

      setMembers: (members) => set({ members }),
      addMember: (member) =>
        set((state) => ({ members: [...state.members, member] })),
      removeMember: (memberId) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== memberId),
        })),
      setAddresses: (addresses) => set({ addresses }),
      setNotificationBadge: (count) => set({ notificationBadge: count }),
      setFilters: (filters) => set({ filters }),
      setWalletAmount: (amount) => set({ walletAmount: amount }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
