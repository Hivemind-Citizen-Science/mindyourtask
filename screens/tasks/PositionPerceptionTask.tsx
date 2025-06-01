import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, GestureResponderEvent } from 'react-native';
import { Button, Text, useTheme } from '@ui-kitten/components'; // Assuming Text is aliased as Typography
import { useFocusEffect, NavigationProp } from '@react-navigation/native'; // Assuming NavigationProp is needed
import { useAuth  } from '../../context/AuthContext'; // Assuming User type from AuthContext
import { useTask  } from '../../context/TaskContext'; // Assuming Task type from TaskContext
import PositionPerception from '../../components/TaskComponents/PositionPerception';
import SwipeTracker, { SwipeCompleteData } from '../../components/TaskComponents/SwipeTracker'; // Assuming TrajectoryData type
import TrialComponent from '../../components/TaskComponents/TrialComponent';
import { Session, Trial, Direction } from '@/lib/types/common';
// import taskService from '../../services/taskService'; // Assuming taskService is available and typed

const { width, height } = Dimensions.get('window');

interface TrialParameters {
  standardVelocity: number;
  embeddedMotion: number;
  standardTime: number;
  positionOffset: number;
  standardDistance: number;
  comparisonDistance: number;
  standardFirst: boolean;
  fartherPatch: 'first' | 'second' | 'equal';
  firstVelocity: number;
  firstEmbeddedMotion: number;
  firstTime: number;
  firstDistance: number;
  secondVelocity: number;
  secondEmbeddedMotion: number;
  secondTime: number;
  secondDistance: number;
}

interface PositionPerceptionTrial extends Trial<TrialParameters, Direction> {}

type Phase = 'initial' | 'resting' | 'stimulus1' | 'interval' | 'stimulus2' | 'response' | 'feedback' | 'complete';

