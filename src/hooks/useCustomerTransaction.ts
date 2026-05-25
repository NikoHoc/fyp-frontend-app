import { useState, useCallback } from 'react';
import { customerTransactionService } from '../services/customerTransaction';

export const useCustomerTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await customerTransactionService.getAll();
      return data;
    } catch (error) {
      console.error("Gagal mengambil riwayat transaksi:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactionDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await customerTransactionService.getById(id);
      return data;
    } catch (error) {
      console.error("Gagal mengambil detail transaksi:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchTransactions,
    fetchTransactionDetail
  };
};