// Task Types
export const TASK_TYPES = {
  RANDOM_DOT_MOTION: 'random_dot_motion',
  VELOCITY_PERCEPTION: 'velocity_perception',
  POSITION_PERCEPTION: 'position_perception',
};

// Task Names (user-friendly)
export const TASK_NAMES = {
  [TASK_TYPES.RANDOM_DOT_MOTION]: 'Random Dot Motion',
  [TASK_TYPES.VELOCITY_PERCEPTION]: 'Velocity Perception',
  [TASK_TYPES.POSITION_PERCEPTION]: 'Position Perception',
};

// Default tasks for the app
export const DEFAULT_TASKS = [
  {
    id: 1,
    type: TASK_TYPES.RANDOM_DOT_MOTION,
    name: 'Random Dot Motion Task',
    description: 'Determine the dominant direction of moving dots',
    instructions: 'Watch the cloud of moving dots. Decide whether the majority of dots are moving to the left or right.',
    config: {
      dotCount: 100,
      dotSize: 4,
      dotSpeed: 5,
      coherenceLevel: 0.3,
      trialCount: 10,
    },
    responseOptions: ['left', 'right'],
  },
  {
    id: 2,
    type: TASK_TYPES.VELOCITY_PERCEPTION,
    name: 'Velocity Perception Task',
    description: 'Compare the speeds of two moving patches',
    instructions: 'You will see two patches moving one after another. Decide which one moved faster.',
    config: {
      standardVelocities: [40, 50],
      embeddedMotions: [10, -10],
      comparisonVelocities: [10, 20, 30, 40, 50, 60, 70],
      patchMotionDuration: 600,
      intervalBetweenPatches: 500,
      trialCount: 10,
    },
    responseOptions: ['first', 'second'],
  },
  {
    id: 3,
    type: TASK_TYPES.POSITION_PERCEPTION,
    name: 'Position Perception Task',
    description: 'Compare the final positions of two moving patches',
    instructions: 'You will see two patches moving one after another. Each will disappear after some time. Decide which one disappeared further to the right.',
    config: {
      standardVelocities: [40, 50],
      embeddedMotions: [10, -10],
      patchMotionDuration40: 700,
      patchMotionDuration50: 540,
      intervalBetweenPatches: 500,
      trialCount: 10,
    },
    responseOptions: ['first', 'second'],
  },
];

// Session constants
export const SESSION_CONSTANTS = {
  DEFAULT_TRIAL_COUNT: 10,
  MIN_TRIALS_PER_SESSION: 5,
  MAX_TRIALS_PER_SESSION: 20,
  SESSION_TIMEOUT_MINUTES: 10,
};

// Response types
export const RESPONSE_TYPES = {
  BINARY_CHOICE: 'binary_choice',
  SLIDER: 'slider',
  SWIPE: 'swipe',
};

// User profile constants
export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
];

export const AGE_RANGE_OPTIONS = [
  'Under 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
  'Prefer not to say',
];