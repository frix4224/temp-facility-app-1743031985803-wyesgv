import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Platform, ActivityIndicator } from 'react-native';
import { Package2, Search, Filter, Clock, CircleCheck as CheckCircle2, Circle as XCircle, ChevronRight } from 'lucide-react-native';
import { useOrders } from '@/hooks/useOrders';
import { router } from 'expo-router';

const STATUS_FILTERS = {
  all: 'All Orders',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const { orders, loading, error, fetchOrders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const filteredOrders = orders?.filter(order => {
    if (!order) return false;
    const matchesSearch = (order.order_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} color={getStatusColor(status)} />;
      case 'processing': return <Package2 size={16} color={getStatusColor(status)} />;
      case 'delivered': return <CheckCircle2 size={16} color={getStatusColor(status)} />;
      case 'cancelled': return <XCircle size={16} color={getStatusColor(status)} />;
      default: return null;
    }
  };

  const handleOrderPress = (orderId) => {
    router.push({
      pathname: '/orders/[id]',
      params: { id: orderId }
    });
  };

  const renderOrder = ({ item: order }) => {
    if (!order) return null;
    
    const items = order.items || [];
    const totalAmount = items.reduce((sum, item) => {
      if (!item) return sum;
      return sum + ((item.quantity || 0) * (item.unit_price || 0));
    }, 0);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleOrderPress(order.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{order.order_number || 'N/A'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
              {getStatusIcon(order.status)}
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {(order.status?.charAt(0).toUpperCase() + order.status?.slice(1)) || 'Unknown'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer_name || 'Unknown Customer'}</Text>
          <Text style={styles.orderDate}>
            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) : 'Date not available'}
          </Text>
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.itemCount}>{items.length} items</Text>
          <Text style={styles.orderTotal}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package2 size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'New orders will appear here'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(STATUS_FILTERS)}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: [key, label] }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === key && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  filterList: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0891b2',
  },
  filterChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4b5563',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  orderDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  orderTotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0891b2',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});