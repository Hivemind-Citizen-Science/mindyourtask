import { supabase } from '@/config/supabase';
import { TABLES } from '@/config/supabase';
import { STORAGE_KEYS, storeData } from '@/utils/storage';

/**
 * Gamification Service - Handles badges, achievements, and gamification elements
 * Manages user rewards, progress tracking, and leaderboard functionality
 */
class GamificationService {
  /**
   * Get user badges
   * 
   * @param {string} userId - User ID
   * @returns {Promise} - Result with badges data
   */
  async getUserBadges(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_BADGES)
        .select(`
          id,
          awarded_at,
          badges:badge_id (
            id, 
            name, 
            description, 
            image_url, 
            points_value, 
            rarity
          )
        `)
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Process badges
      const badges = data.map(item => ({
        id: item.id,
        awardedAt: item.awarded_at,
        ...item.badges,
      }));
      
      return { success: true, data: badges };
    } catch (error) {
      console.error('Error getting user badges:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user achievements
   * 
   * @param {string} userId - User ID
   * @returns {Promise} - Result with achievements data
   */
  async getUserAchievements(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_ACHIEVEMENTS)
        .select(`
          id,
          progress,
          completed,
          completed_at,
          achievements:achievement_id (
            id,
            name,
            description,
            image_url,
            points_value,
            tier
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Process achievements
      const achievements = data.map(item => ({
        id: item.id,
        progress: item.progress,
        completed: item.completed,
        completedAt: item.completed_at,
        ...item.achievements,
      }));
      
      return { success: true, data: achievements };
    } catch (error) {
      console.error('Error getting user achievements:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get leaderboard data
   * 
   * @param {string} sortBy - Sort criteria ('points', 'accuracy', or 'speed')
   * @param {number} limit - Number of entries to return
   * @returns {Promise} - Result with leaderboard data
   */
  async getLeaderboard(sortBy = 'points', limit = 20) {
    try {
      // Determine sort field
      let orderField = 'total_points';
      if (sortBy === 'accuracy') {
        orderField = 'avg_accuracy';
      } else if (sortBy === 'speed') {
        orderField = 'avg_reaction_time';
      }
      
      // Get leaderboard data
      const { data, error } = await supabase
        .from(TABLES.LEADERBOARD)
        .select('*')
        .order(orderField, { ascending: sortBy === 'speed' })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting leaderboard:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user streak data
   * 
   * @param {string} userId - User ID
   * @returns {Promise} - Result with streak data
   */
  async getUserStreak(userId) {
    try {
      // Get current streak from user profile
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('current_streak, highest_streak')
        .eq('id', userId)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      // Get streak history
      const { data: streakData, error: streakError } = await supabase
        .from(TABLES.STREAKS)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);
      
      if (streakError) {
        throw streakError;
      }
      
      const result = {
        currentStreak: userData.current_streak || 0,
        highestStreak: userData.highest_streak || 0,
        history: streakData || [],
      };
      
      // Store streak data locally
      await storeData(STORAGE_KEYS.USER_STREAKS, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting user streak:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check for unawarded badges
   * 
   * @param {string} userId - User ID
   * @returns {Promise} - Result with newly awarded badges
   */
  async checkForNewBadges(userId) {
    try {
      // This would be handled by database triggers in a real implementation
      // Here we'll just get the latest badges to simulate new ones
      
      const { data: latestBadges, error } = await supabase
        .from(TABLES.USER_BADGES)
        .select(`
          id,
          awarded_at,
          badges:badge_id (
            id, 
            name, 
            description, 
            image_url, 
            points_value, 
            rarity
          )
        `)
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })
        .limit(3);
      
      if (error) {
        throw error;
      }
      
      // Process badges
      const newBadges = latestBadges.map(item => ({
        id: item.id,
        awardedAt: item.awarded_at,
        ...item.badges,
      }));
      
      return { success: true, data: newBadges };
    } catch (error) {
      console.error('Error checking for new badges:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update achievement progress
   * 
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @param {number} progress - Progress value
   * @returns {Promise} - Result with updated achievement
   */
  async updateAchievementProgress(userId, achievementId, progress) {
    try {
      // Get the achievement record
      const { data: achievementRecord, error: getError } = await supabase
        .from(TABLES.USER_ACHIEVEMENTS)
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();
      
      if (getError && getError.code !== 'PGRST116') { // Not found is ok
        throw getError;
      }
      
      // If record exists, update it, otherwise create it
      let data;
      let error;
      
      if (achievementRecord) {
        // Check if achievement is completed
        const isCompleted = progress >= 100;
        const completedNow = !achievementRecord.completed && isCompleted;
        
        // Update record
        const result = await supabase
          .from(TABLES.USER_ACHIEVEMENTS)
          .update({
            progress,
            completed: isCompleted,
            completed_at: completedNow ? new Date().toISOString() : achievementRecord.completed_at,
          })
          .eq('id', achievementRecord.id)
          .select();
        
        data = result.data;
        error = result.error;
        
        // If completed just now, award points
        if (completedNow) {
          // Get achievement details
          const { data: achievementDetails } = await supabase
            .from(TABLES.ACHIEVEMENTS)
            .select('points_value')
            .eq('id', achievementId)
            .single();
          
          if (achievementDetails) {
            // Update user points
            await supabase
              .from(TABLES.USERS)
              .update({
                total_points: supabase.sql`total_points + ${achievementDetails.points_value}`,
              })
              .eq('id', userId);
          }
        }
      } else {
        // Create new record
        const result = await supabase
          .from(TABLES.USER_ACHIEVEMENTS)
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress,
            completed: progress >= 100,
            completed_at: progress >= 100 ? new Date().toISOString() : null,
          })
          .select();
        
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating achievement progress:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user rank information
   * 
   * @param {string} userId - User ID
   * @returns {Promise} - Result with user rank data
   */
  async getUserRank(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEADERBOARD)
        .select('rank, total_points, level')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user rank:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all available badges
   * 
   * @returns {Promise} - Result with all badges
   */
  async getAllBadges() {
    try {
      const { data, error } = await supabase
        .from(TABLES.BADGES)
        .select('*')
        .order('rarity', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all badges:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all available achievements
   * 
   * @returns {Promise} - Result with all achievements
   */
  async getAllAchievements() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ACHIEVEMENTS)
        .select('*')
        .order('tier', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all achievements:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new GamificationService();