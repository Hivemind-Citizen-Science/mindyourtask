import React, { useState, useCallback, useRef, FC } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Text, useTheme, IndexPath } from '@ui-kitten/components';
import { useAuth  } from '../../context/AuthContext';
import { useTask  } from '../../context/TaskContext';
import VelocityPerception from '../../components/TaskComponents/VelocityPerception';
import SwipeTracker, { SwipeCompleteData } from '../../components/TaskComponents/SwipeTracker';
import TrialComponent from '../../components/TaskComponents/TrialComponent';
import taskService from '../../services/taskService';

const { width, height } = Dimensions.get('window');

// Based on AuthContext.js
interface User {
  id: string;
  username?: string;
  email?: string;
  level?: number;
  totalPoints?: number;
  isDemo?: boolean;
  // Add other user properties if needed
}

// Based on TaskContext.js
interface Task {
  id: number | string; // id can be number (DEFAULT_TASKS) or string (from Supabase)
  name: string;
  type: string;
  description?: string;
  instructions?: string;
  estimatedTime?: string;
  pointsReward?: number;
  requiredLevel?: number;
  // Add other task properties if needed
}

interface AuthContextType {
  user: User | null;
  session: any; // Replace 'any' with a more specific session type if available
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email?: string, password?: string) => Promise<any>; // Replace 'any' with a more specific return type
  signUp: (email?: string, password?: string, userData?: any) => Promise<any>; // Replace 'any'
  signOut: () => Promise<any>; // Replace 'any'
  resetPassword: (email?: string) => Promise<any>; // Replace 'any'
  updateProfile: (profileData?: any) => Promise<any>; // Replace 'any'
}

interface TaskContextType {
  tasks: Task[];
  activeTask: Task | null;
  activeSession: SessionData | null; // Using SessionData defined below
  taskStats: any; // Replace 'any'
  badges: any[]; // Replace 'any'
  achievements: any[]; // Replace 'any'
  leaderboard: any[]; // Replace 'any'
  userProgress: any; // Replace 'any'
  loadTasks: () => Promise<void>;
  getTaskById: (id: number | string) => void;
  getTaskByType: (type: string) => void;
  setActiveTask: (task: Task | null) => void;
  createSession: (taskId: number | string) => Promise<any>; // Replace 'any'
  completeSession: (sessionId: string, data?: any) => Promise<any>; // Replace 'any'
  loadUserProgress: () => Promise<void>;
  markTaskComplete?: (taskId: number | string) => void; // Optional, as it wasn't in the original context
}

interface TaskParams {
  numTrials: number;
  restingTime: number;
  stimulusTime: number;
  intervalTime: number;
  feedbackTime: number;
  standardVelocities: number[];
  embeddedMotions: number[];
  comparisonVelocities40: number[];
  comparisonVelocities50: number[];
}

interface TrialParameters {
  standardVelocity: number;
  embeddedMotion: number;
  comparisonVelocity: number;
  standardFirst: boolean;
  standardTime: number;
  comparisonTime: number;
  firstVelocity: number;
  firstEmbeddedMotion: number;
  firstTime: number;
  secondVelocity: number;
  secondEmbeddedMotion: number;
  secondTime: number;
}

interface Trial {
  parameters: TrialParameters;
  expectedResponse: 'left' | 'right';
}

interface SessionData {
  id: string;
  // Add other session properties as needed
}

type Phase = 'initial' | 'resting' | 'stimulus1' | 'interval' | 'stimulus2' | 'response' | 'feedback' | 'complete';

