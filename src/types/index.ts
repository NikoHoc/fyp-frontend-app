export type Role = 'pelanggan';

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  role: Role;
}

export interface CustomerProfile extends User {
  created_at: string;
  total_transactions: number;
}

export interface CartItem {
  id: number;
  menu_id: number;
  name: string;           
  image_url?: string; 
  price: number;           
  original_price: number;  
  quantity: number;
  is_half_portion: boolean;
  note?: string;
  item_total: number;       
}
export interface CustomerCart {
  id: string;
  customer_id: string;
  depot_id: number;
  items: CartItem[];
  grand_total?: number; 
  total_items?: number;
}
export interface PaymentConfig {
  id: number;
  depot_id: number;
  merchant_id: string;
  midtrans_server_key: string;
  midtrans_client_key: string;
}

export interface Depot {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  is_open?: boolean;
  payment_configs?: PaymentConfig | null;
  created_at?: string;
  owner_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  map_url?: string | null;
  shift1_start? : string | null;
  shift1_end? : string | null;
  shift2_start? : string | null;
  shift2_end? : string | null;
}

export interface Menu {
  id: number;
  category_id: number;
  categories: { id: number; name: string }; 
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean; 
}