import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, MessageSquare } from 'lucide-react-native';
import { CartContext } from '../../context/CartContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

export default function MenuDetailScreen({ route, navigation }: any) {
//   const route = useRoute<any>();
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const { menu, depotId, mode, existingItem } = route.params;
  const { updateItem, isLoading } = useContext(CartContext);

  const [isHalfPortion, setIsHalfPortion] = useState(false);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (mode === 'edit' && existingItem) {
      setIsHalfPortion(existingItem.is_half_portion);
      setQuantity(existingItem.quantity);
      setNote(existingItem.note || '');
    } else {
      setIsHalfPortion(false);
      setQuantity(1);
      setNote('');
    }
  }, []);

  const pricePerItem = isHalfPortion ? menu.price / 2 : menu.price;
  const totalPrice = pricePerItem * quantity;

  const handleMinus = () => {
    const minQty = mode === 'edit' ? 0 : 1; 
    if (quantity > minQty) {
      setQuantity(quantity - 1);
    }
  };

  const handlePlus = () => {
    setQuantity(quantity + 1);
  };

  const handleActionCart = async () => {
    const cartItemId = mode === 'edit' ? existingItem?.id : undefined;
    
    const finalHalfPortion = menu.has_half_portion ? isHalfPortion : false;

    const success = await updateItem(depotId, menu.id, quantity, finalHalfPortion, note, cartItemId);
    
    if (success) {
      navigation.goBack(); 
    }
  };

  const getButtonConfig = () => {
    if (quantity === 0) return { text: 'Hapus dari Keranjang', bgClass: 'bg-red-600 active:bg-red-700' };
    if (mode === 'edit') return { text: 'Simpan Perubahan', bgClass: 'bg-amber-500 active:bg-amber-600' };
    return { text: 'Tambah Pesanan', bgClass: 'bg-bakso-primary active:bg-red-700' };
  };

  const buttonConfig = getButtonConfig();

  return (
    <View className="flex-1 bg-white">
      <View className="relative w-full h-80 bg-gray-100">
        <Image 
          source={{ uri: menu.image_url || 'https://via.placeholder.com/300' }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="absolute bg-black/40 w-10 h-10 rounded-full items-center justify-center left-4"
          style={{ top: Math.max(insets.top, 16) }}
        >
          <ChevronLeft size={24} color="#FFF" style={{ marginRight: 2 }} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-2xl font-black text-gray-800">{menu.name}</Text>
            <Text className="text-lg font-black text-bakso-primary mt-1">
              Rp {menu.price.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Deskripsi */}
        <View className="mt-4 border-b border-gray-100 pb-4">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Deskripsi Menu</Text>
          <Text className="text-sm text-gray-500 mt-1 leading-relaxed">
            {menu.description || 'Tidak ada deskripsi untuk hidangan ini.'}
          </Text>
        </View>

        {/* 💡 OPSI PORSI: Hanya muncul jika menu.has_half_portion bernilai true atau tidak didefinisikan (default true) */}
        {menu.has_half_portion !== false && (
          <View className="mt-5 border-b border-gray-100 pb-5">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Pilihan Porsi</Text>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsHalfPortion(false)}
                className={`flex-1 p-4 rounded-2xl border items-center ${!isHalfPortion ? 'border-bakso-primary bg-red-50/50' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`font-black text-sm ${!isHalfPortion ? 'text-bakso-primary' : 'text-gray-600'}`}>Porsi Utuh</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Rp {menu.price.toLocaleString('id-ID')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsHalfPortion(true)}
                className={`flex-1 p-4 rounded-2xl border items-center ${isHalfPortion ? 'border-bakso-primary bg-red-50/50' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`font-black text-sm ${isHalfPortion ? 'text-bakso-primary' : 'text-gray-600'}`}>1/2 Porsi</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Rp {(menu.price / 2).toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Catatan Tambahan */}
        <View className="mt-5 mb-10">
          <View className="flex-row items-center gap-1.5 mb-2">
            <MessageSquare size={16} color="#9CA3AF" />
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Catatan Khusus</Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Kuah dipisah, tanpa seledri..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            className="text-black bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium h-20 outline-none focus:border-gray-300"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      <View 
        className="bg-white border-t border-gray-100 p-4 flex-row items-center gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center border border-gray-200 bg-gray-50 rounded-2xl p-1 h-14">
          <TouchableOpacity 
            onPress={handleMinus}
            className="w-10 h-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 active:bg-gray-100"
          >
            <Minus size={16} color={quantity === 0 ? '#DC2626' : '#4B5563'} />
          </TouchableOpacity>
          
          <Text className="text-base font-black text-gray-800 w-12 text-center">
            {quantity}
          </Text>
          
          <TouchableOpacity 
            onPress={handlePlus}
            className="w-10 h-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 active:bg-gray-100"
          >
            <Plus size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleActionCart}
          disabled={isLoading}
          className={`flex-1 h-14 rounded-2xl flex-row items-center justify-between px-5 ${buttonConfig.bgClass}`}
        >
          {isLoading ? (
            <View className="w-full items-center justify-center">
              <ActivityIndicator color="#FFF" size="small" />
            </View>
          ) : (
            <>
              <Text className="text-white font-black text-base">
                {buttonConfig.text}
              </Text>
              {quantity > 0 && (
                <Text className="text-white font-black text-sm opacity-90">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}