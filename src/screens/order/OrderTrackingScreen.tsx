import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle2, ChefHat, Receipt } from 'lucide-react-native';
import api from '@/services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

export default function OrderTrackingScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactionDetail = async () => {
    try {
      const response = await api.get(`/customers/me/transactions/${transactionId}`);
      setTransaction(response.data.data);
    } catch (error) {
      console.error("Gagal load transaksi", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetail(); // Panggilan pertama

    const interval = setInterval(() => {
      fetchTransactionDetail();
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId]);

  if (isLoading && !transaction) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#DC2626" />
        <Text className="mt-4 text-gray-500 font-medium">Memuat pesanan Anda...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center relative shadow-sm">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="absolute left-0 right-0 items-center" style={{ zIndex: -1 }}>
          <Text className="text-lg font-black text-gray-800">Status Pesanan</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {transaction?.order_status === 'pending' && (
          <View className="bg-white m-4 p-8 rounded-3xl items-center border border-gray-100 shadow-sm">
            <ActivityIndicator size="large" color="#F59E0B" className="mb-4" />
            <Text className="text-xl font-black text-gray-800 text-center mb-2">Menunggu Kasir</Text>
            <Text className="text-sm text-gray-500 text-center leading-relaxed px-4">
              Pesanan Anda telah dikirim ke depot. Mohon tunggu kasir untuk menerima pesanan Anda.
            </Text>
          </View>
        )}
        {transaction?.order_status === 'cancelled' && (
          <View className="bg-white m-4 p-8 rounded-3xl items-center border border-red-100 shadow-sm">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#DC2626" />
            </View>
            <Text className="text-xl font-black text-red-600 text-center mb-2">Pesanan Dibatalkan</Text>
            <Text className="text-sm text-gray-600 text-center leading-relaxed">
              Alasan: {transaction.rejection_reason || 'Dibatalkan oleh kasir / depot tutup.'}
            </Text>
          </View>
        )}
        {transaction?.order_status === 'confirmed' && transaction?.payment_status === 'unpaid' && (
          <View className="bg-white m-4 p-8 rounded-3xl items-center border border-green-100 shadow-sm">
            <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-4">
              <Receipt size={32} color="#16A34A" />
            </View>
            <Text className="text-xl font-black text-green-600 text-center mb-2">Pesanan Diterima!</Text>
            <Text className="text-sm text-gray-500 text-center leading-relaxed px-4 mb-6">
              Kasir telah menyetujui pesanan Anda. Silakan selesaikan pembayaran agar dapur dapat mulai memasak.
            </Text>
            <TouchableOpacity 
              onPress={() => Linking.openURL(transaction.midtrans_url)}
              className="bg-bakso-primary w-full py-4 rounded-2xl items-center shadow-sm"
            >
              <Text className="text-white font-black text-base">Bayar Rp {transaction.grand_total.toLocaleString('id-ID')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {transaction?.order_status === 'cooking' && (
          <View className="bg-white m-4 p-8 rounded-3xl items-center border border-amber-100 shadow-sm">
            <View className="w-16 h-16 bg-amber-50 rounded-full items-center justify-center mb-4">
              <ChefHat size={32} color="#D97706" />
            </View>
            <Text className="text-xl font-black text-amber-600 text-center mb-2">Sedang Dimasak!</Text>
            <Text className="text-sm text-gray-500 text-center leading-relaxed px-4">
              Pembayaran berhasil. Koki kami sedang menyiapkan hidangan lezat Anda.
            </Text>
          </View>
        )}
        <View className="bg-white mx-4 p-5 rounded-3xl border border-gray-100 mb-8">
          <Text className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-3">Daftar Pesanan</Text>
          {transaction?.transaction_items?.map((item: any) => (
            <View key={item.id} className="flex-row justify-between mb-3">
              <View className="flex-row flex-1 mr-4">
                <Text className="font-bold text-gray-800 mr-2">{item.quantity}x</Text>
                <View>
                  <Text className="text-sm font-medium text-gray-800">{item.menu?.name}</Text>
                  {item.is_half_portion && <Text className="text-xs text-gray-500">1/2 Porsi</Text>}
                </View>
              </View>
              <Text className="text-sm font-bold text-gray-800">
                Rp {(item.price_at_time * item.quantity).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
          <View className="h-px bg-gray-100 my-2" />
          <View className="flex-row justify-between">
            <Text className="font-bold text-gray-800">Sub Total</Text>
            <Text className="font-semibold text-gray-800">Rp {transaction?.subtotal?.toLocaleString('id-ID')}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-bold text-gray-800">Total Pajak</Text>
            <Text className="font-semibold text-bakso-secondary">Rp {transaction?.tax_amount?.toLocaleString('id-ID')}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-bold text-gray-800">Total Pembayaran</Text>
            <Text className="font-black text-bakso-primary">Rp {transaction?.grand_total?.toLocaleString('id-ID')}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}