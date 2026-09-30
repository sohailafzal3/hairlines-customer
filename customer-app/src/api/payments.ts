import { apiClient } from './client';
import { StripeCustomer } from '../models';

export const PaymentsApi = {
  setupCustomer: () => apiClient.get('stripe/user/setup/customer'),

  fetchCustomer: () => apiClient.get<StripeCustomer>('stripe/customer'),

  addCard: (
    paymentMethod: string | { number: string; expMonth: number; expYear: number; cvc: string; name?: string; paymentMethodID?: string },
    isFromApplePay: boolean = false
  ) => {
    if (typeof paymentMethod === 'string') {
      return apiClient.post('stripe/card/add', { paymentMethodID: paymentMethod, isFromApplePay });
    }
    return apiClient.post('stripe/card/add', {
      paymentMethodID: paymentMethod.paymentMethodID || `pm_tok_${Date.now()}`,
      isFromApplePay,
      ...paymentMethod,
    });
  },

  setDefaultCard: (cardId: string) =>
    apiClient.put('stripe/card/default', { cardId }),

  deleteCard: (cardId: string) =>
    apiClient.delete('stripe/card/delete', { data: { cardId } }),
};
