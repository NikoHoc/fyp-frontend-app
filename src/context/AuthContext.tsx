import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import api from '../services/api';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

let isSessionExpiredAlertShown = false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('customerToken');
        const storedUser = await SecureStore.getItemAsync('customerData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error("Gagal memuat sesi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (newToken: string, userData: User) => {
    try {
      await SecureStore.setItemAsync('customerToken', newToken);
      await SecureStore.setItemAsync('customerData', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error("Gagal menyimpan sesi login:", error);
    }
  };

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('customerToken');
      await SecureStore.deleteItemAsync('customerData');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error("Gagal menghapus sesi logout:", error);
    }
  }, []);

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          if (!isSessionExpiredAlertShown) {
            isSessionExpiredAlertShown = true;
            Alert.alert(
              "Sesi Berakhir",
              "Sesi Anda telah habis. Silakan login kembali.",
              [
                {
                  text: "OK",
                  onPress: async () => {
                    await logout();
                    isSessionExpiredAlertShown = false;
                  }
                }
              ],
              { cancelable: false }
            );
          }
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};