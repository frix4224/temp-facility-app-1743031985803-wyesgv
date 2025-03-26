import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Package2, TrendingUp, Clock, CircleCheck as CheckCircle2, Circle as XCircle, Search, Filter, ChevronRight, QrCode, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useFacilityDashboard } from '@/hooks/useFacilityDashboard';
import { formatDistanceToNow } from '@/lib/utils';

export default function HomeScreen() {
  const { 
    quickStats, 
    overview, 
    recentActivity, 
    facility,
    loading,
    error 
  } = useFacilityDashboard();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const handleOrderPress = (orderId: string) => {
    router.push({
      pathname: '/orders/[id]',
      params: { id: orderId }
    });
  };

  const handleScanPress = () => {
    router.push('/orders/scan');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const STATS_CONFIG = [
    { 
      id: 'pending',
      label: 'Pending',
      value: quickStats.pending,
      icon: Clock,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      id: 'processing',
      label: 'Processing',
      value: quickStats.processing,
      icon: Package2,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      id: 'completed',
      label: 'Completed',
      value: quickStats.completed,
      icon: CheckCircle2,
      color: '#10b981',
      bgColor: '#d1fae5'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.facilityName}>{facility?.facility_name}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{ uri: facility?.logo || 'https://images.unsplash.com/photo-1545173168-9f1c6e193c6e?q=80&w=2071&auto=format&fit=crop' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={20} color="#6b7280" />
          <Text style={styles.searchPlaceholder}>Search orders, customers...</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#0891b2' }]}
            onPress={handleScanPress}
          >
            <View style={styles.actionIcon}>
              <QrCode size={20} color="#ffffff" />
            </View>
            <Text style={styles.actionText}>Scan Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickStats}>
        {STATS_CONFIG.map((stat) => (
          <TouchableOpacity key={stat.id} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
              <stat.icon size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See Details</Text>
            <ChevronRight size={16} color="#0891b2" />
          </TouchableOpacity>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <View style={styles.overviewIcon}>
              <TrendingUp size={20} color="#0891b2" />
            </View>
            <View>
              <Text style={styles.overviewValue}>{overview.totalOrders}</Text>
              <Text style={styles.overviewLabel}>Total Orders</Text>
            </View>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewItem}>
            <View style={[styles.overviewIcon, { backgroundColor: '#fee2e2' }]}>
              <Clock size={20} color="#dc2626" />
            </View>
            <View>
              <Text style={styles.overviewValue}>{overview.avgProcessingTime} min</Text>
              <Text style={styles.overviewLabel}>Avg. Processing</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>View All</Text>
            <ChevronRight size={16} color="#0891b2" />
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <TouchableOpacity 
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleOrderPress(activity.id)}
            >
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Order #{activity.order_number}</Text>
                <Text style={styles.activityDescription}>
                  {activity.customer_name} - {activity.items_count} items
                </Text>
                <Text style={styles.activityTime}>
                  {formatDistanceToNow(activity.created_at)}
                </Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#f9fafb',
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
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  facilityName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#111827',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  filterButton: {
    padding: 4,
  },
  quickActions: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  quickStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#0891b2',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#111827',
  },
  overviewLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  activityList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9ca3af',
  },
});