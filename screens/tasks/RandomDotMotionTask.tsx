import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, GestureResponderEvent } from 'react-native';
import { Button, Text, useTheme } from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTask } from '@/context/TaskContext';
import RandomDotMotion from '@/components/tasks/direction/RandomDotMotion';
import SwipeTracker, { SwipeCompleteData } from '@/components/TaskComponents/SwipeTracker'; // Assuming SwipeData is exported from SwipeTracker
import TrialComponent from '@/components/TaskComponents/TrialComponent';
import taskService from '@/services/taskService';
import { useRouter } from 'expo-router';
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react-native';
import TabOptionsSheet, { TabOptionsSheetRef, Settings as TabSettings } from '@/components/TabOptionsSheet';

const { width, height } = Dimensions.get('window');

// Type Definitions
type Phase = 'initial' | 'resting' | 'stimulus' | 'response' | 'feedback' | 'complete';
type Direction = 'left' | 'right';

interface TrialParameters {
  direction: Direction;
  coherence: number;
  dotCount: number;
  speed: number;
}

interface Trial {
  parameters: TrialParameters;
  expectedResponse: Direction;
}

interface TaskParameters {
  numTrials: number;
  restingTime: number; // ms
  stimulusTime: number; // ms
  feedbackTime: number; // ms
  coherenceLevels: number[];
}

// Assuming a structure for Session based on usage, though API calls are commented out
interface Session {
  id: string; // or number, depending on your API
  // Add other session properties if known
}