const PositionPerceptionTask: React.FC = () => {
  const themeColors = useTheme();
  const { user } = useAuth();
  //   const { activeTask, markTaskComplete } = useTask() as { activeTask: Task | null, markTaskComplete: (taskId: string) => void }; // Type assertion for task context

  // Task state
  const [phase, setPhase] = useState<Phase>('initial');
  const [session, setSession] = useState<Session | null>(null);
  const [trials, setTrials] = useState<PositionPerceptionTrial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseEndTime, setResponseEndTime] = useState<number | null>(null);
  const [responseValue, setResponseValue] = useState<Direction | null>(null);
  const [correctResponses, setCorrectResponses] = useState<number>(0);
  const [totalReactionTime, setTotalReactionTime] = useState<number>(0);

  // Task parameters
  const taskParams = useRef({
    numTrials: 10,
    restingTime: 1000, // ms
    intervalTime: 600, // ms (random between 500-700ms)
    feedbackTime: 1000, // ms
    standardVelocities: [40, 50], // cm/sec
    embeddedMotions: [10, -10], // cm/sec
    positionOffsets: [-3, -2, -1, 0, 1, 2, 3], // Position offsets in cm
  });

  // Current trial data
  const currentTrial = trials[currentTrialIndex];

  // Reset task when screen gains focus
  useFocusEffect(
    useCallback(() => {
      initializeTask();

      return () => {
        // Clean up if needed
      };
    }, [])
  );

  // Initialize the task
  const initializeTask = async () => {
    // if (!user || !activeTask) return;

    // // Create a new session
    // const sessionResult = await taskService.createSession(user.id, activeTask.id);

    // if (!sessionResult.success) {
    //   console.error('Failed to create session:', sessionResult.error);
    //   return;
    // }

    // setSession(sessionResult.data as Session); // Ensure type assertion for session data

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
  const generateTrials = (numTrials: number): PositionPerceptionTrial[] => {
    const newTrials: PositionPerceptionTrial[] = [];

    for (let i = 0; i < numTrials; i++) {
      const standardVelocity = taskParams.current.standardVelocities[
        Math.floor(Math.random() * taskParams.current.standardVelocities.length)
      ];

      const embeddedMotion = taskParams.current.embeddedMotions[
        Math.floor(Math.random() * taskParams.current.embeddedMotions.length)
      ];

      const positionOffset = taskParams.current.positionOffsets[
        Math.floor(Math.random() * taskParams.current.positionOffsets.length)
      ];

      const standardTime = standardVelocity === 40 ? 700 : 540; // ms
      const standardDistance = standardVelocity * (standardTime / 1000); // in cm
      const comparisonDistance = standardDistance + positionOffset;

      const fartherPatch: 'first' | 'second' | 'equal' =
        positionOffset > 0 ? 'second' : positionOffset < 0 ? 'first' : 'equal';

      const standardFirst = Math.random() < 0.5;

      let expectedResponse: Direction;
      if (fartherPatch === 'equal') {
        expectedResponse = Math.random() < 0.5 ? 'left' : 'right';
      } else {
        expectedResponse = standardFirst
          ? (fartherPatch === 'first' ? 'left' : 'right')
          : (fartherPatch === 'first' ? 'right' : 'left');
      }

      newTrials.push({
        parameters: {
          standardVelocity,
          embeddedMotion,
          standardTime,
          positionOffset,
          standardDistance,
          comparisonDistance,
          standardFirst,
          fartherPatch,
          firstVelocity: standardFirst ? standardVelocity : standardVelocity, // Assuming comparison has same base velocity
          firstEmbeddedMotion: standardFirst ? embeddedMotion : 0,
          firstTime: standardTime,
          firstDistance: standardFirst ? standardDistance : comparisonDistance,
          secondVelocity: standardFirst ? standardVelocity : standardVelocity, // Assuming comparison has same base velocity
          secondEmbeddedMotion: standardFirst ? 0 : embeddedMotion,
          secondTime: standardTime,
          secondDistance: standardFirst ? comparisonDistance : standardDistance,
        },
        expectedResponse,
      });
    }
    return newTrials;
  };

  // Start the next trial
  const startNextTrial = () => {
    if (currentTrialIndex >= trials.length) {
      completeSession();
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
  const handleResponse = async (response: Direction, trajectoryData: any) => { // Specify type for trajectoryData if known
    if (phase !== 'response' || !currentTrial || startTime === null || responseStartTime === null) return;


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

    const trialId = currentTrialIndex + 1;

    // const responseResult = await taskService.recordResponse(
    //   trialId,
    //   response,
    //   reactionTime,
    //   movementTime,
    //   isCorrect
    // );

    // if (responseResult.success) {
    //   await taskService.recordTrajectory(
    //     responseResult.data.id,
    //     trajectoryData
    //   );
    // }

    setPhase('feedback');

    setTimeout(() => {
      setCurrentTrialIndex(prev => prev + 1);
      startNextTrial();
    }, taskParams.current.feedbackTime);
  };

  // Complete the session
  const completeSession = async () => {

    setPhase('complete');
    if (!session ) return; // || !activeTask) return;

    // await taskService.completeSession(
    //   session.id,
    //   user.id,
    //   activeTask.id,
    //   correctResponses,
    //   totalReactionTime
    // );

    // markTaskComplete(activeTask.id);
  };

  // Determine swipe direction from trajectory
  const getSwipeDirection = (trajectoryData: SwipeCompleteData | null): Direction | null => {
    if (!trajectoryData || trajectoryData.trajectory.length < 2) return null;

    const startPos = trajectoryData.startPosition;
    const endPos = trajectoryData.endPosition;
    const deltaX = endPos.x - startPos.x;

    if (Math.abs(deltaX) < 20) return null;
    return deltaX > 0 ? 'right' : 'left';
  };

  // Render function for the resting phase
  const renderResting = () => (
    <View style={styles.centeredContainer}>
      <View style={[styles.restingContainer]}>
        <View style={[styles.thumbRestArea, {
          borderColor: themeColors['color-primary-500'],
          pointerEvents: 'none'
        }]} />
        <Text style={styles.instruction}>Keep your thumb here...</Text>
      </View>
    </View>
  );

  // Render function for the first stimulus
  const renderStimulus1 = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.instruction}>Watch the first patch</Text>
      <PositionPerception
        isFirst={true}
        velocity={currentTrial?.parameters.firstVelocity || 40}
        embeddedMotion={currentTrial?.parameters.firstEmbeddedMotion || 0}
        duration={currentTrial?.parameters.firstTime || 700}
        width={width * 0.9}
        height={height * 0.4}
      />
    </View>
  );

  // Render function for the interval
  const renderInterval = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.fixationPoint} />
      <Text style={styles.instruction}>Wait for the second patch...</Text>
    </View>
  );

  // Render function for the second stimulus
  const renderStimulus2 = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.instruction}>Watch the second patch</Text>
      <PositionPerception
        isFirst={false}
        velocity={currentTrial?.parameters.secondVelocity || 40}
        embeddedMotion={currentTrial?.parameters.secondEmbeddedMotion || 0}
        duration={currentTrial?.parameters.secondTime || 700}
        width={width * 0.9}
        height={height * 0.4}
      />
    </View>
  );

  // Render function for the response phase
  const renderResponse = () => (
    <SwipeTracker
      onSwipeComplete={(data: SwipeCompleteData) => { // Added type for data
        const direction = getSwipeDirection(data);
        if (direction) {
          handleResponse(direction, data.trajectory);
        }
      }}
      style={styles.swipeContainer}
    >
      <View style={styles.centeredContainer}>
        <Text style={styles.instruction}>
          Which patch traveled farther?
          Swipe LEFT if the FIRST patch traveled farther.
          Swipe RIGHT if the SECOND patch traveled farther.
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

  // Render function for the feedback phase
  const renderFeedback = () => {
    const isCorrect = responseValue === currentTrial?.expectedResponse;

    return (
      <View style={styles.centeredContainer}>
        <Text
          style={[
            styles.feedbackText,
            // @ts-ignore // Assuming themeColors.primary is valid, handle potential type error
            { color: themeColors.primary } //isCorrect ? themeColors.success : themeColors.error }
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
            Far far away...
          </Text>
          <Text style={styles.description}>
            In this task, you'll see two patches moving across the screen one after the other.
            Your job is to determine which patch traveled farther before disappearing.
          </Text>
          <Text style={[styles.description, { marginTop: 20 }]}>
            You'll complete {taskParams.current.numTrials} trials. After seeing both patches,
            swipe LEFT if the FIRST patch traveled farther, or RIGHT if the SECOND patch traveled farther.
          </Text>

          <Button
            // mode="contained" // mode is not a prop of Button
            onPress={startNextTrial}
            style={styles.button}
            // contentStyle={styles.buttonContent} // contentStyle is not a prop of Button
          >
            {/* Assuming ButtonText is a custom component or should be Typography */}
            <Text>Start Task</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Render completion screen
  if (phase === 'complete') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors['background-basic-color-1'] }]}>
        <View style={styles.container}>
          <Text category="h1" style={styles.title}>
            Task Complete!
          </Text>
          <Text style={styles.description}>
            Great job! You correctly identified {correctResponses} out of {trials.length} position comparisons.
          </Text>
          <Text style={[styles.description, { marginTop: 20 }]}>
            Your average reaction time was {trials.length > 0 ? Math.round(totalReactionTime / trials.length) : 0} milliseconds.
          </Text>

          <Button
            // mode="contained"
            // onPress={() => navigation.navigate('TaskSelection')} // navigation is not defined
            style={styles.button}
            // contentStyle={styles.buttonContent}
          >
            <Text>Back to Tasks</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Render main trial component
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors['background-basic-color-1'] }]}>
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

export default PositionPerceptionTask; 