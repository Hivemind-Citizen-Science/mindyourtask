import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { storeData, getData, removeData, STORAGE_KEYS } from '@/utils/storage';
import { useAuth } from './AuthContext';

/**
 * Task types and constants
 */
const TASK_TYPES = {
  REACTION_TIME: 'reaction-time',
  DECISION_MAKING: 'decision-making',
  SPATIAL_RECOGNITION: 'spatial-recognition',
};

/**
 * Default mock tasks
 */
const DEFAULT_TASKS = [
  {
    id: 1,
    name: 'Simple Reaction Time',
    type: TASK_TYPES.REACTION_TIME,
    description: 'Measure your baseline reaction time by responding to visual stimuli as quickly as possible.',
    instructions: 'Tap the screen as soon as you see the stimulus change color. Your reaction time will be measured.',
    estimatedTime: '5',
    pointsReward: 100,
    requiredLevel: 1,
  },
  {
    id: 2,
    name: 'Binary Decision',
    type: TASK_TYPES.DECISION_MAKING,
    description: 'Make binary choices between different options while we track your decision-making process.',
    instructions: 'Choose between two options based on your preference. We\'ll analyze your decision patterns.',
    estimatedTime: '8',
    pointsReward: 150,
    requiredLevel: 1,
  },
  {
    id: 3,
    name: 'Spatial Recognition',
    type: TASK_TYPES.SPATIAL_RECOGNITION,
    description: 'Test your spatial awareness and memory by recognizing patterns and positions.',
    instructions: 'Remember the position of items on screen, then identify them when prompted.',
    estimatedTime: '7',
    pointsReward: 125,
    requiredLevel: 2,
  },
];

/**
 * Context for task state
 */
export const TaskContext = createContext({
  tasks: [],
  activeTask: null,
  activeSession: null,
  taskStats: null,
  badges: [],
  achievements: [],
  leaderboard: [],
  userProgress: null,
  loadTasks: async () => {},
  getTaskById: (id) => {},
  getTaskByType: (type) => {},
  setActiveTask: (task) => {},
  createSession: async (taskId) => {},
  completeSession: async (sessionId, data) => {},
  loadUserProgress: async () => {},
});

/**
 * TaskProvider - Context provider for task state
 * Manages tasks, sessions, and gamification elements
 */
