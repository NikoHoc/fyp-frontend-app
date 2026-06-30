import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { AuthContext } from './AuthContext';
import { CustomerCart } from '../types';

interface CartContextType {
  cart: CustomerCart | null;
  isLoading: boolean;
  activeDepotId: number | null;
  setActiveDepotId: (id: number | null) => void;
  fetchCart: (depotId?: number) => Promise<void>;
  updateItem: (depotId: number, menuId: number, quantity: number, isHalfPortion?: boolean, note?: string, cartItemId?: number) => Promise<{ success: boolean; conflict?: boolean }>;
  checkout: (pickupMethod: string, depotId: number) => Promise<{ success: boolean; transaction_id?: string }>;
  clearCart: (depotId: number) => Promise<any>;
  getItemQuantity: (menuId: number, depotId: number) => number;
}

export const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const cartData = useCustomerCart();

  useEffect(() => {
    if (user?.role !== 'pelanggan') {
      cartData.setCart(null);
      cartData.setActiveDepotId(null);
    }
  }, [user]);

  const getItemQuantity = (menuId: number, depotId: number) => {
    if (!user || !cartData.cart || !cartData.cart.items || cartData.cart.depot_id !== depotId) return 0;
    
    const item = cartData.cart.items.find(i => i.menu_id === menuId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider value={{ ...cartData, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};