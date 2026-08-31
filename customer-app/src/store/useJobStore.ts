import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateJobData, SP, PromoCode } from '../models';

interface JobState {
  createJob: CreateJobData;
  selectedPromoCode: PromoCode | null;

  // Actions
  setCreateJobField: (field: keyof CreateJobData, value: any) => void;
  setCreateJob: (data: Partial<CreateJobData>) => void;
  setSelectedSp: (sp: SP | undefined) => void;
  setPromoCode: (promo: PromoCode | null) => void;
  resetCreateJob: () => void;
}

const initialJobState: CreateJobData = {
  primaryAddress: '',
  streetAddressLine1: '',
  streetAddressLine2: '',
  latitude: 0,
  longitude: 0,
  city: '',
  state: '',
  country: '',
  serviceId: '',
  serviceName: '',
  servicesName: '',
  servicesDescription: '',
  serviceImage: '',
  serviceHourlyRate: 0,
  serviceTypeId: '',
  serviceTypeName: '',
  serviceTypeDescription: '',
  serviceTypeImage: '',
  subServiceTypeId: '',
  memberId: '',
  serviceFor: '',
  bookingType: '',
  weekDay: '',
  timeZone: '',
  isJobOfferedFor: false,
  barberGender: '',
  isFilterApplied: false,
  minRating: 0,
  maxRating: 5,
  distance: 0,
  subServiceTypeRate: 0,
  subServiceId: '',
  subServiceName: '',
  worker: undefined,
  merchantId: '',
  descriptionText: '',
  jobDuration: 0,
  jobStartTime: '',
  jobEndTime: '',
  selectedSp: undefined,
  specialInstruction: '',
  promoCode: '',
  jobId: '',
  atUserLocation: false,
  atSpLocation: false,
  stylePreferenceImage: '',
  referenceImages: [],
  isOldJob: false,
};

const zustandStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const useJobStore = create<JobState>()(
  persist(
    (set) => ({
      createJob: { ...initialJobState },
      selectedPromoCode: null,

      setCreateJobField: (field, value) =>
        set((state) => ({
          createJob: { ...state.createJob, [field]: value },
        })),

      setCreateJob: (data) =>
        set((state) => ({
          createJob: { ...state.createJob, ...data },
        })),

      setSelectedSp: (sp) =>
        set((state) => ({
          createJob: { ...state.createJob, selectedSp: sp },
        })),

      setPromoCode: (promo) => set({ selectedPromoCode: promo }),

      resetCreateJob: () => set({ createJob: { ...initialJobState }, selectedPromoCode: null }),
    }),
    {
      name: 'job-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
