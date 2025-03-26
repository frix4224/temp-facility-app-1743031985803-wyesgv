import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { ArrowUpRight, ArrowDownRight, Package2, Clock, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { getCurrentFacility } from '@/lib/auth';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const timeRanges = ['Today', 'Week', 'Month', 'Year'];

type OrderStats = {
  total: number;
  processing: number;
  completed: number;
  cancelled: number;
  trends: {
    total: { value: number; positive: boolean };
    processing: { value: number; positive: boolean };
    completed: { value: number; positive: boolean };
    cancelled: { value: number; positive: boolean };
  };
};

export default function StatsScreen() {
  const [selectedRange, setSelectedRange] = useState('Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orderTrends, setOrderTrends] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [selectedRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const facility = await getCurrentFacility();
      
      if (!facility) {
        throw new Error('No facility found');
      }

      // Get orders for the facility
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          created_at,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const now = new Date();
      const timeRange = getTimeRange(selectedRange);
      
      const filteredOrders = orders?.filter(order => 
        new Date(order.created_at) >= timeRange.start && 
        new Date(order.created_at) <= timeRange.end
      ) || [];

      const previousOrders = orders?.filter(order =>
        new Date(order.created_at) >= timeRange.previousStart &&
        new Date(order.created_at) < timeRange.start
      ) || [];

      const currentStats = calculateStats(filteredOrders);
      const previousStats = calculateStats(previousOrders);

      setStats({
        total: currentStats.total,
        processing: currentStats.processing,
        completed: currentStats.completed,
        cancelled: currentStats.cancelled,
        trends: {
          total: calculateTrend(currentStats.total, previousStats.total),
          processing: calculateTrend(currentStats.processing, previousStats.processing),
          completed: calculateTrend(currentStats.completed, previousStats.completed),
          cancelled: calculateTrend(currentStats.cancelled, previousStats.cancelled),
        }
      });

      // Calculate trends for chart
      const trendData = calculateTrendData(filteredOrders, timeRange);
      setOrderTrends(trendData);

      // Calculate category stats
      const catStats = calculateCategoryStats(filteredOrders);
      setCategoryStats(catStats);

    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    const previousStart = new Date();
    
    switch (range) {
      case 'Today':
        start.setHours(0, 0, 0, 0);
        previousStart.setDate(previousStart.getDate() - 1);
        previousStart.setHours(0, 0, 0, 0);
        break;
      case 'Week':
        start.setDate(start.getDate() - 7);
        previousStart.setDate(previousStart.getDate() - 14);
        break;
      case 'Month':
        start.setMonth(start.getMonth() - 1);
        previousStart.setMonth(previousStart.getMonth() - 2);
        break;
      case 'Year':
        start.setFullYear(start.getFullYear() - 1);
        previousStart.setFullYear(previousStart.getFullYear() - 2);
        break;
    }

    return {
      start,
      end: now,
      previousStart,
      previousEnd: start
    };
  };

  const calculateStats = (orders: any[]) => {
    return {
      total: orders.length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, positive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      positive: change >= 0
    };
  };

  const calculateTrendData = (orders: any[], timeRange: any) => {
    const labels = [];
    const data = [];
    
    // Generate labels and initialize data
    switch (selectedRange) {
      case 'Today':
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
          data.push(0);
        }
        break;
      case 'Week':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(days[d.getDay()]);
          data.push(0);
        }
        break;
      case 'Month':
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (29 - i));
          labels.push(d.getDate().toString());
          data.push(0);
        }
        break;
      case 'Year':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          labels.push(months[d.getMonth()]);
          data.push(0);
        }
        break;
    }

    // Count orders for each period
    orders.forEach(order => {
      const date = new Date(order.created_at);
      let index;
      
      switch (selectedRange) {
        case 'Today':
          index = date.getHours();
          break;
        case 'Week':
          index = 6 - Math.floor((timeRange.end.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          break;
        case 'Month':
          index = date.getDate() - 1;
          break;
        case 'Year':
          index = date.getMonth();
          break;
      }
      
      if (index >= 0 && index < data.length) {
        data[index]++;
      }
    });

    return {
      labels,
      datasets: [{
        label: 'Orders',
        data,
        fill: true,
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        tension: 0.4,
      }],
    };
  };

  const calculateCategoryStats = (orders: any[]) => {
    const categories: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (item.product_name) {
          categories[item.product_name] = (categories[item.product_name] || 0) + item.quantity;
        }
      });
    });

    const sortedCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedCategories.map(([name]) => name),
      datasets: [{
        label: 'Items Processed',
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: '#0891b2',
      }],
    };
  };

  const StatCard = ({ title, value, trend, icon: Icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Icon size={20} color="white" />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.trendContainer}>
        {trend.positive ? (
          <ArrowUpRight size={16} color="#059669" />
        ) : (
          <ArrowDownRight size={16} color="#dc2626" />
        )}
        <Text
          style={[
            styles.trendText,
            { color: trend.positive ? '#059669' : '#dc2626' },
          ]}
        >
          {trend.value}%
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <View style={styles.timeRangeContainer}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  selectedRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Orders"
          value={stats?.total || 0}
          trend={stats?.trends.total || { value: 0, positive: true }}
          icon={Package2}
          color="#0891b2"
        />
        <StatCard
          title="Processing"
          value={stats?.processing || 0}
          trend={stats?.trends.processing || { value: 0, positive: true }}
          icon={Clock}
          color="#d97706"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          trend={stats?.trends.completed || { value: 0, positive: true }}
          icon={CheckCircle2}
          color="#059669"
        />
        <StatCard
          title="Cancelled"
          value={stats?.cancelled || 0}
          trend={stats?.trends.cancelled || { value: 0, positive: true }}
          icon={XCircle}
          color="#dc2626"
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Orders Trend</Text>
        {Platform.OS === 'web' && orderTrends && (
          <Line data={orderTrends} options={chartOptions} style={styles.chart} />
        )}
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top Items by Category</Text>
        {Platform.OS === 'web' && categoryStats && (
          <Bar data={categoryStats} options={chartOptions} style={styles.chart} />
        )}
      </View>
    </ScrollView>
  );
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1f2937',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#0891b2',
  },
  timeRangeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6b7280',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1f2937',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  chartTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});