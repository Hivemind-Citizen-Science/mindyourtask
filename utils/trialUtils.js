import { TASK_TYPES, RESPONSE_TYPES } from '@/config/constants';

/**
 * Trial Utilities
 * Provides helper functions for generating and managing trial parameters
 */

/**
 * Generate parameters for a trial based on task type
 * 
 * @param {string} taskType - Type of task
 * @param {object} taskConfig - Task configuration
 * @returns {object} Trial parameters
 */
export const generateTrialParameters = (taskType, taskConfig) => {
  switch (taskType) {
    case TASK_TYPES.RANDOM_DOT_MOTION:
      return generateRandomDotMotionParameters(taskConfig);
    
    case TASK_TYPES.VELOCITY_PERCEPTION:
      return generateVelocityPerceptionParameters(taskConfig);
    
    case TASK_TYPES.POSITION_PERCEPTION:
      return generatePositionPerceptionParameters(taskConfig);
    
    default:
      console.warn(`Unknown task type: ${taskType}`);
      return {};
  }
};

/**
 * Generate parameters for Random Dot Motion task
 * 
 * @param {object} config - Task configuration
 * @returns {object} Trial parameters
 */
const generateRandomDotMotionParameters = (config) => {
  // Default values if config is missing
  const dotCount = config?.dotCount || 100;
  const dotSize = config?.dotSize || 4;
  const dotSpeed = config?.dotSpeed || 5;
  const coherenceLevel = config?.coherenceLevel || 0.3;
  
  // Randomly determine coherent direction
  const coherentDirection = Math.random() < 0.5 ? 'left' : 'right';
  
  return {
    dotCount,
    dotSize,
    dotSpeed,
    coherence: coherenceLevel,
    coherentDirection,
  };
};

/**
 * Generate parameters for Velocity Perception task
 * 
 * @param {object} config - Task configuration
 * @returns {object} Trial parameters
 */
const generateVelocityPerceptionParameters = (config) => {
  // Default values if config is missing
  const standardVelocities = config?.standardVelocities || [40, 50];
  const embeddedMotions = config?.embeddedMotions || [10, -10];
  const comparisonVelocities = config?.comparisonVelocities || [10, 20, 30, 40, 50, 60, 70];
  const patchMotionDuration = config?.patchMotionDuration || 600;
  const intervalBetweenPatches = config?.intervalBetweenPatches || 500;
  
  // Randomly select standard velocity and embedded motion
  const standardVelocity = standardVelocities[Math.floor(Math.random() * standardVelocities.length)];
  const standardEmbeddedMotion = embeddedMotions[Math.floor(Math.random() * embeddedMotions.length)];
  
  // Calculate effective standard velocity
  const effectiveStandardVelocity = standardVelocity + standardEmbeddedMotion;
  
  // Randomly select comparison velocity
  const comparisonVelocity = comparisonVelocities[Math.floor(Math.random() * comparisonVelocities.length)];
  
  // Determine which patch is faster
  const fasterPatch = effectiveStandardVelocity > comparisonVelocity ? 'first' : 'second';
  
  return {
    standardVelocity,
    standardEmbeddedMotion,
    comparisonVelocity,
    patchMotionDuration,
    intervalBetweenPatches,
    fasterPatch,
  };
};

/**
 * Generate parameters for Position Perception task
 * 
 * @param {object} config - Task configuration
 * @returns {object} Trial parameters
 */
const generatePositionPerceptionParameters = (config) => {
  // Default values if config is missing
  const standardVelocities = config?.standardVelocities || [40, 50];
  const embeddedMotions = config?.embeddedMotions || [10, -10];
  const patchMotionDuration40 = config?.patchMotionDuration40 || 700;
  const patchMotionDuration50 = config?.patchMotionDuration50 || 540;
  const intervalBetweenPatches = config?.intervalBetweenPatches || 500;
  
  // Randomly select standard velocity and embedded motion
  const standardVelocity = standardVelocities[Math.floor(Math.random() * standardVelocities.length)];
  const standardEmbeddedMotion = embeddedMotions[Math.floor(Math.random() * embeddedMotions.length)];
  
  // For comparison patch, use same velocity but no embedded motion
  const comparisonVelocity = standardVelocity;
  
  // Calculate travel distances
  // Duration depends on velocity (40 cm/sec for 700ms, 50 cm/sec for 540ms)
  const standardDuration = standardVelocity === 40 ? patchMotionDuration40 : patchMotionDuration50;
  const comparisonDuration = standardDuration;
  
  // Calculate effective distances
  const effectiveStandardVelocity = standardVelocity + standardEmbeddedMotion;
  const standardDistance = (effectiveStandardVelocity * standardDuration / 1000);
  const comparisonDistance = (comparisonVelocity * comparisonDuration / 1000);
  
  // Determine which patch disappears further to the right
  const furtherPatch = standardDistance > comparisonDistance ? 'first' : 'second';
  
  return {
    standardVelocity,
    standardEmbeddedMotion,
    comparisonVelocity,
    patchMotionDuration40,
    patchMotionDuration50,
    intervalBetweenPatches,
    standardDistance,
    comparisonDistance,
    furtherPatch,
  };
};

/**
 * Calculate if a response is correct for a given trial
 * 
 * @param {string} taskType - Type of task
 * @param {object} parameters - Trial parameters
 * @param {string} response - User's response
 * @returns {boolean} Whether the response is correct
 */
export const isResponseCorrect = (taskType, parameters, response) => {
  switch (taskType) {
    case TASK_TYPES.RANDOM_DOT_MOTION:
      return response === parameters.coherentDirection;
    
    case TASK_TYPES.VELOCITY_PERCEPTION:
      return response === parameters.fasterPatch;
    
    case TASK_TYPES.POSITION_PERCEPTION:
      return response === parameters.furtherPatch;
    
    default:
      console.warn(`Unknown task type: ${taskType}`);
      return false;
  }
};
