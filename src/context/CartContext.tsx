import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useCustomerCart } from '../hooks/useCustomerCart';
import { AuthContext } from './AuthContext';
import { CustomerCart } from '../types';

interface CartContextType {
  cart: CustomerCart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  updateItem: (depotId: number, menuId: number, quantity: number, isHalfPortion?: boolean, note?: string, cartItemId?: number) => Promise<boolean>;
  clearCart: () => Promise<any>;
  getItemQuantity: (menuId: number, depotId: number) => number;
}

export const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const cartData = useCustomerCart();

  useEffect(() => {
    if (user?.role === 'pelanggan') {
      cartData.fetchCart();
    }
  }, [user]);

  const getItemQuantity = (menuId: number, depotId: number) => {
    if (!cartData.cart || !cartData.cart.items || cartData.cart.depot_id !== depotId) return 0;
    
    return cartData.cart.items
      .filter((item) => item.menu_id === menuId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ ...cartData, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};