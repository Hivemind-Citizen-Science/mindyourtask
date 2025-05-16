import { supabase, TABLES } from '@/config/supabase';

/**
 * Statistics Service - Handles statistics and leaderboard operations
 * Retrieves and formats statistical data for display
 */
class StatisticsService {
  /**
   * Get user statistics
   * 
   * @param {number} userId - User ID
   * @returns {Promise} - Result with statistics data
   */
  async getUserStatistics(userId) {
    try {
      // Get completed sessions count
      const { data: sessionsData, error: sessionsError } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true);
      
      if (sessionsError) throw sessionsError;
      
      // Calculate statistics from sessions
      let totalSessions = sessionsData.length;
      let totalTrials = 0;
      let totalCorrect = 0;
      let totalTimeTaken = 0;
      
      sessionsData.forEach(session => {
        totalTrials += session.total_trials || 0;
        totalCorrect += session.correct_count || 0;
        totalTimeTaken += session.avg_reaction_time * (session.total_trials || 0) || 0;
      });
      
      const avgAccuracy = totalTrials > 0 ? (totalCorrect / totalTrials) * 100 : 0;
      const avgReactionTime = totalTrials > 0 ? totalTimeTaken / totalTrials : 0;
      
      return {
        success: true,
        data: {
          totalSessions,
          totalTrials,
          totalCorrect,
          avgAccuracy,
          avgReactionTime,
        }
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get leaderboard data
   * 
   * @param {string} sortBy - Sort criteria ('accuracy' or 'speed')
   * @param {number} limit - Number of entries to return
   * @returns {Promise} - Result with leaderboard data
   */
  async getLeaderboard(sortBy = 'accuracy', limit = 20) {
    try {
      // Use RPC (Remote Procedure Call) for complex queries
      // This assumes you've created a stored procedure in your database
      
      const { data, error } = await supabase.rpc('get_leaderboard', {
        sort_by: sortBy,
        limit_num: limit
      });
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      
      // Fallback if RPC fails - simplified version
      try {
        const { data: users, error: usersError } = await supabase
          .from(TABLES.USERS)
          .select('id, username, full_name');
        
        if (usersError) throw usersError;
        
        // For each user, get their statistics
        const leaderboardData = await Promise.all(
          users.map(async (user) => {
            const stats = await this.getUserStatistics(user.id);
            return {
              ...user,
              stats: stats.success ? stats.data : null,
            };
          })
        );
        
        // Sort and limit results
        const sortedData = leaderboardData
          .filter(item => item.stats !== null)
          .sort((a, b) => {
            if (sortBy === 'accuracy') {
              return b.stats.avgAccuracy - a.stats.avgAccuracy;
            } else {
              return a.stats.avgReactionTime - b.stats.avgReactionTime;
            }
          })
          .slice(0, limit);
        
        return {
          success: true,
          data: sortedData
        };
      } catch (fallbackError) {
        console.error('Error in fallback leaderboard:', fallbackError);
        return {
          success: false,
          error: fallbackError.message
        };
      }
    }
  }

  /**
   * Get performance over time
   * 
   * @param {number} userId - User ID
   * @param {string} taskType - Task type filter (optional)
   * @returns {Promise} - Result with performance data
   */
  async getPerformanceOverTime(userId, taskType = null) {
    try {
      // Get completed sessions for the user
      let query = supabase
        .from(TABLES.SESSIONS)
        .select(`
          id, 
          start_time, 
          correct_count, 
          total_trials, 
          avg_reaction_time,
          tasks:task_id (type, name)
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('start_time', { ascending: true });
      
      // Apply task type filter if provided
      if (taskType) {
        query = query.eq('tasks.type', taskType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data for visualization
      const performanceData = data.map(session => ({
        sessionId: session.id,
        date: session.start_time,
        taskName: session.tasks.name,
        taskType: session.tasks.type,
        accuracy: session.total_trials > 0 
          ? (session.correct_count / session.total_trials) * 100 
          : 0,
        reactionTime: session.avg_reaction_time || 0,
      }));
      
      return {
        success: true,
        data: performanceData
      };
    } catch (error) {
      console.error('Error getting performance over time:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get task performance comparison
   * 
   * @param {number} userId - User ID
   * @returns {Promise} - Result with task comparison data
   */
  async getTaskPerformanceComparison(userId) {
    try {
      // Get task types and names
      const { data: tasks, error: tasksError } = await supabase
        .from(TABLES.TASKS)
        .select('id, type, name')
        .eq('is_active', true);
      
      if (tasksError) throw tasksError;
      
      // For each task, get aggregated performance
      const taskPerformance = await Promise.all(
        tasks.map(async (task) => {
          const { data, error } = await supabase
            .from(TABLES.SESSIONS)
            .select('correct_count, total_trials, avg_reaction_time')
            .eq('user_id', userId)
            .eq('task_id', task.id)
            .eq('is_completed', true);
          
          if (error) throw error;
          
          // Calculate aggregate metrics
          let totalTrials = 0;
          let totalCorrect = 0;
          let totalReactionTime = 0;
          
          data.forEach(session => {
            totalTrials += session.total_trials || 0;
            totalCorrect += session.correct_count || 0;
            totalReactionTime += session.avg_reaction_time * (session.total_trials || 0) || 0;
          });
          
          const avgAccuracy = totalTrials > 0 ? (totalCorrect / totalTrials) * 100 : 0;
          const avgReactionTime = totalTrials > 0 ? totalReactionTime / totalTrials : 0;
          
          return {
            taskId: task.id,
            taskName: task.name,
            taskType: task.type,
            sessionsCount: data.length,
            avgAccuracy,
            avgReactionTime,
          };
        })
      );
      
      return {
        success: true,
        data: taskPerformance
      };
    } catch (error) {
      console.error('Error getting task performance comparison:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new StatisticsService();