const VelocityPerceptionTask: FC = () => {
  const theme = useTheme();
  const { user } = useAuth() ;
//   const { activeTask, setActiveTask, completeSession, activeSession } = useTask() ;

  // Task state
  const [phase, setPhase] = useState<Phase>('initial');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseEndTime, setResponseEndTime] = useState<number | null>(null);
  const [responseValue, setResponseValue] = useState<'left' | 'right' | null>(null);
  const [correctResponses, setCorrectResponses] = useState<number>(0);
  const [totalReactionTime, setTotalReactionTime] = useState<number>(0);

  // Task parameters
  const taskParams = useRef<TaskParams>({
    numTrials: 10,
    restingTime: 1000, // ms
    stimulusTime: 700, // ms for 40 cm/sec, 540 ms for 50 cm/sec
    intervalTime: 600, // ms (random between 500-700ms)
    feedbackTime: 1000, // ms
    standardVelocities: [40, 50], // cm/sec
    embeddedMotions: [10, -10], // cm/sec
    comparisonVelocities40: [10, 20, 30, 40, 50, 60, 70], // cm/sec, for standard 40 cm/sec
    comparisonVelocities50: [20, 30, 40, 50, 60, 70, 80], // cm/sec, for standard 50 cm/sec
  });

  // Current trial data
  const currentTrial = trials[currentTrialIndex];

  // Reset task when screen gains focus
  useFocusEffect(
    useCallback(() => {
      initializeTask();

      return () => {
        // Clean up if needed, e.g. clear active task from context
        // setActiveTask(null); 
      };
    }, [])
  );

  // Initialize the task
  const initializeTask = async () => {
    // Ensure activeTask is set, if not, this screen might have been opened directly
    // Or, it might be appropriate to load a default task or navigate away.
    // if (!activeTask) {
    //     console.warn("VelocityPerceptionTask initialized without an activeTask.");
    //     // Potentially set a default task or navigate, for now, we proceed cautiously
    // }

    // Create a new session using context function if user and activeTask are present
    // The local `session` state is replaced by `activeSession` from TaskContext
    // if (user && activeTask && activeTask.id) {
    //   try {
    //     const sessionResponse = await createSession(activeTask.id); // from TaskContext
    //     // The createSession in TaskContext should handle setting activeSession
    //     // if (!sessionResponse || !sessionResponse.id) { // Adjust based on actual response
    //     //   console.error('Failed to create session via context');
    //     //   return;
    //     // }
    //   } catch (error) {
    //     console.error('Error creating session:', error);
    //     return;
    //   }
    // }

    const newTrials = generateTrials(taskParams.current.numTrials);
    setTrials(newTrials);

    // Record each trial in the database (commented out, uses activeSession from context)
    // if (activeSession) {
    //   await Promise.all(
    //     newTrials.map(async (trial, index) => {
    //       await taskService.createTrial(
    //         activeSession.id, 
    //         index + 1, 
    //         trial.parameters,
    //         trial.expectedResponse
    //       );
    //     })
    //   );
    // }

    setCurrentTrialIndex(0);
    setPhase('initial');
    setCorrectResponses(0);
    setTotalReactionTime(0);
  };

  // Generate trials
  const generateTrials = (numTrials: number): Trial[] => {
    const newTrials: Trial[] = [];

    for (let i = 0; i < numTrials; i++) {
      const standardVelocity = taskParams.current.standardVelocities[
        Math.floor(Math.random() * taskParams.current.standardVelocities.length)
      ];

      const embeddedMotion = taskParams.current.embeddedMotions[
        Math.floor(Math.random() * taskParams.current.embeddedMotions.length)
      ];

      const comparisonVelocities = standardVelocity === 40
        ? taskParams.current.comparisonVelocities40
        : taskParams.current.comparisonVelocities50;

      const comparisonVelocity = comparisonVelocities[
        Math.floor(Math.random() * comparisonVelocities.length)
      ];

      const standardEffectiveVelocity = standardVelocity + embeddedMotion;
      const fasterPatch = comparisonVelocity > standardEffectiveVelocity ? 'second' : 'first';

      const standardFirst = Math.random() < 0.5;
      const expectedResponse = standardFirst
        ? (fasterPatch === 'first' ? 'left' : 'right')
        : (fasterPatch === 'first' ? 'right' : 'left');

      const standardTime = standardVelocity === 40 ? 700 : 540;
      const comparisonTime = standardVelocity === 40 ? 700 : 540;

      newTrials.push({
        parameters: {
          standardVelocity,
          embeddedMotion,
          comparisonVelocity,
          standardFirst,
          standardTime,
          comparisonTime,
          firstVelocity: standardFirst ? standardVelocity : comparisonVelocity,
          firstEmbeddedMotion: standardFirst ? embeddedMotion : 0,
          firstTime: standardFirst ? standardTime : comparisonTime,
          secondVelocity: standardFirst ? comparisonVelocity : standardVelocity,
          secondEmbeddedMotion: standardFirst ? 0 : embeddedMotion,
          secondTime: standardFirst ? comparisonTime : standardTime,
        },
        expectedResponse,
      });
    }

    return newTrials;
  };

  // Start the next trial
  const startNextTrial = () => {
    if (currentTrialIndex >= trials.length) {
      handleCompleteSession(); // Changed from completeSession to avoid conflict and use context based one
      return;
    }

    setPhase('resting');
    setStartTime(Date.now());
    setResponseStartTime(null);
    setResponseEndTime(null);
    setResponseValue(null);

    const runSequence = async () => {
      await new Promise(resolve => setTimeout(resolve, taskParams.current.restingTime));
      setPhase('stimulus1');
      await new Promise(resolve => setTimeout(resolve, currentTrial?.parameters.firstTime || 700));
      setPhase('interval');
      await new Promise(resolve => setTimeout(resolve, taskParams.current.intervalTime));
      setPhase('stimulus2');
      await new Promise(resolve => setTimeout(resolve, currentTrial?.parameters.secondTime || 700));
      setPhase('response');
      setResponseStartTime(Date.now());
    };

    runSequence();
  };

  // Handle response
  const handleResponse = async (response: 'left' | 'right', trajectoryData: any) => { // TODO: Define trajectoryData type
    if (phase !== 'response' || !currentTrial || responseStartTime === null || startTime === null) return;

    const endTime = Date.now();
    setResponseEndTime(endTime);
    setResponseValue(response);

    const reactionTime = responseStartTime - (startTime + taskParams.current.restingTime +
      currentTrial.parameters.firstTime + taskParams.current.intervalTime +
      currentTrial.parameters.secondTime);

    const movementTime = endTime - responseStartTime;
    const isCorrect = response === currentTrial.expectedResponse;

    if (isCorrect) {
      setCorrectResponses(prev => prev + 1);
    }
    setTotalReactionTime(prev => prev + reactionTime);

    // const trialId = currentTrialIndex + 1; 
    // if (activeSession) { 
    //   const responseResult = await taskService.recordResponse(
    //     activeSession.id, 
    //     trialId, 
    //     response,
    //     reactionTime,
    //     movementTime,
    //     isCorrect
    //   );

    //   if (responseResult.success && responseResult.data) { 
    //     await taskService.recordTrajectory(
    //       responseResult.data.id, 
    //       trajectoryData
    //     );
    //   }
    // }

    setPhase('feedback');

    setTimeout(() => {
      setCurrentTrialIndex(prev => prev + 1);
      startNextTrial();
    }, taskParams.current.feedbackTime);
  };

  // Complete the session - Renamed to avoid conflict with component's own state management logic
  const handleCompleteSession = async () => {
    // if (!activeSession || !user || !activeTask || !activeTask.id) return;

    setPhase('complete');

    // Use completeSession from TaskContext
    // await completeSession(activeSession.id, {
    //     userId: user.id,
    //     taskId: activeTask.id,
    //     correctResponses,
    //     totalReactionTime,
    //     // Any other data to pass to the context's completeSession
    // });
    
    // The original markTaskComplete is not in TaskContext, 
    // but perhaps completeSession in context handles this logic.
    // If a separate markTaskComplete function exists in context and is needed:
    // if (markTaskComplete) {
    //   markTaskComplete(activeTask.id);
    // }
  };

  const getSwipeDirection = (trajectoryData: SwipeCompleteData | null): 'left' | 'right' | null => {
    if (!trajectoryData || trajectoryData.trajectory.length < 2) return null;

    const startPos = trajectoryData.startPosition;
    const endPos = trajectoryData.endPosition;
    const deltaX = endPos.x - startPos.x;

    if (Math.abs(deltaX) < 20) return null;
    return deltaX > 0 ? 'right' : 'left';
  };

  const renderResting = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.fixationPoint} />
      <Text style={styles.instruction}>Keep your finger here...</Text>
    </View>
  );

  const renderStimulus1 = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.instruction}>Watch the first patch</Text>
      <VelocityPerception
        isFirst={true}
        velocity={currentTrial?.parameters.firstVelocity || 40}
        embeddedMotion={currentTrial?.parameters.firstEmbeddedMotion || 0}
        duration={currentTrial?.parameters.firstTime || 700}
        width={width * 0.9}
        height={height * 0.4}
      />
    </View>
  );

  const renderInterval = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.fixationPoint} />
      <Text style={styles.instruction}>Wait for the second patch...</Text>
    </View>
  );

  const renderStimulus2 = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.instruction}>Watch the second patch</Text>
      <VelocityPerception
        isFirst={false}
        velocity={currentTrial?.parameters.secondVelocity || 40}
        embeddedMotion={currentTrial?.parameters.secondEmbeddedMotion || 0}
        duration={currentTrial?.parameters.secondTime || 700}
        width={width * 0.9}
        height={height * 0.4}
      />
    </View>
  );

  const renderResponse = () => (
    <SwipeTracker
      onSwipeComplete={(data) => {
        const direction = getSwipeDirection(data);
        if (direction) {
          handleResponse(direction, data.trajectory);
        }
      }}
      style={styles.swipeContainer}
    >
      <View style={styles.centeredContainer}>
        <Text style={styles.instruction}>
          Which patch was moving faster?
          Swipe LEFT if the FIRST patch was faster.
          Swipe RIGHT if the SECOND patch was faster.
        </Text>
        <View style={styles.responseButtons}>
          <View style={styles.leftTarget}>
            <Text>First Patch</Text>
          </View>
          <View style={styles.rightTarget}>
            <Text>Second Patch</Text>
          </View>
        </View>
      </View>
    </SwipeTracker>
  );

  const renderFeedback = () => {
    const isCorrect = responseValue === currentTrial?.expectedResponse;

    return (
      <View style={styles.centeredContainer}>
        <Text
          style={styles.feedbackText}
          status={isCorrect ? 'success' : 'danger'}
        >
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </Text>
      </View>
    );
  };

  if (phase === 'initial') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
        <View style={styles.container}>
          <Text category="h1" style={styles.title}>
            Vroom Vroom...
          </Text>
          <Text style={styles.description}>
            In this task, you'll see two patches moving across the screen one after the other.
            Your job is to determine which patch was moving faster.
          </Text>
          <Text style={[styles.description, { marginTop: 20 }]}>
            You'll complete {taskParams.current.numTrials} trials. After seeing both patches,
            swipe LEFT if the FIRST patch was faster, or RIGHT if the SECOND patch was faster.
          </Text>
          <Button
            onPress={startNextTrial}
            style={styles.button}
          >
            Start Task
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'complete') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
        <View style={styles.container}>
          <Text category="h1" style={styles.title}>
            Task Complete!
          </Text>
          <Text style={styles.description}>
            Great job! You correctly identified {correctResponses} out of {trials.length} velocity comparisons.
          </Text>
          <Text style={[styles.description, { marginTop: 20 }]}>
            Your average reaction time was {trials.length > 0 ? Math.round(totalReactionTime / trials.length) : 0} milliseconds.
          </Text>
          <Button
            style={styles.button}
            // onPress={() => { /* Navigate back or handle completion */ }}
          >
            Back to Tasks
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <View style={styles.container}>
        <Text style={styles.progress}>
          Trial {currentTrialIndex + 1} of {trials.length}
        </Text>
        <TrialComponent
          phase={phase}
          parameters={currentTrial?.parameters}
          onResting={renderResting}
          onStimulus1={renderStimulus1}
          onInterval={renderInterval}
          onStimulus2={renderStimulus2}
          onResponse={renderResponse}
          onFeedback={renderFeedback}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#fff', // Consider using theme.colors.background
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 10,
  },
  progress: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  button: {
    marginTop: 30,
    alignSelf: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixationPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red', // Consider using theme.colors.primary
    marginBottom: 10,
  },
  instruction: {
    textAlign: 'center',
    marginBottom: 20,
  },
  swipeContainer: {
    flex: 1,
    width: '100%',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
  },
  leftTarget: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc', // Consider using theme.colors.border
    borderRadius: 10,
  },
  rightTarget: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc', // Consider using theme.colors.border
    borderRadius: 10,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default VelocityPerceptionTask; 