const RandomDotMotionTask: React.FC = () => {
  const router = useRouter();
  const themeColors = useTheme();
  const { user } = useAuth();
//   const { activeTask, markTaskComplete } = useTask();
  const sheetRef = useRef<TabOptionsSheetRef>(null);

  // Task state
  const [phase, setPhase] = useState<Phase>('initial');
  const [session, setSession] = useState<Session | null>(null);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseEndTime, setResponseEndTime] = useState<number | null>(null);
  const [responseValue, setResponseValue] = useState<Direction | null>(null);
  const [correctResponses, setCorrectResponses] = useState<number>(0);
  const [totalReactionTime, setTotalReactionTime] = useState<number>(0);
  const [taskSettings, setTaskSettings] = useState<TabSettings>({ // Add state for settings
    canvasShape: 'circle',
    dotBackground: '#FFFFFF',
    dotColor: 'black',
    coherence: 0.3, // Default coherence, will be updated by sheet if changed
  });

  // Task parameters
  const taskParams = useRef<TaskParameters>({
    numTrials: 5,
    restingTime: 1000, // ms
    stimulusTime: 2000, // ms
    feedbackTime: 1000, // ms
    coherenceLevels: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
  });

  // Current trial data
  const currentTrial = trials[currentTrialIndex];

  // Callback for when settings are changed in the sheet
  const handleSettingsApply = (newSettings: TabSettings) => {
    setTaskSettings(newSettings);
    // Optionally, re-initialize or update task aspects based on newSettings
    // For example, if coherence is a global setting rather than per-trial:
    // taskParams.current.coherenceLevels = [newSettings.coherence]; // Or adjust how trials are generated

    // If numTrials or other fundamental parameters change, you might need to re-initialize
    // For now, we assume settings primarily affect visual aspects or per-trial parameters like coherence if it's made global.
    // If the task is active (e.g., in 'stimulus' phase), you might want to handle this differently,
    // or restrict settings changes to 'initial' phase.
    // For simplicity, let's assume settings apply to the next set of trials or current if visual.
    // We might need to regenerate trials if coherenceLevels are affected and fixed per session.
    // Or, if coherence is dynamic per trial based on settings, update currentTrial if it's active.

    // For now, just updating the state. If a re-initialization is needed:
    initializeTask(newSettings); // Pass new settings to initializer
  };

  // Reset task when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Am I called?')
      initializeTask(taskSettings); // Pass current settings

      return () => {
        // Clean up if needed
      };
    }, [])
  );

  // Initialize the task
  const initializeTask = async (currentSettings: TabSettings): Promise<void> => { // Accept settings
    // if (!user || !activeTask) return;
    console.log('Initializing task with settings:', currentSettings)
    // Create a new session
    // const sessionResult = await taskService.createSession(user.id, activeTask.id);

    // if (!sessionResult.success) {
    //   console.error('Failed to create session:', sessionResult.error);
    //   return;
    // }

    // setSession(sessionResult.data);

    // Generate trials
    const newTrials = generateTrials(taskParams.current.numTrials);
    setTrials(newTrials);

    // Record each trial in the database
    // await Promise.all(
    //   newTrials.map(async (trial, index) => {
    //     await taskService.createTrial(
    //       sessionResult.data.id,
    //       index + 1,
    //       trial.parameters,
    //       trial.expectedResponse
    //     );
    //   })
    // );

    setCurrentTrialIndex(0);
    setPhase('initial');
    setCorrectResponses(0);
    setTotalReactionTime(0);
  };

  // Generate trials
  const generateTrials = (numTrials: number): Trial[] => {
    const generatedTrials: Trial[] = [];

    for (let i = 0; i < numTrials; i++) {
      // Randomly select direction and coherence
      const direction = Math.random() < 0.5 ? 'left' : 'right';
      
      // Use coherence from taskSettings if it's meant to be fixed, or from coherenceLevels if varied per trial
      const coherence = taskSettings.coherence; // Example: using the globally set coherence

      generatedTrials.push({
        parameters: {
          direction,
          coherence, // Use the coherence from settings
          dotCount: 100,
          speed: 5,
        },
        expectedResponse: direction,
      });
    }

    return generatedTrials;
  };

  // Start the next trial
  const startNextTrial = useCallback((): void => {
    console.log('Starting', currentTrialIndex, trials.length)
    if (currentTrialIndex >= trials.length - 1) {
      // All trials complete
      completeSession();
      return;
    }
    setCurrentTrialIndex(prev => prev + 1);
    setPhase('resting');
    setStartTime(Date.now());
    setResponseStartTime(null);
    setResponseEndTime(null);
    setResponseValue(null);

    // Advance to stimulus phase after resting time
    setTimeout(() => {
      setPhase('stimulus');

      // Advance to response phase after stimulus time
      setTimeout(() => {
        setPhase('response');
        setResponseStartTime(Date.now());
      }, taskParams.current.stimulusTime);
    }, taskParams.current.restingTime);
  }, [currentTrialIndex, trials]); // Removed completeSession from dependencies as it might cause re-renders

  // Handle response
  const handleResponse = useCallback( (response: Direction, trajectoryData: any): void => { // Assuming trajectoryData type from SwipeTracker or define if known
    console.log(phase)
    if (phase !== 'response') return;
    console.log('After phase consoel')
    const endTime = Date.now();
    setResponseEndTime(endTime);
    setResponseValue(response);

    // Calculate reaction and movement time
    // Ensure responseStartTime and startTime are not null before calculation
    const reactionTime = responseStartTime && startTime ? responseStartTime - (startTime + taskParams.current.restingTime) : 0; // Time to start moving
    const movementTime = responseStartTime && endTime ? endTime - responseStartTime : 0; // Time to complete movement

    const isCorrect = response === currentTrial.expectedResponse;

    // Update stats
    if (isCorrect) {
      setCorrectResponses(prev => prev + 1);
    }
    setTotalReactionTime(prev => prev + reactionTime);

    // Record the response in the database
    const trialId = currentTrialIndex + 1; // Assume trial IDs are 1-indexed

    // const responseResult = await taskService.recordResponse(
    //   trialId,
    //   response,
    //   reactionTime,
    //   movementTime,
    //   isCorrect
    // );

    // if (responseResult.success) {
    //   // Record trajectory data
    //   await taskService.recordTrajectory(
    //     responseResult.data.id,
    //     trajectoryData
    //   );
    // }

    // Show feedback
    setPhase('feedback');
    // const nextTrialIndex = currentTrialIndex + 1; // This was unused

    // Advance to next trial after feedback time
    setTimeout(() => {
      startNextTrial();
    }, taskParams.current.feedbackTime);
  }, [currentTrialIndex, phase, responseStartTime, startTime, taskParams, currentTrial, startNextTrial]); // Added startNextTrial to dependencies



  // Complete the session
  const completeSession =  (): void => {

    setPhase('complete');

    // Mark task as complete in context
    // markTaskComplete(activeTask.id);
    console.log(session)
    if (!session) return;
    // // Update session in database
    // await taskService.completeSession(
    //   session.id,
    //   user.id,
    //   activeTask.id,
    //   correctResponses,
    //   totalReactionTime
    // );

  };

  // Determine swipe direction from trajectory
  const getSwipeDirection = (trajectoryData: SwipeCompleteData | null): Direction | null => { // Using SwipeData from import
    if (!trajectoryData || trajectoryData.trajectory.length < 2) return null;

    const startPos = trajectoryData.startPosition;
    const endPos = trajectoryData.endPosition;

    // Calculate horizontal movement
    const deltaX = endPos.x - startPos.x;

    // Determine direction based on horizontal movement
    if (Math.abs(deltaX) < 20) return null; // Threshold for valid swipe
    return deltaX > 0 ? 'right' : 'left';
  };

  // Render function for the resting phase
  const renderResting = (): JSX.Element => (
    <View style={styles.centeredContainer}>
    <View style={[styles.restingContainer]}>
      <View style={[styles.thumbRestArea,
        {
          // backgroundColor: 'transparent',
          borderColor: themeColors['color-primary-500'],
          pointerEvents: 'none' }]} />
      <Text style={styles.instruction}>Keep your thumb here...</Text>
    </View>
    </View>
  );

  // Render function for the stimulus phase
  const renderStimulus = (): JSX.Element => (
    // <View style={styles.centeredContainer}>
    <View>
      <Text style={styles.instruction}>Which way are most dots moving?</Text>
      <RandomDotMotion
        dotCount={currentTrial?.parameters.dotCount || 100}
        coherence={currentTrial?.parameters.coherence || 0.3}
        direction={currentTrial?.parameters.direction || 'right'}
        speed={currentTrial?.parameters.speed || 5}
        width={width * 0.9}
        height={height * 0.4}
        dotCanvasShape={taskSettings.canvasShape}
        dotBackgroundColor={taskSettings.dotBackground}
        dotColor={taskSettings.dotColor}
      />
      {/* <View style={styles.restingContainer}>
        <View style={[styles.thumbRestArea,
          {
            borderColor: themeColors['color-primary-500'],
            pointerEvents: 'none' }]} />
        <Text style={styles.instruction}>Keep your thumb here...</Text>
      </View> */}
    </View>
  );

  // Render function for the response phase
  const renderResponse = (): JSX.Element => (
    <SwipeTracker
      onSwipeComplete={(data) => { // data is SwipeData
        const direction = getSwipeDirection(data);
        if (direction) {
          handleResponse(direction, data.trajectory); // Pass data.trajectory for trajectoryData
        }
      }}
      minVerticalSwipeDistance={100}
      style={styles.swipeContainer}
    >
      <View style={styles.responsePageLayout}>
        <View style={styles.responseContainer}>
          {/* <Text style={styles.instruction}>Swipe in the direction the dots were moving</Text> */}
          <View style={styles.responseButtons}>
            <View style={styles.leftTarget}>
              <ArrowBigLeft color={themeColors['text-basic-color']} size={36} />
            </View>
            <View style={styles.rightTarget}>
              <ArrowBigRight color={themeColors['text-basic-color']} size={36} />
            </View>
          </View>
        </View>

        <View style={[styles.restingContainer, styles.restingAreaPositioning]}>
        <Text style={styles.instruction}>Place your thumb here...</Text>
        <View style={[styles.thumbRestArea
          , {
          borderColor: themeColors['color-primary-500'],
          pointerEvents: 'none' }
          ]}
          />
        </View>

      </View>
    </SwipeTracker>
  );

  // Render function for the feedback phase
  const renderFeedback = (): JSX.Element => {
    const isCorrect = responseValue === currentTrial?.expectedResponse;

    return (
      <View style={styles.centeredContainer}>
        <Text
          style={[
            styles.feedbackText,
            // { color: isCorrect ? themeColors['success'] : themeColors['error'] }
          ]}
        >
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </Text>
      </View>
    );
  };

  // Render initial screen
  if (phase === 'initial') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors['background-basic-color-1'] }]}>
      <View style={styles.container}>
        <Text category="h1" style={styles.title}>
          Random Dot Motion Task
        </Text>
        <Text style={styles.description}>
          In this task, you'll see a cloud of moving dots. Some dots move randomly,
          while others move coherently left or right. Your job is to determine
          which direction most dots are moving.
        </Text>
        <Text style={[styles.description, { marginTop: 20 }]}>
          You'll complete {taskParams.current.numTrials} trials. After seeing the dots,
          swipe in the direction you think most dots were moving.
        </Text>

        <Button
          onPress={() => startNextTrial()}
          style={styles.button}
          // contentStyle={styles.buttonContent} // contentStyle is not a valid prop for Button in @ui-kitten/components
        >
          Start Task
        </Button>
        <Button
          onPress={() => sheetRef.current?.open()}
          style={styles.button}
          appearance="outline" // Optional: to differentiate from Start Task button
        >
          Settings
        </Button>
      </View>
      <TabOptionsSheet ref={sheetRef} onSettingsChange={handleSettingsApply} />
      </SafeAreaView>
    );
  }

  // Render completion screen
  if (phase === 'complete') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors['background-basic-color-1'] }]}>
      <View style={styles.container}>
        <Text category="h1" style={styles.title}>
          Task Completeddddd!
        </Text>
        <Text style={styles.description}>
          Great job! You correctly identified {correctResponses} out of {trials.length} dot patterns.
        </Text>
        <Text style={[styles.description, { marginTop: 20 }]}>
          Your average reaction time was {trials.length > 0 ? Math.round(totalReactionTime / trials.length) : 0} milliseconds.
        </Text>

        <Button
          onPress={() => {
            router.replace('/(main)/settings')
          }}
          style={styles.button}
          // contentStyle={styles.buttonContent} // contentStyle is not a valid prop for Button in @ui-kitten/components
        >
          Back to Tasks
        </Button>
      </View>
      </SafeAreaView>
    );
  }

  // Render main trial component
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors['background-basic-color-1'] }]}>
    <View>
      <Text style={styles.progress}>
        Trial {currentTrialIndex + 1} of {trials.length}
      </Text>

      <TrialComponent
        phase={phase}
        parameters={currentTrial?.parameters}
        onResting={renderResting}
        onStimulus={renderStimulus}
        onResponse={renderResponse}
        onFeedback={renderFeedback}
      />
    </View>
    <TabOptionsSheet ref={sheetRef} onSettingsChange={handleSettingsApply} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    // justifyContent: 'space-between', // Commented out as in original
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
  // buttonContent: { // This style was used with contentStyle which is not a valid prop for Button in @ui-kitten/components
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  // },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restingContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column-reverse',
    // borderWidth: 1, // Removed debug border
    // borderColor: 'red', // Removed debug border
  },
  responseContainer: {
    alignItems: 'center',
    width: '95%',
    // borderWidth: 1, // Commented out as likely debug
    // borderColor: 'red', // Commented out as likely debug
  },
  fixationPoint: { // This style can be removed or repurposed
    // width: 10,
    // height: 10,
    // borderRadius: 5,
    // backgroundColor: 'red',
    // marginBottom: 10,
  },
  thumbRestArea: {
    width: 80, // Increased size
    height: 80, // Increased size
    borderRadius: 40, // Adjusted for new size
    borderWidth: 2, // Added border
    marginBottom: 20,
    opacity: 0.7,
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
    width: '95%',
    marginTop: 40,
  },
  leftTarget: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  rightTarget: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  responsePageLayout: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restingAreaPositioning: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
});

export default RandomDotMotionTask; 