import { apiClient } from './client';
import { Job, JobDetail, SP, SPProfile, Service, SubService, CostBreakDown, PromoCode } from '../models';
import { kOffSet } from '../constants';

export const JobsApi = {
  fetchServiceTypes: () => apiClient.get('user/fetch-service-types'),

  fetchServices: (latitude: number, longitude: number) =>
    apiClient.get<Service[]>('services', { params: { latitude, longitude } }),

  fetchSubServices: (serviceId: string) =>
    apiClient.get<SubService[]>(`sub/services/${serviceId}`),

  fetchSPList: (params: any, type: string = 'all', offset: number = 0) =>
    apiClient.post<SP[]>(`user/job/fetch-sp-list?limit=${kOffSet}&offset=${offset}&type=${type}`, params),

  fetchSPProfile: (spProfileId: string) =>
    apiClient.get<SPProfile>(`fetch-sp-profile/${spProfileId}`),

  estimateBreakdown: (params: any) =>
    apiClient.post<CostBreakDown>('user/job/estimate-breakdown', params),

  postJob: (params: any) => apiClient.post('user/job/post-job', params),

  fetchJobListing: (listType: string, offset: number = 0) =>
    apiClient.get<Job[]>(`user/job/listing?listType=${listType}&offset=${offset}&limit=${kOffSet}`),

  fetchJobDetail: (jobId: string) =>
    apiClient.get<JobDetail>(`user/job/${jobId}/detail`),

  deleteJob: (jobId: string) =>
    apiClient.get(`user/job/delete/job/${jobId}`),

  rateSP: (params: {
    review: string;
    rating: number;
    jobId: string;
    spProfileId: string;
    gratuity: number;
  }) => apiClient.put('user/job/rate-sp', params),

  lastUnratedJob: () => apiClient.get('last-unrated-job?userType=user'),

  checkAllowedLocations: (lat: number, long: number) =>
    apiClient.post('user/check/allowed/locations', { lat, long }),

  confirmCancellation: (jobId: string) =>
    apiClient.put('user/job/confirm/cancellation', { jobId }),

  fetchCancellationReasons: () =>
    apiClient.get('cancellation-reasons?userType=1'),

  cancelJob: (jobId: string, reasonId: string, reasonText: string) =>
    apiClient.put('user/job/cancel', { jobId, reasonId, reasonText }),
};
