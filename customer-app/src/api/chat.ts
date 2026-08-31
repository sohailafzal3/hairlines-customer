import { apiClient } from './client';
import { Messages } from '../models';
import { kOffSet } from '../constants';

export const ChatApi = {
  fetchThread: (packageId: string, offset: number = 0, limit: number = kOffSet) =>
    apiClient.get<Messages>(`chatting/thread/${packageId}?offset=${offset}&limit=${limit}&userType=1`),
};
