import api from './api';

export const customerTransactionService = {
  getAll: async () => {
    const response = await api.get('/customers/me/transactions');
    return response.data.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/customers/me/transactions/${id}`);
    return response.data.data;
  }
};