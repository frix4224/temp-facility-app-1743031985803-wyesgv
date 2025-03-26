import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { Bell, Building2, ChevronRight, Clock, Cog, CircleHelp as HelpCircle, LogOut, MapPin, Moon, Shield, User } from 'lucide-react-native';
import { signOut, getCurrentFacility, type Facility } from '@/lib/auth';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [facility, setFacility] = useState<Facility | null>(null);

  useEffect(() => {
    loadFacility();
  }, []);

  const loadFacility = async () => {
    const facilityData = await getCurrentFacility();
    setFacility(facilityData);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const SettingItem = ({ icon: Icon, title, value, showArrow = true, onPress, right }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon size={20} color="#6b7280" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {right || (showArrow && <ChevronRight size={20} color="#9ca3af" />)}
    </TouchableOpacity>
  );

  if (!facility) {
    return null; // Or show loading state
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.facilityCard}>
        <Image 
          source={{ 
            uri: facility.logo || 'https://images.unsplash.com/photo-1545173168-9f1c6e193c6e?q=80&w=2071&auto=format&fit=crop' 
          }} 
          style={styles.facilityImage} 
        />
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{facility.facility_name}</Text>
          <Text style={styles.facilityAddress}>{facility.address_line_1}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: facility.status ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={[styles.statusText, { color: facility.status ? '#059669' : '#dc2626' }]}>
                {facility.status ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.operatingHours}>
              {facility.opening_hour ? 
                `${facility.opening_hour} - ${facility.close_hour}` : 
                '8:00 AM - 8:00 PM'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facility Settings</Text>
        <View style={styles.sectionContent}>
          <SettingItem 
            icon={Building2} 
            title="Facility Profile" 
            value={`Facility Code: ${facility.facility_code}`} 
          />
          <SettingItem 
            icon={MapPin} 
            title="Service Area" 
            value={`${facility.radius || 2.5} mile radius`} 
          />
          <SettingItem 
            icon={Clock} 
            title="Operating Hours" 
            value={facility.opening_hour ? 
              `${facility.opening_hour} - ${facility.close_hour}` : 
              '8:00 AM - 8:00 PM'} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.sectionContent}>
          <SettingItem 
            icon={User} 
            title="Profile" 
            value={facility.owner_name || 'Facility Owner'} 
          />
          <SettingItem
            icon={Bell}
            title="Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#d1d5db', true: '#0891b2' }}
                thumbColor={notifications ? '#fff' : '#fff'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon={Moon}
            title="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#d1d5db', true: '#0891b2' }}
                thumbColor={darkMode ? '#fff' : '#fff'}
              />
            }
            showArrow={false}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionContent}>
          <SettingItem icon={Shield} title="Privacy Settings" />
          <SettingItem icon={Cog} title="App Permissions" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionContent}>
          <SettingItem icon={HelpCircle} title="Help Center" />
          <TouchableOpacity style={[styles.settingItem, styles.logoutButton]} onPress={handleLogout}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

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
  },
  facilityCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  facilityImage: {
    width: '100%',
    height: 150,
  },
  facilityInfo: {
    padding: 16,
  },
  facilityName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 4,
  },
  facilityAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  operatingHours: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1f2937',
  },
  settingValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    justifyContent: 'center',
    gap: 12,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#dc2626',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
});