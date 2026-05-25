import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Linking, RefreshControl } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Receipt, ChefHat, MapPin, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { supabaseRealtime } from '@/config/supabaseClient';
import { useCustomerTransaction } from '@/hooks/useCustomerTransaction'; 

export default function OrderTrackingScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  
  const { transactionId } = route.params;
  const { fetchTransactionDetail } = useCustomerTransaction();

  const [transaction, setTransaction] = useState<any>(null);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDetail = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchTransactionDetail(transactionId);
    if (data) setTransaction(data);
    setIsScreenLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [transactionId, fetchTransactionDetail]);

  useEffect(() => {
    loadDetail();

    const channel = supabaseRealtime
      .channel(`tracking_${transactionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'transactions', 
        filter: `id=eq.${transactionId}` 
      }, () => {
        loadDetail(); 
      })
      .subscribe();

    return () => { supabaseRealtime.removeChannel(channel); };
  }, [transactionId, loadDetail]);

  if (isScreenLoading && !transaction) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#DC2626" />
        <Text className="mt-4 text-gray-500 font-medium">Memuat pesanan Anda...</Text>
      </View>
    );
  }

  const steps = ['pending', 'confirmed', 'cooking', 'ready', 'completed'];
  const currentStepIndex = steps.indexOf(transaction?.order_status);
  const isCancelled = transaction?.order_status === 'cancelled';

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center relative shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="absolute left-0 right-0 items-center" style={{ zIndex: -1 }}>
          <Text className="text-lg font-black text-gray-800">Status Pesanan</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDetail(true)} colors={['#DC2626']} />}
      >
        <View className="bg-white px-5 py-4 border-b border-gray-100 mb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lokasi Pemesanan</Text>
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3">
              <MapPin size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-gray-800">{transaction?.depot?.name || 'Depot Bakso Asli'}</Text>
              <Text className="text-xs font-medium text-gray-500 mt-0.5">{transaction?.depot?.address || 'Alamat tidak tersedia'}</Text>
            </View>
          </View>
        </View>

        <View className="bg-white m-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {isCancelled ? (
             <View className="p-8 items-center bg-red-50">
               <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4">
                 <XCircle size={32} color="#DC2626" />
               </View>
               <Text className="text-xl font-black text-red-600 text-center mb-2">Pesanan Dibatalkan</Text>
               <Text className="text-sm text-gray-600 text-center leading-relaxed">
                 Alasan: {transaction.rejection_reason || 'Dibatalkan oleh kasir.'}
               </Text>
             </View>
          ) : (
            <>
              <View className="flex-row justify-between items-center px-6 py-6 border-b border-gray-50">
                {[
                  { id: 'pending', icon: Clock },
                  { id: 'confirmed', icon: Receipt },
                  { id: 'cooking', icon: ChefHat },
                  { id: 'ready', icon: ShoppingBag },
                  { id: 'completed', icon: CheckCircle2 }
                ].map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <React.Fragment key={step.id}>
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${isActive ? 'bg-bakso-primary' : 'bg-gray-100'} ${isCurrent ? 'border-4 border-red-100' : ''}`}>
                        <Icon size={18} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                      </View>
                      {idx < 4 && (
                        <View className={`flex-1 h-1 mx-1 rounded-full ${currentStepIndex > idx ? 'bg-bakso-primary' : 'bg-gray-100'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              <View className="p-6 items-center">
                {transaction?.order_status === 'pending' && (
                  <>
                    <Text className="text-lg font-black text-gray-800 text-center mb-2">Menunggu Kasir</Text>
                    <Text className="text-sm text-gray-500 text-center">Pesanan telah dikirim ke depot. Mohon tunggu konfirmasi.</Text>
                  </>
                )}
                {transaction?.order_status === 'confirmed' && transaction?.payment_status === 'unpaid' && (
                  <>
                    <Text className="text-lg font-black text-gray-800 text-center mb-2">Pesanan Diterima!</Text>
                    <Text className="text-sm text-gray-500 text-center mb-5">Silakan selesaikan pembayaran agar pesanan dapat dimasak.</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(transaction.midtrans_url)} className="bg-bakso-primary w-full py-4 rounded-2xl items-center shadow-sm">
                      <Text className="text-white font-black text-base">Bayar Rp {transaction.grand_total.toLocaleString('id-ID')}</Text>
                    </TouchableOpacity>
                  </>
                )}
                {transaction?.order_status === 'cooking' && (
                  <>
                    <Text className="text-lg font-black text-amber-600 text-center mb-2">Sedang Dimasak</Text>
                    <Text className="text-sm text-gray-500 text-center">Koki kami sedang menyiapkan hidangan lezat Anda secara higienis.</Text>
                  </>
                )}
                {transaction?.order_status === 'ready' && (
                  <>
                    <Text className="text-lg font-black text-green-600 text-center mb-2">Pesanan Siap!</Text>
                    <Text className="text-sm text-gray-500 text-center">Pesanan Anda sudah matang dan siap untuk diambil / diantar.</Text>
                  </>
                )}
                {transaction?.order_status === 'completed' && (
                  <>
                    <Text className="text-lg font-black text-blue-600 text-center mb-2">Pesanan Selesai</Text>
                    <Text className="text-sm text-gray-500 text-center">Terima kasih telah memesan di Depot Bakso Asli!</Text>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        <View className="bg-white mx-4 p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm">
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
              <Text className="text-sm font-bold text-gray-800">Rp {(item.price_at_time * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
          ))}
          <View className="h-px bg-gray-100 my-2" />
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-gray-500 font-medium text-sm">Sub Total</Text>
            <Text className="font-bold text-gray-800 text-sm">Rp {transaction?.subtotal?.toLocaleString('id-ID')}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-500 font-medium text-sm">Total Pajak</Text>
            <Text className="font-bold text-gray-800 text-sm">Rp {transaction?.tax_amount?.toLocaleString('id-ID')}</Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <Text className="font-black text-gray-800 text-base">Total Pembayaran</Text>
            <Text className="font-black text-bakso-primary text-lg">Rp {transaction?.grand_total?.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        <View className="bg-white mx-4 p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm">
          <Text className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-3">Detail Transaksi</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">ID Transaksi</Text>
              <Text className="text-sm font-bold text-gray-800">#ONLINE-{transaction?.id?.split('-')[0].toUpperCase()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Waktu Pemesanan</Text>
              <Text className="text-sm font-bold text-gray-800">{new Date(transaction?.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Metode Pengambilan</Text>
              <Text className="text-sm font-bold text-gray-800 capitalize">
                {transaction?.pickup_method === 'self_courier' ? 'Pesan Kurir Sendiri' : 'Ambil Sendiri'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}