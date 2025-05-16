import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Create a new MMKV instance for general storage
export const storage = new MMKV({ id: 'app-storage' });

// Storage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  USER: 'user',
  TOKEN: 'token',
  ACTIVE_TASK: 'activeTask',
  ACTIVE_SESSION: 'activeSession',
  CURRENT_TRIAL: 'currentTrial',
  SESSION_START_TIME: 'sessionStartTime',
  BACKGROUND_TIME: 'backgroundTime',
  TASKS: 'tasks',
  COMPLETED_TASKS: 'completedTasks',
  USER_PROGRESS: 'userProgress',
  CONSENT_GIVEN: 'consentGiven',
};

/**
 * Store data in the appropriate storage (MMKV or SecureStore)
 * 
 * @param {string} key - The key to store the data under
 * @param {string} value - The value to store (must be a string)
 * @returns {Promise<void>}
 */
export const storeData = async (key, value) => {
  try {
    // Check if this is sensitive data that should be stored securely
    const sensitiveKeys = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER];
    
    if (Platform.OS !== 'web' && sensitiveKeys.includes(key)) {
      // Use SecureStore for sensitive data on native platforms
      await SecureStore.setItemAsync(key, value);
    } else {
      // Use MMKV for everything else
      storage.set(key, value);
    }
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

/**
 * Get data from the appropriate storage (MMKV or SecureStore)
 * 
 * @param {string} key - The key to retrieve the data for
 * @returns {Promise<string|null>} - The stored value, or null if not found
 */
export const getData = async (key) => {
  try {
    // Check if this is sensitive data that should be retrieved securely
    const sensitiveKeys = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER];
    
    if (Platform.OS !== 'web' && sensitiveKeys.includes(key)) {
      // Use SecureStore for sensitive data on native platforms
      return await SecureStore.getItemAsync(key);
    } else {
      // Use MMKV for everything else
      return storage.getString(key);
    }
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

/**
 * Remove data from the appropriate storage (MMKV or SecureStore)
 * 
 * @param {string} key - The key to remove
 * @returns {Promise<void>}
 */
export const removeData = async (key) => {
  try {
    // Check if this is sensitive data that should be removed securely
    const sensitiveKeys = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER];
    
    if (Platform.OS !== 'web' && sensitiveKeys.includes(key)) {
      // Use SecureStore for sensitive data on native platforms
      await SecureStore.deleteItemAsync(key);
    } else {
      // Use MMKV for everything else
      storage.delete(key);
    }
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

/**
 * Clear all stored data (useful for sign out)
 * 
 * @returns {Promise<void>}
 */
export const clearAllData = async () => {
  try {
    // Clear MMKV storage
    storage.clearAll();
    
    // Clear SecureStore items if on native platform
    if (Platform.OS !== 'web') {
      const sensitiveKeys = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER];
      await Promise.all(sensitiveKeys.map(key => SecureStore.deleteItemAsync(key)));
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};