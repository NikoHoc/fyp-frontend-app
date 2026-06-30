import { useState, useCallback } from 'react';
import { cartService } from '../services/cart';
import { CustomerCart } from '../types';
import { Alert } from 'react-native';

export const useCustomerCart = () => {
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDepotId, setActiveDepotId] = useState<number | null>(null); // State baru

  const fetchCart = useCallback(async (depotId?: number) => {
    const targetId = depotId || activeDepotId;
    if (!targetId) {
      setCart(null);
      return;
    }

    try {
      const data = await cartService.getCart(targetId);
      setCart(data);
    } catch (error) {
      console.error("Gagal mengambil keranjang:", error);
    }
  }, [activeDepotId]);

  const updateItem = async (
    depotId: number,
    menuId: number,
    quantity: number,
    isHalfPortion: boolean = false,
    note: string = '',
    cartItemId?: number
  ): Promise<{ success: boolean; conflict?: boolean }> => {
    if (!cartItemId) {
      setIsLoading(true);
    }
    try {
      await cartService.addOrUpdateItem(depotId, menuId, quantity, isHalfPortion, note, cartItemId);
      
      await fetchCart(depotId); 
      
      if (!cartItemId) setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Error", error.response?.data?.message || "Gagal memperbarui item");
      return { success: false };
    }
  };

  const clearCart = async (depotId: number) => {
    setIsLoading(true);
    try {
      await cartService.clearCart(depotId);
      await fetchCart(depotId);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false };
    }
  };

  const checkout = async (pickupMethod: string, depotId: number): Promise<{ success: boolean; transaction_id?: string }> => {
    setIsLoading(true);
    try {
      const response = await cartService.checkoutCart(pickupMethod, depotId);
      if (response.success) {
        await fetchCart(depotId);
        setIsLoading(false);
        return { success: true, transaction_id: response.data.transaction_id };
      }
      setIsLoading(false);
      return { success: false };
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Gagal Checkout", error.response?.data?.message || "Terjadi kesalahan pada sistem.");
      return { success: false };
    }
  };

  return {
    cart,
    setCart,
    isLoading,
    fetchCart,
    updateItem,
    clearCart,
    checkout,
    activeDepotId,
    setActiveDepotId
  };
};