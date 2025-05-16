import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { storeData, getData, removeData, STORAGE_KEYS } from '@/utils/storage';

/**
 * Context for authentication state
 */
export const AuthContext = createContext({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

/**
 * AuthProvider - Context provider for authentication state
 * Manages user authentication, session, and related operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state from storage or session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setIsLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          
          // Get user profile
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser(userProfile || session.user);
        } else {
          // Check for stored user data (for development/demo)
          const storedUser = await getData(STORAGE_KEYS.USER);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Set up auth change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_IN' && newSession) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
            
          setUser(userProfile || newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);
  
  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Demo mode - use mock user
      if (email === 'demo@example.com') {
        const demoUser = {
          id: 'demo-user-id',
          username: 'DemoUser',
          email: 'demo@example.com',
          level: 4,
          totalPoints: 650,
          isDemo: true,
        };
        
        setUser(demoUser);
        await storeData(STORAGE_KEYS.USER, JSON.stringify(demoUser));
        return { success: true, data: demoUser };
      }
      
      // Real authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, userData = {}) => {
    try {
      setIsLoading(true);
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username || email.split('@')[0],
            ...userData,
          },
        },
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username: userData.username || email.split('@')[0],
              email,
              level: 1,
              total_points: 0,
              ...userData,
            },
          ]);
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // For demo user, just remove from storage
      if (user?.isDemo) {
        await removeData(STORAGE_KEYS.USER);
        setUser(null);
        return { success: true };
      }
      
      // Real sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Update user profile in database
   */
  const updateProfile = async (profileData) => {
    try {
      // For demo user, just update local storage
      if (user?.isDemo) {
        const updatedUser = { ...user, ...profileData };
        await storeData(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, data: updatedUser };
      }
      
      // Real update
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select('*')
        .single();
        
      if (error) {
        return { success: false, error: error.message };
      }
      
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const contextValue = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);