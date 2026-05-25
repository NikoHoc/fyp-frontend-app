import { useState, useCallback } from 'react';
import { cartService } from '../services/cart';
import { CustomerCart } from '../types';
import { Alert } from 'react-native';

export const useCustomerCart = () => {
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error("Gagal mengambil keranjang:", error);
    }
  }, []);

  const updateItem = async (
    depotId: number,
    menuId: number,
    quantity: number,
    isHalfPortion: boolean = false,
    note: string = '',
    cartItemId?: number
  ): Promise<{ success: boolean; conflict?: boolean }> => {
    setIsLoading(true);
    try {
      await cartService.addOrUpdateItem(depotId, menuId, quantity, isHalfPortion, note, cartItemId);
      
      fetchCart(); 
      
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      if (error.response?.status === 409) {
        return { success: false, conflict: true };
      }
      Alert.alert("Error", "Gagal memperbarui keranjang");
      return { success: false };
    }
  };

  const clearCartAndRetry = async (
    depotId: number,
    menuId: number,
    quantity: number,
    isHalfPortion: boolean,
    note: string,
    cartItemId?: number
  ): Promise<{ success: boolean }> => {
    setIsLoading(true);
    try {
      await cartService.clearCart();
      await cartService.addOrUpdateItem(depotId, menuId, quantity, isHalfPortion, note, cartItemId);
      
      fetchCart();
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Gagal memperbarui keranjang");
      return { success: false };
    }
  };

  return {
    cart,
    setCart,
    isLoading,
    fetchCart,
    updateItem,
    clearCartAndRetry,
    clearCart: cartService.clearCart
  };
};