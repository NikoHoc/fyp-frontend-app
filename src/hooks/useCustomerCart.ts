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

  const updateItem = async (depotId: number, menuId: number, quantity: number, isHalfPortion: boolean = false, note: string = '', cartItemId?: number) => {
    setIsLoading(true);
    try {
      await cartService.addOrUpdateItem(depotId, menuId, quantity, isHalfPortion, note, cartItemId);
      
      fetchCart(); 
      setIsLoading(false);
      
      return true;
    } catch (error: any) {
      setIsLoading(false);
      if (error.response?.status === 409) {
        Alert.alert(
          "Pindah Cabang?",
          "Anda memiliki pesanan di cabang lain. Ingin menghapus keranjang lama dan memesan dari cabang ini?",
          [
            { text: "Batal", style: "cancel" },
            { 
              text: "Ya, Hapus & Ganti", 
              style: "destructive",
              onPress: async () => {
                setIsLoading(true);
                await cartService.clearCart();
                await updateItem(depotId, menuId, quantity, isHalfPortion, note, cartItemId);
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", "Gagal memperbarui keranjang");
      }
      return false;
    }
  };

  return {
    cart,
    isLoading,
    fetchCart,
    updateItem,
    clearCart: cartService.clearCart
  };
};