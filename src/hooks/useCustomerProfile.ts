import { useState, useCallback } from 'react';
import { customerService } from '../services/customer';
import { CustomerProfile } from '../types';

export const useCustomerProfile = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customerService.getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to fetch customer profile:", err);
      setError(err.response?.data?.message || "Gagal mengambil data profil");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile
  };
};