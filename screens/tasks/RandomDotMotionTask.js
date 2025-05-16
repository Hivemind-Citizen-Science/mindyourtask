import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { Button, Text, useTheme } from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTask } from '@/context/TaskContext';
import RandomDotMotion from '@/components/TaskComponents/RandomDotMotion';
import SwipeTracker from '@/components/TaskComponents/SwipeTracker';
import TrialComponent from '@/components/TaskComponents/TrialComponent';
import taskService from '@/services/taskService';
import { useRouter } from 'expo-router';
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const RandomDotMotionTask = () => {
  const router = useRouter();
  const themeColors = useTheme();    
  const { user } = useAuth();
  const { activeTask, markTaskComplete } = useTask();
  
  // Task state
  const [phase, setPhase] = useState('initial'); // initial, resting, stimulus, response, feedback, complete
  const [session, setSession] = useState(null);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [responseStartTime, setResponseStartTime] = useState(null);
  const [responseEndTime, setResponseEndTime] = useState(null);
  const [responseValue, setResponseValue] = useState(null);
  const [correctResponses, setCorrectResponses] = useState(0);
  const [totalReactionTime, setTotalReactionTime] = useState(0);
  
  // Task parameters
  const taskParams = useRef({
    numTrials: 5,
    restingTime: 1000, // ms
    stimulusTime: 2000, // ms
    feedbackTime: 1000, // ms
    coherenceLevels: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
  });
  
  // Current trial data
  const currentTrial = trials[currentTrialIndex];
  
  // Reset task when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Am I called?')
      initializeTask();
      
      return () => {
        // Clean up if needed
      };
    }, [])
  );
  
  // Initialize the task
  const initializeTask = async () => {
    // if (!user || !activeTask) return;
    console.log('Initializing task')
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
  const generateTrials = (numTrials) => {
    const trials = [];
    
    for (let i = 0; i < numTrials; i++) {
      // Randomly select direction and coherence
      const direction = Math.random() < 0.5 ? 'left' : 'right';
      const coherence = taskParams.current.coherenceLevels[
        Math.floor(Math.random() * taskParams.current.coherenceLevels.length)
      ];
      
      trials.push({
        parameters: {
          direction,
          coherence,
          dotCount: 100,
          speed: 5,
        },
        expectedResponse: direction,
      });
    }
    
    return trials;
  };
  
  // Start the next trial
  const startNextTrial = useCallback(() => {
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
  }, [currentTrialIndex, trials]);
  
  // Handle response
  const handleResponse = useCallback( (response, trajectoryData) => {
    console.log(phase)
    if (phase !== 'response') return;
    console.log('After phase consoel')
    const endTime = Date.now();
    setResponseEndTime(endTime);
    setResponseValue(response);
  
    // Calculate reaction and movement time
    const reactionTime = responseStartTime - (startTime + taskParams.current.restingTime); // Time to start moving
    const movementTime = endTime - responseStartTime; // Time to complete movement
  
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
    const nextTrialIndex = currentTrialIndex + 1;
  
    // Advance to next trial after feedback time
    setTimeout(() => {
      startNextTrial();
    }, taskParams.current.feedbackTime);
  }, [currentTrialIndex, phase, responseStartTime, startTime, taskParams, currentTrial]);
  
  
  
  // Complete the session
  const completeSession =  () => {
    
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
  const getSwipeDirection = (trajectoryData) => {
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
  const renderResting = () => (
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
  const renderStimulus = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.instruction}>Which way are most dots moving?</Text>
      <RandomDotMotion 
        dotCount={currentTrial?.parameters.dotCount || 100}
        coherence={currentTrial?.parameters.coherence || 0.3}
        direction={currentTrial?.parameters.direction || 'right'}
        speed={currentTrial?.parameters.speed || 5}
        width={width * 0.9}
        height={height * 0.4}
      />
      <View style={styles.restingContainer}>
        <View style={[styles.thumbRestArea, 
          { 
            borderColor: themeColors['color-primary-500'], 
            pointerEvents: 'none' }]} />
        <Text style={styles.instruction}>Keep your thumb here...</Text>
      </View>
    </View>
  );
  
  // Render function for the response phase
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
      <View style={styles.responsePageLayout}>
        <View style={styles.responseContainer}>
          <Text style={styles.instruction}>Swipe in the direction the dots were moving</Text>
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
          <View style={[styles.thumbRestArea
          , { 
          borderColor: themeColors['color-primary-500'],
          pointerEvents: 'none' }
          ]} 
          />
          <Text style={styles.instruction}>Place your thumb here...</Text>
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
          contentStyle={styles.buttonContent}
        >
          Start Task
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
          Great job! You correctly identified {correctResponses} out of {trials.length} dot patterns.
        </Text>
        <Text style={[styles.description, { marginTop: 20 }]}>
          Your average reaction time was {Math.round(totalReactionTime / trials.length)} milliseconds.
        </Text>
        
        <Button 
          onPress={() => {
            router.replace('/(tasks)')
          }}
          style={styles.button}
          contentStyle={styles.buttonContent}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    // justifyContent: 'space-between',
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
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
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
    justifyContent: 'center',
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