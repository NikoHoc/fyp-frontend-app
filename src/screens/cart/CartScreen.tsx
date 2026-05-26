import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Trash2, Plus, Minus, Store, Bike, AlertCircle, ShoppingBag, MapPin } from 'lucide-react-native';
import { CartContext } from '@/context/CartContext';
import { RootStackParamList } from '@/types/navigation';
import { CartItem } from '@/types';
import { useDepotDetail } from '@/hooks/useDepotDetail';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { cart, updateItem, isLoading, fetchCart, checkout } = useContext(CartContext);
  const { depot, isLoading: isDepotLoading } = useDepotDetail(cart?.depot_id ?? 0);

  const [pickupMethod, setPickupMethod] = useState<'self_pickup' | 'self_courier'>('self_pickup');

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="absolute bg-white shadow-sm w-10 h-10 rounded-full items-center justify-center left-4"
          style={{ top: Math.max(insets.top, 16) }}
        >
          <ChevronLeft size={24} color="#1F2937" style={{ marginRight: 2 }} />
        </TouchableOpacity>
        
        <View className="bg-red-50 p-6 rounded-full mb-4">
          <ShoppingBag size={64} color="#DC2626" />
        </View>
        <Text className="text-xl font-black text-gray-800 mb-2">Keranjang Kosong</Text>
        <Text className="text-sm text-gray-500 text-center px-10 mb-8">
          Anda belum menambahkan menu apapun ke dalam keranjang.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-bakso-primary px-8 py-3.5 rounded-2xl active:bg-red-700"
        >
          <Text className="text-white font-black text-base">Mulai Pesan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleIncrease = (item: CartItem) => {
    updateItem(cart.depot_id, item.menu_id, item.quantity + 1, item.is_half_portion, item.note || '', item.id);
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
      updateItem(cart.depot_id, item.menu_id, item.quantity - 1, item.is_half_portion, item.note || '', item.id);
    }
  };

  const handleRemove = (item: CartItem) => {
    Alert.alert(
      "Hapus Item",
      `Apakah Anda yakin ingin menghapus ${item.name} dari keranjang?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: () => updateItem(cart.depot_id, item.menu_id, 0, item.is_half_portion, item.note || '', item.id) 
        }
      ]
    );
  };

  const handleCheckout = async () => {
    Alert.alert(
      "Kirim Pesanan",
      "Apakah Anda yakin ingin mengirim pesanan ini ke kasir?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Kirim",
          onPress: async () => {
            const response = await checkout(pickupMethod);
            
            if (response.success && response.transaction_id) {
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Main' },
                  { name: 'OrderTrackingScreen', params: { transactionId: response.transaction_id } }
                ],
              });
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center relative shadow-sm z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 active:bg-gray-100"
        >
          <ChevronLeft size={24} color="#1F2937" style={{ marginRight: 2 }} />
        </TouchableOpacity>
        <View className="absolute left-0 right-0 items-center" style={{ zIndex: -1 }}>
          <Text className="text-lg font-black text-gray-800">Keranjang Pesanan</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchCart} colors={['#DC2626']} />}
      >
        {depot && (
          <View className="bg-white px-5 py-4 mb-3 border-b border-gray-100 shadow-sm flex-row items-center">
            <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mr-4">
              <Store size={24} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Memesan Dari</Text>
              <Text className="text-base font-black text-gray-800">{depot.name}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1.5 flex-1 leading-tight" numberOfLines={2}>
                  {depot.address}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View className="bg-white px-4 py-5 mb-4 border-y border-gray-100 shadow-sm">
          <Text className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Detail Pesanan</Text>
          {cart.items.map((item, index) => (
            <View key={item.id} className={`py-4 flex-row gap-3 ${index !== cart.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Image 
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
                className="w-[72px] h-[72px] rounded-xl bg-gray-100"
                resizeMode="cover"
              />
              <View className="flex-1 justify-center">
                <Text className="text-sm font-bold text-gray-800">{item.name}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.is_half_portion ? '1/2 Porsi' : 'Porsi Utuh'}
                </Text>
                {item.note ? (
                  <Text className="text-xs font-bold text-amber-500 mt-0.5" numberOfLines={2}>
                    Catatan: {item.note}
                  </Text>
                ) : null}
                <Text className="text-sm font-black text-bakso-primary mt-1">
                  Rp {item.price.toLocaleString('id-ID')}
                </Text>
              </View>
              <View className="items-end justify-between">
                <TouchableOpacity 
                  onPress={() => handleRemove(item)}
                  className="w-8 h-8 items-center justify-center rounded-lg bg-red-50 border border-red-200 active:bg-red-100"
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>

                <View className="flex-row items-center border border-gray-200 bg-gray-50 rounded-xl p-0.5">
                  <TouchableOpacity 
                    onPress={() => handleDecrease(item)}
                    className="w-7 h-7 items-center justify-center rounded-lg bg-white border border-gray-100 active:bg-gray-100"
                  >
                    <Minus size={12} color={item.quantity <= 1 ? '#D1D5DB' : '#4B5563'} />
                  </TouchableOpacity>
                  
                  <Text className="text-sm font-black text-gray-800 w-8 text-center">
                    {item.quantity}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => handleIncrease(item)}
                    className="w-7 h-7 items-center justify-center rounded-lg bg-white border border-gray-100 active:bg-gray-100"
                  >
                    <Plus size={12} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View className="bg-white px-4 py-5 mb-4 border-y border-gray-100 shadow-sm">
          <Text className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Metode Pengambilan</Text>
          
          <TouchableOpacity 
            onPress={() => setPickupMethod('self_pickup')}
            className={`flex-row items-center p-4 rounded-2xl border mb-3 ${pickupMethod === 'self_pickup' ? 'bg-red-50/50 border-bakso-primary' : 'bg-white border-gray-200'}`}
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${pickupMethod === 'self_pickup' ? 'bg-bakso-primary' : 'bg-gray-100'}`}>
              <Store size={20} color={pickupMethod === 'self_pickup' ? '#FFF' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className={`font-black text-base ${pickupMethod === 'self_pickup' ? 'text-bakso-primary' : 'text-gray-800'}`}>Ambil Sendiri</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Datang langsung ke depot untuk mengambil</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setPickupMethod('self_courier')}
            className={`flex-row items-center p-4 rounded-2xl border ${pickupMethod === 'self_courier' ? 'bg-red-50/50 border-bakso-primary' : 'bg-white border-gray-200'}`}
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${pickupMethod === 'self_courier' ? 'bg-bakso-primary' : 'bg-gray-100'}`}>
              <Bike size={20} color={pickupMethod === 'self_courier' ? '#FFF' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className={`font-black text-base ${pickupMethod === 'self_courier' ? 'text-bakso-primary' : 'text-gray-800'}`}>Pesan Kurir Sendiri</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Pesan Gojek/Grab secara mandiri</Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row bg-amber-50 p-3 rounded-xl mt-4 border border-amber-100">
            <AlertCircle size={16} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className="text-xs text-amber-800 flex-1 leading-relaxed">
              Mohon maaf, untuk saat ini depot tidak menyediakan jasa pengiriman mandiri dari kami.
            </Text>
          </View>
        </View>
        <View className="bg-white px-4 py-5 border-y border-gray-100 shadow-sm">
          <Text className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Rincian Pembayaran</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500">Subtotal ({cart.total_items} item)</Text>
            <Text className="text-sm font-bold text-gray-800">Rp {cart.subtotal?.toLocaleString('id-ID')}</Text>
          </View>
          
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm text-gray-500">Pajak (10%)</Text>
            <Text className="text-sm font-bold text-gray-800">Rp {cart.tax_amount?.toLocaleString('id-ID')}</Text>
          </View>

          <View className="h-px bg-gray-100 w-full mb-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-black text-gray-800">Total Pembayaran</Text>
            <Text className="text-xl font-black text-bakso-primary">Rp {cart.grand_total?.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </ScrollView>
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity 
          onPress={handleCheckout}
          disabled={isLoading}
          className="bg-bakso-primary w-full p-4 rounded-2xl flex-row items-center justify-between active:bg-red-700"
        >
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
               <ActivityIndicator color="#FFF" />
            </View>
          ) : (
            <>
              <View>
                <Text className="text-white text-xs font-bold opacity-90">Kirim Pesanan ke Kasir</Text>
                <Text className="text-white text-lg font-black mt-0.5">Rp {cart.grand_total?.toLocaleString('id-ID')}</Text>
              </View>
              <View className="bg-white/20 px-4 py-2.5 rounded-xl">
                <Text className="text-white font-black text-sm">Checkout</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}