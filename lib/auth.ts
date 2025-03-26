import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { router } from 'expo-router';

export type Facility = {
  id: string;
  facility_code: number;
  facility_name: string;
  email: string;
  logo?: string;
  status: boolean;
  address_line_1?: string;
  opening_hour?: string;
  close_hour?: string;
  radius?: number;
  owner_name?: string;
};

const FACILITY_STORAGE_KEY = '@facility';

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select()
      .eq('email', email.toLowerCase())
      .eq('password', password) // Note: In production, use proper password hashing
      .eq('status', true)
      .single();

    if (error) {
      throw new Error('Invalid credentials');
    }

    if (!data) {
      throw new Error('Facility not found or inactive');
    }

    // Store facility data in storage
    await AsyncStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    await AsyncStorage.removeItem(FACILITY_STORAGE_KEY);
    router.replace('/login');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentFacility(): Promise<Facility | null> {
  try {
    const facilityData = await AsyncStorage.getItem(FACILITY_STORAGE_KEY);
    
    if (!facilityData) {
      // If no facility data is found and we're in development, return a mock facility
      if (__DEV__) {
        return {
          id: '123e4567-e89b-12d3-a456-426614174000',
          facility_code: 1234,
          facility_name: 'Development Facility',
          email: 'dev@example.com',
          status: true,
          address_line_1: '123 Dev Street',
          opening_hour: '09:00',
          close_hour: '17:00',
          radius: 5,
          owner_name: 'Dev Owner'
        };
      }
      
      // In production, redirect to login if no facility data is found
      router.replace('/login');
      return null;
    }

    return JSON.parse(facilityData);
  } catch (error) {
    console.error('Error getting facility data:', error);
    if (!__DEV__) {
      router.replace('/login');
    }
    return null;
  }
}