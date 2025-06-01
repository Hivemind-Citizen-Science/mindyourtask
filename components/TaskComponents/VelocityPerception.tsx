import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme, Text as Typography } from '@ui-kitten/components';

interface Props {
  isFirst?: boolean;
  velocity?: number;
  embeddedMotion?: number;
  duration?: number;
  width?: number;
  height?: number;
}

const VelocityPerception: React.FC<Props> = ({
  isFirst = true,
  velocity = 40,
  embeddedMotion = 0,
  duration = 600,
  width = 300,
  height = 300,
}) => {
  const { themeColors } = useTheme(); // Consider typing themeColors if possible
  const patchSize = 40;
  const patchAnim = useRef(new Animated.Value(0)).current;
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);

  // Calculate effective velocity
  const effectiveVelocity: number = velocity + embeddedMotion;

  // Calculate distance to travel based on velocity and duration
  // Here we're simulating cm/sec in the pixel space
  // Using a scaling factor to convert velocity to pixels per second
  const scalingFactor = 2; // Adjust this based on device screen density
  const distance: number = (effectiveVelocity * duration / 1000) * scalingFactor;

  // Start position (left side)
  const startPosition: number = patchSize / 2;

  // End position
  // const endPosition: number = startPosition + distance; // This variable is not used

  useEffect(() => {
    // Start the animation after a short delay
    const timer = setTimeout(() => {
      setAnimationStarted(true);

      Animated.timing(patchAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();
    }, 200);

    return () => clearTimeout(timer);
  }, [patchAnim, duration]); // Added dependencies to useEffect

  // Interpolate animation value to translate position
  const patchTranslate: Animated.AnimatedInterpolation<number> = patchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, distance]
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.trackContainer}>
        <View style={styles.track} />

        {animationStarted && (
          <Animated.View
            style={[
              styles.patch,
              {
                width: patchSize,
                height: patchSize,
                backgroundColor: 'red', // Consider using themeColors
                transform: [{ translateX: patchTranslate }]
              }
            ]}
          >
            <Typography style={styles.patchLabel}>
              {isFirst ? '1' : '2'}
            </Typography>
          </Animated.View>
        )}
      </View>
    </View>
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
    trackContainer: {
        position: 'relative',
        width: '100%',
        height: 300,
        justifyContent: 'center',
        backgroundColor: '#ccc',
    },
    track: {
        position: 'absolute',
        width: '100%',
        height: 2,
    },
    patch: {
        position: 'absolute',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        // top: -20, // Center vertically around track
        left: 0,
    },
    patchLabel: {
        color: 'white',
        fontWeight: 'bold',
    }
  });

export default VelocityPerception; 