import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Menu } from '@/types';
import { CartContext } from '@/context/CartContext';
import { useContext } from 'react';

interface MenuCardProps {
  menu: Menu;
  onPress: () => void;
  isDepotOpen: boolean;
  depotId: number;
}

export default function MenuCard({ menu, onPress, isDepotOpen, depotId }: MenuCardProps) {
  const notAvailable = !isDepotOpen || !menu.is_available;

  const { getItemQuantity } = useContext(CartContext);
  
  const currentQty = getItemQuantity(menu.id, depotId);

  return (
    <TouchableOpacity 
      onPress={() => onPress()}
      disabled={notAvailable}
      activeOpacity={0.7}
      className={`flex-row bg-white p-4 mb-3 rounded-2xl border ${notAvailable ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}
    >
      <View className="w-20 h-20 bg-gray-100 rounded-xl mr-4 overflow-hidden items-center justify-center">
        {menu.image_url ? (
          <Image source={{ uri: menu.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-[10px] text-gray-400">No Image</Text>
        )}
      </View>

      <View className=" flex-1 justify-center">
        <Text className="text-base font-bold text-gray-800 mb-1">{menu.name}</Text>
        <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>
          {menu.description || "-"}
        </Text>
        <Text className="text-sm font-black text-bakso-primary">
          Rp {menu.price.toLocaleString('id-ID')}
        </Text>
      </View>

      <View className="absolute bottom-3 right-3">
        {currentQty > 0 ? (
          <View className="bg-bakso-primary rounded-full min-w-[32px] h-8 px-2 items-center justify-center shadow-sm">
            <Text className="text-white text-xs font-black">{currentQty}</Text>
          </View>
        ) : (
          <View className="bg-red-50 rounded-full w-8 h-8 items-center justify-center border border-red-100">
            <Plus size={16} color="#DC2626" />
          </View>
        )}
      </View>
      {notAvailable && (
        <View className="absolute top-4 right-4 bg-gray-300 px-2 py-1 rounded">
          <Text className="text-[10px] font-bold text-white">HABIS</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}