export const TaskProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  
  // Load tasks when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadUserProgress();
      loadLeaderboard();
      loadGamificationData();
    }
  }, [isAuthenticated]);
  
  // Check for active task in storage
  useEffect(() => {
    const checkActiveTask = async () => {
      try {
        const storedTask = await getData(STORAGE_KEYS.ACTIVE_TASK);
        if (storedTask) {
          setActiveTask(JSON.parse(storedTask));
        }
        
        const storedSession = await getData(STORAGE_KEYS.ACTIVE_SESSION);
        if (storedSession) {
          setActiveSession(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error('Error checking active task:', error);
      }
    };
    
    checkActiveTask();
  }, []);
  
  /**
   * Load all available tasks
   */
  const loadTasks = async () => {
    try {
      // Try to load from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*');
          
        if (!error && data?.length > 0) {
          setTasks(data);
          return;
        }
      }
      
      // Fall back to default tasks
      setTasks(DEFAULT_TASKS);
      
      // Store in local storage for offline use
      await storeData(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    } catch (error) {
      console.error('Error loading tasks:', error);
      
      // Try to load from local storage
      const storedTasks = await getData(STORAGE_KEYS.TASKS);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks(DEFAULT_TASKS);
      }
    }
  };
  
  /**
   * Load user progress data
   */
  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      // Try to load from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, level, total_points, streak_days, tasks_completed')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserProgress({
            currentLevel: data.level || 1,
            totalPoints: data.total_points || 0,
            nextLevelPoints: (data.level + 1) * 500, // Example formula
            streakDays: data.streak_days || 0,
            tasksCompleted: data.tasks_completed || 0,
          });
          return;
        }
      }
      
      // Fall back to mock data based on the user object
      setUserProgress({
        currentLevel: user.level || 1,
        totalPoints: user.totalPoints || 0,
        nextLevelPoints: (user.level + 1) * 500, // Example formula
        streakDays: 2,
        tasksCompleted: 14,
      });
    } catch (error) {
      console.error('Error loading user progress:', error);
      
      // Set default progress
      setUserProgress({
        currentLevel: 1,
        totalPoints: 0,
        nextLevelPoints: 500,
        streakDays: 0,
        tasksCompleted: 0,
      });
    }
  };
  
  /**
   * Load leaderboard data
   */
  const loadLeaderboard = async () => {
    if (!user) return;
    
    try {
      // Try to load from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, level, total_points, avg_accuracy, avg_reaction_time, total_sessions')
          .order('total_points', { ascending: false })
          .limit(10);
          
        if (!error && data?.length > 0) {
          const leaderboardData = data.map(item => ({
            ...item,
            is_current_user: item.id === user.id
          }));
          
          setLeaderboard(leaderboardData);
          return;
        }
      }
      
      // Fall back to mock data
      const mockLeaderboard = [
        { id: 1, username: 'ResearchPro', level: 7, total_points: 1240, avg_accuracy: 0.92, avg_reaction_time: 487, total_sessions: 34, is_current_user: false },
        { id: 2, username: 'BrainGuru', level: 6, total_points: 980, avg_accuracy: 0.89, avg_reaction_time: 512, total_sessions: 25, is_current_user: false },
        { id: 3, username: user?.username || 'You', level: user?.level || 4, total_points: user?.totalPoints || 650, avg_accuracy: 0.85, avg_reaction_time: 545, total_sessions: 14, is_current_user: true },
        { id: 4, username: 'Challenger', level: 3, total_points: 490, avg_accuracy: 0.81, avg_reaction_time: 602, total_sessions: 10, is_current_user: false },
      ];
      
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };
  
  /**
   * Load user's gamification data
   */
  const loadGamificationData = async () => {
    if (!user) return;
    
    try {
      // Try to load from Supabase
      if (supabase) {
        // Load badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .order('id');
          
        if (!badgesError && badgesData?.length > 0) {
          // TODO: Check which badges the user has earned
          setBadges(badgesData);
        }
        
        // Load achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('id');
          
        if (!achievementsError && achievementsData?.length > 0) {
          // TODO: Check user progress for each achievement
          setAchievements(achievementsData);
        }
      } else {
        // Fall back to mock data
        const mockBadges = [
          { id: 1, name: 'First Timer', description: 'Complete your first task', icon: 'Award', isEarned: true, earnedDate: '2025-04-01' },
          { id: 2, name: 'Perfectionist', description: 'Get 100% accuracy on any task', icon: 'Medal', isEarned: true, earnedDate: '2025-04-02' },
          { id: 3, name: 'Speed Demon', description: 'Average reaction time under 500ms', icon: 'TrendingUp', isEarned: false },
          { id: 4, name: 'Dedicated', description: 'Complete 10 sessions', icon: 'Trophy', isEarned: false },
        ];
        
        const mockAchievements = [
          { id: 1, name: 'Task Master', description: 'Complete all task types', icon: 'Trophy', progress: 30, max: 100 },
          { id: 2, name: 'Consistent', description: 'Complete tasks 3 days in a row', icon: 'Award', progress: 66, max: 100 },
        ];
        
        setBadges(mockBadges);
        setAchievements(mockAchievements);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };
  
  /**
   * Get a task by its ID
   */
  const getTaskById = (id) => {
    return tasks.find(task => task.id === parseInt(id) || task.id === id);
  };
  
  /**
   * Get a task by its type
   */
  const getTaskByType = (type) => {
    return tasks.find(task => task.type === type);
  };
  
  /**
   * Create a new session for a task
   */
  const createSession = async (taskId) => {
    try {
      const task = getTaskById(taskId);
      if (!task) throw new Error('Task not found');
      
      const sessionData = {
        id: Date.now(), // For demo, use timestamp as ID
        taskId,
        userId: user?.id,
        startTime: new Date(),
        isCompleted: false,
      };
      
      // Store in Supabase if available
      if (supabase && user && !user.isDemo) {
        const { data, error } = await supabase
          .from('sessions')
          .insert([{
            task_id: taskId,
            user_id: user.id,
            start_time: sessionData.startTime,
            is_completed: false,
          }])
          .select('*')
          .single();
          
        if (!error && data) {
          setActiveSession(data);
          await storeData(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(data));
          return data;
        }
      }
      
      // Store locally for demo/offline
      setActiveSession(sessionData);
      await storeData(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };
  
  /**
   * Complete a session and record results
   */
  const completeSession = async (sessionId, results = {}) => {
    try {
      const session = activeSession;
      if (!session) throw new Error('No active session found');
      
      const task = getTaskById(session.taskId || session.task_id);
      if (!task) throw new Error('Task not found');
      
      // Calculate stats
      const completionData = {
        isCompleted: true,
        endTime: new Date(),
        correctCount: results.correctCount || 0,
        totalTrials: results.totalTrials || 10,
        avgReactionTime: results.avgReactionTime || 600,
      };
      
      // Points earned based on performance
      const accuracy = completionData.correctCount / completionData.totalTrials;
      const pointsEarned = Math.round(task.pointsReward * accuracy);
      
      // Set task stats for the results screen
      setTaskStats({
        accuracy,
        avgReactionTime: completionData.avgReactionTime,
        timeSpent: `${Math.round((new Date() - new Date(session.startTime || session.start_time)) / 60000)} minutes`,
        pointsEarned,
        newBadges: [], // Would be populated with any new badges earned
      });
      
      // Update in Supabase if available
      if (supabase && user && !user.isDemo) {
        const { error } = await supabase
          .from('sessions')
          .update({
            is_completed: true,
            end_time: completionData.endTime,
            correct_count: completionData.correctCount,
            total_trials: completionData.totalTrials,
            avg_reaction_time: completionData.avgReactionTime,
            points_earned: pointsEarned,
          })
          .eq('id', sessionId);
          
        if (error) {
          console.error('Error updating session:', error);
        }
        
        // Update user stats
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('level, total_points, tasks_completed')
          .eq('id', user.id)
          .single();
          
        if (!userError && userData) {
          const updatedPoints = (userData.total_points || 0) + pointsEarned;
          const updatedTasksCompleted = (userData.tasks_completed || 0) + 1;
          
          // Simple level calculation - adjust as needed
          let newLevel = userData.level || 1;
          const pointsForNextLevel = newLevel * 500;
          if (updatedPoints >= pointsForNextLevel) {
            newLevel += 1;
          }
          
          await supabase
            .from('users')
            .update({
              total_points: updatedPoints,
              tasks_completed: updatedTasksCompleted,
              level: newLevel,
              last_activity: new Date(),
            })
            .eq('id', user.id);
            
          // Update user progress in context
          setUserProgress(prev => ({
            ...prev,
            currentLevel: newLevel,
            totalPoints: updatedPoints,
            nextLevelPoints: (newLevel + 1) * 500,
            tasksCompleted: updatedTasksCompleted,
          }));
        }
      } else if (user) {
        // Update local user data for demo mode
        const updatedPoints = (user.totalPoints || 0) + pointsEarned;
        const updatedTasksCompleted = 15; // Mock value
        
        // Simple level calculation
        let newLevel = user.level || 1;
        const pointsForNextLevel = newLevel * 500;
        if (updatedPoints >= pointsForNextLevel) {
          newLevel += 1;
        }
        
        const updatedUser = {
          ...user,
          totalPoints: updatedPoints,
          level: newLevel,
        };
        
        await storeData(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        
        // Update user progress in context
        setUserProgress(prev => ({
          ...prev,
          currentLevel: newLevel,
          totalPoints: updatedPoints,
          nextLevelPoints: (newLevel + 1) * 500,
          tasksCompleted: updatedTasksCompleted,
        }));
      }
      
      // Clear active session
      await removeData(STORAGE_KEYS.ACTIVE_SESSION);
      setActiveSession(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error completing session:', error);
      return { success: false, error: error.message };
    }
  };
  
  const contextValue = {
    tasks,
    activeTask,
    activeSession,
    taskStats,
    badges,
    achievements,
    leaderboard,
    userProgress,
    loadTasks,
    getTaskById,
    getTaskByType,
    setActiveTask,
    createSession,
    completeSession,
    loadUserProgress,
  };
  
  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => useContext(TaskContext);