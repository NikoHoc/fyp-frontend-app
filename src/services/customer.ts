import api from './api';
import { CustomerProfile } from '../types';

export const customerService = {
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await api.get('/customers/me');
    return response.data.data;
  }
};