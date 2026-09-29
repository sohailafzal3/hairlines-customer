import { apiClient } from './client';
import { Messages } from '../models';
import { kOffSet } from '../constants';

export const ChatApi = {
  fetchThread: (packageId: string, offset: number = 0, limit: number = kOffSet) =>
    apiClient.get<Messages>(`chatting/thread/${packageId}?offset=${offset}&limit=${limit}&userType=1`),

  sendMessage: (params: { jobId: string; body: string; receiverType: number }) =>
    apiClient.post('chatting/send-message', {
      jobId: params.jobId,
      body: params.body,
      receiverType: params.receiverType,
      userType: 1,
    }),
};
