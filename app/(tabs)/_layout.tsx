import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Package2, ClipboardList, ChartBar as BarChart3, Settings, Scan } from 'lucide-react-native';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { getCurrentFacility } from '@/lib/auth';

export default function TabLayout() {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const facility = await getCurrentFacility();
    if (!facility) {
      router.replace('/login');
    }
  };

  const handleScanPress = () => {
    router.push('/(tabs)/orders/scan');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => <Package2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="processing"
        options={{
          title: 'Processing',
          tabBarIcon: ({ size, color }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={0.7}
            >
              <Scan size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 28 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});