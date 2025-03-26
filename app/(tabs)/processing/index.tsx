import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Search, Package2, Tag, CircleDollarSign, Calendar, ChevronLeft, ChevronRight, Scan } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from '@/lib/utils';

type ProcessingOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  created_at: string;
  estimated_delivery: string;
  items: Array<{
    id: string;
    product_name: string;
    status: 'Tagged' | 'Pending';
    notes?: string | null;
  }>;
};

export default function ProcessingScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<ProcessingOrder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Set time to start of day for comparison
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Set time to end of day for comparison
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          status,
          created_at,
          estimated_delivery,
          items:order_items (
            id,
            product_name
          )
        `)
        .eq('status', 'processing')
        .gte('estimated_delivery', startDate.toISOString())
        .lte('estimated_delivery', endDate.toISOString())
        .order('estimated_delivery', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform the data to include mock item status
      const processedOrders = data?.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          status: Math.random() > 0.5 ? 'Tagged' : 'Pending',
          notes: Math.random() > 0.7 ? 'Check for stains' : null,
        })),
      })) || [];

      setOrders(processedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuotesPress = () => {
    router.push('/processing/quotes');
  };

  const handleScanPress = () => {
    router.push('/(tabs)/orders/scan');
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const renderOrder = ({ item: order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Package2 size={24} color="#0891b2" />
        <Text style={styles.orderId}>Order #{order.order_number}</Text>
        <Text style={styles.customerName}>{order.customer_name}</Text>
      </View>

      <View style={styles.itemsList}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.notes && (
                <Text style={styles.itemNotes}>{item.notes}</Text>
              )}
            </View>
            <View style={[
              styles.statusBadge,
              item.status === 'Tagged' ? styles.taggedStatus : styles.pendingStatus
            ]}>
              <Tag size={14} color={item.status === 'Tagged' ? '#059669' : '#d97706'} />
              <Text style={[
                styles.statusText,
                item.status === 'Tagged' ? styles.taggedText : styles.pendingText
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.estimatedDelivery}>
          Due: {new Date(order.estimated_delivery).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.timeAgo}>
          {formatDistanceToNow(order.created_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Processing</Text>
        
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            onPress={() => handleDateChange(-1)}
            style={styles.dateButton}
          >
            <ChevronLeft size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#6b7280" />
            <Text style={[
              styles.dateText,
              isToday(selectedDate) && styles.todayText
            ]}>
              {formatDate(selectedDate)}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => handleDateChange(1)}
            style={styles.dateButton}
          >
            <ChevronRight size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContent}>
          <Package2 size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Orders to Process</Text>
          <Text style={styles.emptyText}>
            {isToday(selectedDate) 
              ? 'There are no orders that need processing today'
              : 'There are no orders scheduled for processing on this date'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity 
        style={styles.scanButton}
        onPress={handleScanPress}
        activeOpacity={0.7}
      >
        <Scan size={24} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quotesButton}
        onPress={handleQuotesPress}
        activeOpacity={0.7}
      >
        <CircleDollarSign size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1f2937',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  dateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#374151',
  },
  todayText: {
    color: '#0891b2',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderId: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  customerName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6b7280',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
  },
  itemNotes: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  taggedStatus: {
    backgroundColor: '#d1fae5',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  taggedText: {
    color: '#059669',
  },
  pendingText: {
    color: '#d97706',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  estimatedDelivery: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#0891b2',
  },
  timeAgo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  scanButton: {
    position: 'absolute',
    bottom: 24,
    right: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  quotesButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});