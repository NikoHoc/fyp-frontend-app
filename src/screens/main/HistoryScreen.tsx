import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { AuthContext } from '../../context/AuthContext';
import LoginReminder from '../../components/auth/LoginReminder';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react-native';
import { useCustomerTransaction } from '@/hooks/useCustomerTransaction'; // 💡 Import hook baru
import { supabaseRealtime } from '@/config/supabaseClient';

type FilterStatus = 'Semua' | 'Berjalan' | 'Selesai' | 'Dibatalkan';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useContext(AuthContext);
  const { fetchTransactions } = useCustomerTransaction(); // 💡 Menggunakan Hook
  
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('Semua');
  const [orders, setOrders] = useState<any[]>([]);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filterTabs: FilterStatus[] = ['Semua', 'Berjalan', 'Selesai', 'Dibatalkan'];

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchTransactions();
    
    if (data) {
      const mappedOrders = data.map((trx: any) => {
        let badgeStatus: FilterStatus = 'Berjalan';
        if (trx.order_status === 'completed') badgeStatus = 'Selesai';
        if (trx.order_status === 'cancelled') badgeStatus = 'Dibatalkan';

        return {
          id: trx.id,
          displayId: `ONLINE-${trx.id.split('-')[0].toUpperCase()}`, // 💡 Perbaikan ONLINE-
          depotName: trx.depot?.name || 'Depot Bakso Asli',
          date: new Date(trx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          rawDate: new Date(trx.created_at).getTime(),
          total: trx.grand_total,
          itemsCount: trx.transaction_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
          status: badgeStatus,
          rawStatus: trx.order_status
        };
      });

      const sortedOrders = mappedOrders.sort((a: any, b: any) => {
        if (a.status === 'Berjalan' && b.status !== 'Berjalan') return -1;
        if (a.status !== 'Berjalan' && b.status === 'Berjalan') return 1;
        return b.rawDate - a.rawDate; 
      });

      setOrders(sortedOrders);
    }
    
    setIsScreenLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      if (user) loadHistory();
    }, [user, loadHistory])
  );

  // 💡 Realtime: Mendeteksi pesanan baru atau perubahan status milik user ini
  useEffect(() => {
    if (!user) return;
    const channel = supabaseRealtime
      .channel(`history_user_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions', 
        filter: `customer_id=eq.${user.id}` 
      }, () => {
        loadHistory(); 
      })
      .subscribe();

    return () => { supabaseRealtime.removeChannel(channel); };
  }, [user, loadHistory]);

  const filteredOrders = activeFilter === 'Semua' ? orders : orders.filter(order => order.status === activeFilter);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Berjalan': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: <Clock size={12} color="#D97706" /> };
      case 'Selesai': return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', icon: <CheckCircle2 size={12} color="#16A34A" /> };
      default: return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', icon: <XCircle size={12} color="#DC2626" /> };
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="bg-white border-b border-gray-100 px-6 py-5 shadow-sm">
        <Text className="text-2xl font-black text-gray-800">Pesanan Saya</Text>
      </View>

      {!user ? (
        <View className="flex-1">
          <LoginReminder message="Silakan login untuk memantau status pesanan aktif dan riwayat transaksi Anda." />
        </View>
      ) : (
        <>
          <View className="bg-white py-3 border-b border-gray-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              {filterTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  className={`mr-2.5 px-5 py-2.5 rounded-xl border ${activeFilter === tab ? 'bg-bakso-primary border-bakso-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`font-bold text-xs ${activeFilter === tab ? 'text-white' : 'text-gray-500'}`}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isScreenLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#DC2626" />
            </View>
          ) : (
            <ScrollView 
              className="flex-1 px-4 pt-4" 
              contentContainerStyle={{ paddingBottom: 40 }} 
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} colors={['#DC2626']} />}
            >
              {filteredOrders.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <ClipboardList size={48} color="#D1D5DB" />
                  <Text className="text-gray-400 font-bold mt-4">Tidak ada pesanan ditemukan</Text>
                </View>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeStyle(order.status);
                  return (
                    <TouchableOpacity 
                      key={order.id} 
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('OrderTrackingScreen', { transactionId: order.id })}
                      className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm"
                    >
                      <View className="flex-row justify-between items-center border-b border-gray-50 pb-3 mb-3">
                        <View>
                          <Text className="text-xs font-black text-gray-400 tracking-wider">{order.displayId}</Text>
                          <Text className="text-[11px] font-medium text-gray-400 mt-0.5">{order.date}</Text>
                        </View>
                        <View className={`flex-row items-center px-2.5 py-1 rounded-lg border ${badge.bg} ${badge.border}`}>
                          {badge.icon}
                          <Text className={`text-[10px] font-black uppercase ml-1 ${badge.text}`}>{order.status}</Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center mb-2">
                        <View>
                          <Text className="text-base font-black text-gray-800">{order.depotName}</Text>
                          <Text className="text-xs font-medium text-gray-400 mt-1">{order.itemsCount} Item Menu</Text>
                        </View>
                        <ChevronRight size={20} color="#D1D5DB" />
                      </View>

                      <View className="flex-row justify-between items-center pt-3 border-t border-gray-50 mt-2">
                        <Text className="text-xs font-bold text-gray-400 uppercase">Total Transaksi</Text>
                        <Text className="text-base font-black text-bakso-primary">Rp {order.total.toLocaleString('id-ID')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}