import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentFacility } from '@/lib/auth';
import type { Facility } from '@/lib/auth';

export type DashboardStats = {
  quickStats: {
    pending: number;
    processing: number;
    completed: number;
  };
  overview: {
    totalOrders: number;
    avgProcessingTime: number;
  };
  recentActivity: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    status: string;
    created_at: string;
    items_count: number;
  }>;
  facility: Facility | null;
  loading: boolean;
  error: string | null;
};

export function useFacilityDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    quickStats: { pending: 0, processing: 0, completed: 0 },
    overview: { totalOrders: 0, avgProcessingTime: 0 },
    recentActivity: [],
    facility: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const facility = await getCurrentFacility();
      if (!facility) {
        throw new Error('No facility found');
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch orders for the facility
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          status,
          created_at,
          items:order_items(count)
        `)
        .eq('facility_id', facility.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate quick stats
      const quickStats = {
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        processing: orders?.filter(o => o.status === 'processing').length || 0,
        completed: orders?.filter(o => o.status === 'delivered').length || 0
      };

      // Calculate today's overview
      const todayOrders = orders?.filter(order => 
        new Date(order.created_at) >= today && 
        new Date(order.created_at) < tomorrow
      ) || [];

      // Get recent activity (last 5 orders)
      const recentActivity = (orders || [])
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          status: order.status,
          created_at: order.created_at,
          items_count: order.items?.[0]?.count || 0
        }));

      // Calculate average processing time (mock for now)
      const avgProcessingTime = 45; // In minutes

      setStats({
        quickStats,
        overview: {
          totalOrders: todayOrders.length,
          avgProcessingTime
        },
        recentActivity,
        facility,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setStats(current => ({
        ...current,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard data'
      }));
    }
  };

  return stats;
}