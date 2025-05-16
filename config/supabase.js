import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


// Create secure storage for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create a storage adapter based on platform
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // AsyncStorage isn't available on web, use localStorage
    return undefined;
  }
  return {
    // ...AsyncStorage,
    // SecureStore is used for tokens on native platforms
    ...(Platform.OS !== 'web' ? 
      ExpoSecureStoreAdapter 
      : {}),
  };
};

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'; 
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Table names for reference
export const TABLES = {
  USERS: 'users',
  TASKS: 'tasks',
  SESSIONS: 'sessions',
  TRIALS: 'trials',
  RESPONSES: 'responses',
  TRAJECTORIES: 'trajectories',
  BADGES: 'badges',
  ACHIEVEMENTS: 'achievements',
};