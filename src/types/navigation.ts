import { NavigatorScreenParams } from '@react-navigation/native';
import { CartItem, Menu } from '.';

export type BottomTabParamList = {
  Home: undefined;
  Pesanan: undefined; 
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList>;
  Login: undefined;
  Register: undefined;
  DepotMenuScreen: { 
    depotId: number; 
    depotName: string; 
  };
  MenuDetailScreen: { 
    menu: Menu; 
    depotId: number; 
    mode: 'add' | 'edit'; 
    existingItem?: CartItem;
  };
  CartScreen: undefined;
  OrderTrackingScreen: { transactionId: string };
};