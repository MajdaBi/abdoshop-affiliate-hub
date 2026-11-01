import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/lib/commission";

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  commission: number;
  colors: string[];
  sizes: string[];
  active: boolean;
}

export interface OrderRow {
  id: string;
  order_number: string;
  affiliate_id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  product_id: string;
  color: string;
  size: string;
  quantity: number;
  selling_price: number;
  commission: number;
  status: OrderStatus;
  created_at: string;
  products: { name: string } | null;
  profiles?: { full_name: string; email: string } | null;
}

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    return data as unknown as Product[];
  },
};

export const ordersQuery = (withAffiliate = false) => ({
  queryKey: ["orders", withAffiliate],
  queryFn: async () => {
    const sel = withAffiliate ? "*, products(name), profiles(full_name, email)" : "*, products(name)";
    const { data, error } = await supabase.from("orders").select(sel).order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as OrderRow[];
  },
});
