import { apiClient } from './client';
import { StripeCustomer } from '../models';

export const PaymentsApi = {
  setupCustomer: () => apiClient.get('stripe/user/setup/customer'),

  fetchCustomer: () => apiClient.get<StripeCustomer>('stripe/customer'),

  addCard: (paymentMethodID: string, isFromApplePay: boolean = false) =>
    apiClient.post('stripe/card/add', { paymentMethodID, isFromApplePay }),

  setDefaultCard: (cardId: string) =>
    apiClient.put('stripe/card/default', { cardId }),

  deleteCard: (cardId: string) =>
    apiClient.delete('stripe/card/delete', { data: { cardId } }),
};
