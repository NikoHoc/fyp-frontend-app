import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Plus, X, Edit2 } from 'lucide-react-native';
import { Menu, CartItem } from '@/types'; 

interface Props {
  isVisible: boolean;
  onClose: () => void;
  menu: Menu | null;
  existingItems: CartItem[]; 
  onEditVariant: (item: CartItem) => void;
  onAddNewVariant: () => void;
}

export default function MenuVariantModal({ isVisible, onClose, menu, existingItems, onEditVariant, onAddNewVariant }: Props) {
  if (!menu) return null;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />
        
        <View className="bg-white rounded-t-3xl p-5 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-black text-gray-800">{menu.name}</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <X size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Pesanan Anda Sebelumnya</Text>
          
          <ScrollView className="max-h-60 mb-4" showsVerticalScrollIndicator={false}>
            {existingItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => onEditVariant(item)}
                className="flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-100 active:bg-gray-100"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-base font-bold text-gray-800">
                    {item.quantity}x {item.is_half_portion ? '1/2 Porsi' : 'Porsi Utuh'}
                  </Text>
                  {item.note ? (
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>Catatan: {item.note}</Text>
                  ) : null}
                  <Text className="text-sm font-black text-bakso-primary mt-1">Rp {item.price.toLocaleString('id-ID')}</Text>
                </View>
                <View className="bg-white p-2 rounded-xl shadow-sm">
                  <Edit2 size={16} color="#DC2626" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            onPress={onAddNewVariant}
            className="w-full py-4 rounded-2xl flex-row justify-center items-center bg-bakso-primary active:bg-red-700"
          >
            <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text className="text-white font-black text-base">Buat Pesanan Baru</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}