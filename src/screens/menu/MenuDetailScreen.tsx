import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, MessageSquare } from 'lucide-react-native';
import { CartContext } from '../../context/CartContext';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '@/types/navigation';

export default function MenuDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  // const route = useRoute<any>();
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { menu, depotId, mode, existingItem } = route.params;
  const { updateItem, clearCartAndRetry, isLoading } = useContext(CartContext);

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

  const hasHalfPortion = menu.half_price != null && menu.half_price > 0;
  const pricePerItem = hasHalfPortion && isHalfPortion ? menu.half_price : menu.price;
  const totalPrice = pricePerItem * quantity;

  const handleMinus = () => {
    const minQty = mode === 'edit' ? 0 : 1;
    if (quantity > minQty) setQuantity(quantity - 1);
  };

  const handlePlus = () => setQuantity(quantity + 1);

  const handleActionCart = async () => {
    const cartItemId = mode === 'edit' ? existingItem?.id : undefined;
    const finalHalfPortion = hasHalfPortion ? isHalfPortion : false;
    
    const result = await updateItem(depotId, menu.id, quantity, finalHalfPortion, note, cartItemId);

    if (result.success) {
      navigation.goBack();
      return;
    }

    if (result.conflict) {
      Alert.alert(
        'Pindah Cabang?',
        'Anda memiliki pesanan di cabang lain. Ingin menghapus keranjang lama dan memesan dari cabang ini?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Ya, Hapus & Ganti',
            style: 'destructive',
            onPress: async () => {
              const retryResult = await clearCartAndRetry(
                depotId,
                menu.id,
                quantity,
                isHalfPortion,
                note,
                cartItemId
              );
              if (retryResult.success) {
                navigation.goBack();
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert('Error', 'Gagal memperbarui keranjang. Silakan coba lagi.');
  };

  const getButtonConfig = () => {
    if (quantity === 0)
      return { text: 'Hapus dari Keranjang', bgClass: 'bg-red-600 active:bg-red-700' };
    if (mode === 'edit')
      return { text: 'Simpan Perubahan', bgClass: 'bg-amber-500 active:bg-amber-600' };
    return { text: 'Tambah Pesanan', bgClass: 'bg-bakso-primary active:bg-red-700' };
  };

  const buttonConfig = getButtonConfig();

  return (
    <View className="flex-1 bg-white">
      <View className="relative h-80 w-full bg-gray-100">
        <Image
          source={{ uri: menu.image_url || 'https://via.placeholder.com/300' }}
          className="h-full w-full"
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/40"
          style={{ top: Math.max(insets.top, 16) }}>
          <ChevronLeft size={24} color="#FFF" style={{ marginRight: 2 }} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-2xl font-black text-gray-800">{menu.name}</Text>
            <Text className="mt-1 text-lg font-black text-bakso-primary">
              Rp {menu.price.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <View className="mt-4 border-b border-gray-100 pb-4">
          <Text className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Deskripsi Menu
          </Text>
          <Text className="mt-1 text-sm leading-relaxed text-gray-500">
            {menu.description || 'Tidak ada deskripsi untuk hidangan ini.'}
          </Text>
        </View>

        <View className="mt-5 border-b border-gray-100 pb-5">
          <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
            Pilihan Porsi
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsHalfPortion(false)}
              className={`flex-1 items-center rounded-2xl border p-4 ${!isHalfPortion ? 'border-bakso-primary bg-red-50/50' : 'border-gray-200 bg-white'}`}>
              <Text
                className={`text-sm font-black ${!isHalfPortion ? 'text-bakso-primary' : 'text-gray-600'}`}>
                Porsi Utuh
              </Text>
              <Text className="mt-0.5 text-xs text-gray-400">
                Rp {menu.price.toLocaleString('id-ID')}
              </Text>
            </TouchableOpacity>
            {hasHalfPortion && (
              <TouchableOpacity
                onPress={() => setIsHalfPortion(true)}
                className={`flex-1 items-center rounded-2xl border p-4 ${isHalfPortion ? 'border-bakso-primary bg-red-50/50' : 'border-gray-200 bg-white'}`}>
                <Text
                  className={`text-sm font-black ${isHalfPortion ? 'text-bakso-primary' : 'text-gray-600'}`}>
                  1/2 Porsi
                </Text>
                <Text className="mt-0.5 text-xs text-gray-400">
                  Rp {menu.half_price.toLocaleString('id-ID')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="mb-10 mt-5">
          <View className="mb-2 flex-row items-center gap-1.5">
            <MessageSquare size={16} color="#9CA3AF" />
            <Text className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Catatan Khusus
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Kuah dipisah, tanpa seledri..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            className="h-20 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-black outline-none focus:border-gray-300"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      <View
        className="flex-row items-center gap-4 border-t border-gray-100 bg-white p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="h-14 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
          <TouchableOpacity
            onPress={handleMinus}
            className="h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm active:bg-gray-100">
            <Minus size={16} color={quantity === 0 ? '#DC2626' : '#4B5563'} />
          </TouchableOpacity>

          <Text className="w-12 text-center text-base font-black text-gray-800">{quantity}</Text>

          <TouchableOpacity
            onPress={handlePlus}
            className="h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm active:bg-gray-100">
            <Plus size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleActionCart}
          disabled={isLoading}
          className={`h-14 flex-1 flex-row items-center justify-between rounded-2xl px-5 ${buttonConfig.bgClass}`}>
          {isLoading ? (
            <View className="w-full items-center justify-center">
              <ActivityIndicator color="#FFF" size="small" />
            </View>
          ) : (
            <>
              <Text className="text-base font-black text-white">{buttonConfig.text}</Text>
              {quantity > 0 && (
                <Text className="text-sm font-black text-white opacity-90">
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