import { supabase, TABLES } from '@/config/supabase';

/**
 * Task Service - Handles task-related operations
 * Manages sessions, trials, and task data
 */
class TaskService {
  /**
   * Load all available tasks
   * 
   * @returns {Promise} - Result with tasks array
   */
  async loadTasks() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (error) throw error;
      
      return {
        success: true,
        data: data.map(task => ({
          ...task,
          config: JSON.parse(task.config)
        }))
      };
    } catch (error) {
      console.error('Error loading tasks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new session for a task
   * 
   * @param {number} userId - User ID
   * @param {number} taskId - Task ID
   * @returns {Promise} - Result with session data
   */
  async createSession(userId, taskId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .insert({
          user_id: userId,
          task_id: taskId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new trial for a session
   * 
   * @param {number} sessionId - Session ID
   * @param {number} trialNumber - Trial number
   * @param {object} parameters - Trial parameters
   * @param {string} expectedResponse - Expected response
   * @returns {Promise} - Result with trial data
   */
  async createTrial(sessionId, trialNumber, parameters, expectedResponse) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRIALS)
        .insert({
          session_id: sessionId,
          trial_number: trialNumber,
          parameters: JSON.stringify(parameters),
          expected_response: expectedResponse,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creating trial:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record a response for a trial
   * 
   * @param {number} trialId - Trial ID
   * @param {string} responseValue - User's response
   * @param {number} reactionTime - Reaction time in ms
   * @param {number} movementTime - Movement time in ms
   * @param {boolean} isCorrect - Whether the response is correct
   * @returns {Promise} - Result with response data
   */
  async recordResponse(trialId, responseValue, reactionTime, movementTime, isCorrect) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RESPONSES)
        .insert({
          trial_id: trialId,
          response_value: responseValue,
          reaction_time: reactionTime,
          movement_time: movementTime,
          is_correct: isCorrect,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error recording response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record response trajectory data
   * 
   * @param {number} responseId - Response ID
   * @param {array} trajectoryData - Array of trajectory points
   * @returns {Promise} - Result with trajectory data
   */
  async recordTrajectory(responseId, trajectoryData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRAJECTORIES)
        .insert({
          response_id: responseId,
          trajectory_data: JSON.stringify(trajectoryData),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error recording trajectory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Complete a session
   * 
   * @param {number} sessionId - Session ID
   * @param {number} userId - User ID
   * @param {number} taskId - Task ID
   * @param {number} correctCount - Number of correct responses
   * @param {number} totalReactionTime - Sum of all reaction times
   * @returns {Promise} - Result with success status
   */
  async completeSession(sessionId, userId, taskId, correctCount, totalReactionTime) {
    try {
      // Get total trials count
      const { data: trials, error: trialsError } = await supabase
        .from(TABLES.TRIALS)
        .select('id')
        .eq('session_id', sessionId);
        
      if (trialsError) throw trialsError;
      
      const totalTrials = trials.length;
      const avgReactionTime = totalTrials > 0 ? totalReactionTime / totalTrials : 0;
      
      // Update session
      const { error } = await supabase
        .from(TABLES.SESSIONS)
        .update({
          end_time: new Date().toISOString(),
          is_completed: true,
          correct_count: correctCount,
          total_trials: totalTrials,
          avg_reaction_time: avgReactionTime,
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      return {
        success: true,
        data: {
          sessionId,
          correctCount,
          totalTrials,
          avgReactionTime,
        }
      };
    } catch (error) {
      console.error('Error completing session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a session with trials and responses
   * 
   * @param {number} sessionId - Session ID
   * @returns {Promise} - Result with session data
   */
  async getSessionData(sessionId) {
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      
      // Get trials
      const { data: trials, error: trialsError } = await supabase
        .from(TABLES.TRIALS)
        .select('*')
        .eq('session_id', sessionId)
        .order('trial_number', { ascending: true });
      
      if (trialsError) throw trialsError;
      
      // Get responses for each trial
      const trialsWithResponses = await Promise.all(
        trials.map(async (trial) => {
          const { data: responses, error: responsesError } = await supabase
            .from(TABLES.RESPONSES)
            .select('*')
            .eq('trial_id', trial.id);
          
          if (responsesError) throw responsesError;
          
          return {
            ...trial,
            parameters: JSON.parse(trial.parameters),
            responses,
          };
        })
      );
      
      return {
        success: true,
        data: {
          ...session,
          trials: trialsWithResponses,
        }
      };
    } catch (error) {
      console.error('Error getting session data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get completed tasks for today
   * 
   * @param {number} userId - User ID
   * @returns {Promise} - Result with completed task IDs
   */
  async getTodayCompletedTasks(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('task_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('end_time', today.toISOString());
      
      if (error) throw error;
      
      return {
        success: true,
        data: data.map(session => session.task_id)
      };
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save current task state
   * 
   * @param {object} task - Current task
   * @returns {Promise} - Result with success status
   */
  async saveCurrentTask(task) {
    try {
      // Store in localStorage instead of making a database call
      localStorage.setItem('currentTask', JSON.stringify(task));
      return {
        success: true
      };
    } catch (error) {
      console.error('Error saving current task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save current trial state
   * 
   * @param {object} trialData - Trial data
   * @returns {Promise} - Result with success status
   */
  async saveCurrentTrial(trialData) {
    try {
      // Store in localStorage instead of making a database call
      localStorage.setItem('currentTrial', JSON.stringify(trialData));
      return {
        success: true
      };
    } catch (error) {
      console.error('Error saving current trial:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TaskService();