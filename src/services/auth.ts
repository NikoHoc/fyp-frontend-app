import api from './api';

export const loginCustomer = async (data: any) => {
  const payload = { 
    ...data, 
    source: "mobile" 
  };
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const registerCustomer = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};