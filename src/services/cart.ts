import api from './api';
import { CustomerCart } from '../types';

export const cartService = {
  getCart: async (): Promise<CustomerCart | null> => {
    const response = await api.get('/customers/me/cart');
    return response.data.data;
  },

  addOrUpdateItem: async (depotId: number, menuId: number, quantity: number, isHalfPortion: boolean = false, note: string = '', cartItemId?: number) => {
    const payload: any = {
      depot_id: depotId,
      menu_id: menuId,
      quantity,
      is_half_portion: isHalfPortion,
      note
    };
    if (cartItemId) {
      payload.cart_item_id = cartItemId; 
    }
    
    const response = await api.post('/customers/me/cart/items', payload);
    return response.data;
  },

  removeItem: async (cartItemId: number) => {
    const response = await api.delete(`/customers/me/cart/items/${cartItemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/customers/me/cart');
    return response.data;
  }
};