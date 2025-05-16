import { supabase } from '@/config/supabase';

/**
 * Auth Service - Handles authentication operations
 * Encapsulates Supabase auth operations and session management
 */
class AuthService {
  /**
   * Sign in with email and password
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Auth result with success flag and data/error
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign up a new user
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} metadata - Additional user metadata
   * @returns {Promise} - Auth result with success flag and data/error
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign out the current user
   * 
   * @returns {Promise} - Auth result with success flag and error if any
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   * 
   * @param {string} email - User email
   * @returns {Promise} - Auth result with success flag and error if any
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app-url.com/reset-password',
      });
      
      if (error) throw error;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the current session
   * 
   * @returns {Promise} - Auth result with success flag and session/error
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return {
        success: true,
        data: data.session
      };
    } catch (error) {
      console.error('Get session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the current user
   * 
   * @returns {Promise} - Auth result with success flag and user/error
   */
  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return {
        success: true,
        data: data.user
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AuthService();