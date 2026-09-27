import { apiClient } from './client';
import { MyProfile, Member, AddressList, Rating } from '../models';
import { kOffSet } from '../constants';

export const ProfileApi = {
  fetchProfile: () => apiClient.get<MyProfile>('user/fetch-profile/'),

  editProfile: (params: any) => apiClient.put('user/edit-profile', params),

  fetchMember: () => apiClient.get<Member[]>('user/fetch-member'),

  addMember: (params: {
    firstName: string;
    lastName: string;
    health: string;
    age: number;
    relation: string;
  }) => apiClient.post('user/add-new-member', params),

  updateMember: (params: {
    memberId: string;
    firstName: string;
    lastName: string;
    health: string;
    age: number;
    relation: string;
  }) => apiClient.post('user/update-member', params),

  deleteMember: (memberId: string) =>
    apiClient.get(`user/delete-member/${memberId}`),

  getAddress: () => apiClient.get<AddressList>('user/get-address'),

  addAddress: (params: any) => apiClient.post('user/add-address', params),

  changePassword: (password: string, newPassword: string) =>
    apiClient.post('user/change-password', { password, newPassword }),

  fetchContactInfo: () => apiClient.get('user/fetch-contact-info'),

  deleteAccount: () => apiClient.get('delete-account'),

  notificationCount: () =>
    apiClient.get('notification-count?userType=user'),

  fetchWallet: () => apiClient.get('user/fetch-wallet'),

  fetchPromoCodes: (offset: number = 0, limit: number = kOffSet) =>
    apiClient.get(`user/fetch-promo-code?offset=${offset}&limit=${limit}`),

  applyPromoCode: (promoCode: string) =>
    apiClient.post('user/promoCode/apply', { promoCode }),

  getReferralInfo: () => apiClient.get('user/getReferralInfo'),

  useReferralCreditStatus: () => apiClient.get('user/useReferralCreditStatus'),

  fetchFacilities: () => apiClient.get('user/facilities'),

  saveFacilities: (facilities: string[]) =>
    apiClient.post('user/facilities', { facilities }),

  contactSupport: (message: string) =>
    apiClient.post('contactSupportMessage', { message }),

  fetchUserRatings: (offset: number = 0, limit: number = kOffSet) =>
    apiClient.get(`user/over-all-rating?offset=${offset}&limit=${limit}`),

  fetchSPRratings: (spProfileId: string, offset: number = 0, limit: number = kOffSet) =>
    apiClient.get(`sp/over-all-rating?offset=${offset}&limit=${limit}&spProfileId=${spProfileId}`),
};
