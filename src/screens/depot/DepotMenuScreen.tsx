import React, { useState, useMemo, useContext, useCallback } from 'react';
import {
  View, Text, SectionList, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { useMenus } from '@/hooks/useMenus';
import MenuCard from '@/components/menus/MenuCard';
import LoginReminderModal from '@/components/auth/LoginReminderModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useDepotDetail } from '@/hooks/useDepotDetail';
import DepotInfoCard from '@/components/depots/DepotInfoCard';
import { CartContext } from '@/context/CartContext';
import MenuVariantModal from '@/components/menus/MenuVariantModal';
import { Menu } from '@/types';

export default function DepotMenuScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { depotId, depotName } = route.params;
  const { cart, fetchCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { menus, categories, isLoading: isMenusLoading, refetch: refetchMenus } = useMenus(depotId);
  const { depot, isLoading: isDepotLoading } = useDepotDetail(depotId);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Fetch cart setiap kali screen ini aktif kembali (termasuk setelah goBack dari MenuDetailScreen).
  // Ini yang memastikan setCart tidak dipanggil pada komponen yang sudah unmount.
  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'pelanggan') {
        fetchCart();
      }
    }, [user, fetchCart])
  );

  const filteredData = useMemo(() => {
    const filteredMenu = menus.filter((menu) => {
      const categoryName = menu.categories?.name || 'Lainnya';
      const matchesSearch = menu.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCat === 'Semua' || categoryName === selectedCat;
      return matchesSearch && matchesCat;
    });

    const groups = filteredMenu.reduce((acc: any, menu: any) => {
      const catName = menu.categories?.name || 'Lainnya';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(menu);
      return acc;
    }, {});

    return Object.keys(groups).map((title) => ({ title, data: groups[title] }));
  }, [menus, search, selectedCat]);

  const handleMenuClick = (menu: Menu) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const existingVariants = cart?.items?.filter(i => i.menu_id === menu.id) || [];
    if (existingVariants.length > 0 && cart?.depot_id === Number(depotId)) {
      setSelectedMenu(menu);
      setIsVariantModalOpen(true);
    } else {
      navigation.navigate('MenuDetailScreen', { menu, depotId: Number(depotId), mode: 'add' });
    }
  };

  const hasActiveCartHere =
    cart && cart.depot_id === Number(depotId) && cart.total_items && cart.total_items > 0;

  if (isDepotLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator className="mt-10" size="large" color="#DC2626" />
        <Text className="text-gray-400">Memuat data depot</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-gray-100 px-4 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="-ml-2 p-2">
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="ml-2 text-lg font-black text-gray-800" numberOfLines={1}>
          {depotName}
        </Text>
      </View>

      <View className="z-10 bg-white px-4 py-3">
        <View className="mb-3 flex-row items-center rounded-xl bg-gray-100 px-4 py-3">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Cari menu favorit..."
            className="ml-2 flex-1 text-sm"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedCat('Semua')}
            className={`mr-2 rounded-xl px-5 py-2 ${selectedCat === 'Semua' ? 'bg-bakso-primary' : 'bg-gray-100'}`}>
            <Text className={`text-sm font-bold ${selectedCat === 'Semua' ? 'text-white' : 'text-gray-600'}`}>
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCat(c.name)}
              className={`mr-2 rounded-xl px-5 py-2 ${selectedCat === c.name ? 'bg-bakso-primary' : 'bg-gray-100'}`}>
              <Text className={`text-sm font-bold ${selectedCat === c.name ? 'text-white' : 'text-gray-600'}`}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isMenusLoading ? (
        <ActivityIndicator className="mt-10" size="large" color="#DC2626" />
      ) : (
        <SectionList
          sections={filteredData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: hasActiveCartHere ? 100 : 60 }}
          refreshControl={
            <RefreshControl refreshing={isMenusLoading} onRefresh={refetchMenus} colors={['#DC2626']} />
          }
          ListHeaderComponent={<DepotInfoCard depot={depot} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="bg-white py-3 text-base font-black text-gray-800">{title}</Text>
          )}
          renderItem={({ item }) => (
            <MenuCard
              menu={item}
              depotId={depotId}
              isDepotOpen={depot?.is_open ?? false}
              onPress={() => handleMenuClick(item)}
            />
          )}
          ListEmptyComponent={
            <Text className="mt-10 text-center text-gray-400">Menu tidak ditemukan.</Text>
          }
        />
      )}

      {hasActiveCartHere && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CartScreen')}
            className="w-full flex-row items-center justify-between rounded-2xl bg-bakso-primary p-4">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 rounded-xl bg-white/20 p-2.5">
                <ShoppingBag size={20} color="#FFF" />
              </View>
              <View>
                <Text className="text-xs font-medium text-white opacity-90">
                  {cart.total_items} Item Pesanan
                </Text>
                <Text className="mt-0.5 text-lg font-black text-white">
                  Rp {cart.grand_total?.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
            <View className="rounded-xl bg-white px-4 py-2.5">
              <Text className="text-sm font-black text-bakso-primary">Keranjang</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <MenuVariantModal
        isVisible={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        menu={selectedMenu}
        existingItems={cart?.items?.filter(i => i.menu_id === selectedMenu?.id) || []}
        onEditVariant={(item) => {
          setIsVariantModalOpen(false);
          if (selectedMenu) {
            navigation.navigate('MenuDetailScreen', {
              menu: selectedMenu, depotId: Number(depotId), mode: 'edit', existingItem: item
            });
          }
        }}
        onAddNewVariant={() => {
          setIsVariantModalOpen(false);
          if (selectedMenu) {
            navigation.navigate('MenuDetailScreen', {
              menu: selectedMenu, depotId: Number(depotId), mode: 'add'
            });
          }
        }}
      />
      <LoginReminderModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </View>
  );
}