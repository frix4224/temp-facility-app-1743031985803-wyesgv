import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  email: string;
  phone?: string;
  shipping_address: string;
  payment_method?: string;
  special_instructions?: string;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total_amount: number;
  package?: {
    id: string;
    status: string;
    driver_id: string | null;
  };
};

export type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          email,
          phone,
          shipping_address,
          status,
          payment_method,
          special_instructions,
          subtotal,
          tax,
          shipping_fee,
          total_amount,
          created_at,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            subtotal
          ),
          package:package_orders!order_id (
            id:package_id,
            status,
            driver:driver_packages!package_id (
              driver_id
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data?.map(order => ({
        ...order,
        items: order.order_items || [],
        package: order.package?.[0] || null
      })) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
  };
}