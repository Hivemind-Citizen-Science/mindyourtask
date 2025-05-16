import { supabase, TABLES } from '@/config/supabase';

/**
 * User Service - Handles user profile operations
 * Manages user profiles and preferences
 */
class UserService {
  /**
   * Get user profile
   * 
   * @param {number} userId - User ID
   * @returns {Promise} - Result with profile data
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user profile
   * 
   * @param {number} userId - User ID
   * @param {object} profileData - Profile data to update
   * @returns {Promise} - Result with updated profile
   */
  async updateProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(profileData)
        .eq('id', userId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update theme preference
   * 
   * @param {number} userId - User ID
   * @param {string} theme - Theme preference ('light' or 'dark')
   * @returns {Promise} - Result with success status
   */
  async updateThemePreference(userId, theme) {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .update({ theme })
        .eq('id', userId);
      
      if (error) throw error;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Update theme preference error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete user account and all associated data
   * 
   * @param {number} userId - User ID
   * @returns {Promise} - Result with success status
   */
  async deleteUserData(userId) {
    try {
      // Delete all associated data
      // This relies on cascading deletes in the database schema
      
      // Delete the user
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete user data error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update data consent status
   * 
   * @param {number} userId - User ID
   * @param {boolean} consentGiven - Whether consent is given
   * @returns {Promise} - Result with success status
   */
  async updateDataConsent(userId, consentGiven) {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .update({ data_consent: consentGiven })
        .eq('id', userId);
      
      if (error) throw error;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Update data consent error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new UserService();