import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme, Text as Typography } from '@ui-kitten/components';

/**
 * VelocityPerception - A component that shows a moving patch with variable velocity
 * 
 * @param {boolean} isFirst - Whether this is the first or second stimulus
 * @param {number} velocity - Base velocity of the patch in cm/sec
 * @param {number} embeddedMotion - Embedded motion (can be positive or negative)
 * @param {number} duration - Duration of the motion in milliseconds
 * @param {number} width - Width of the container
 * @param {number} height - Height of the container
 */
const VelocityPerception = ({ 
  isFirst = true,
  velocity = 40, 
  embeddedMotion = 0,
  duration = 600,
  width = 300,
  height = 300,
}) => {
  const { themeColors } = useTheme();
  const patchSize = 40;
  const patchAnim = useRef(new Animated.Value(0)).current;
  const [animationStarted, setAnimationStarted] = useState(false);
  
  // Calculate effective velocity
  const effectiveVelocity = velocity + embeddedMotion;
  
  // Calculate distance to travel based on velocity and duration
  // Here we're simulating cm/sec in the pixel space
  // Using a scaling factor to convert velocity to pixels per second
  const scalingFactor = 2; // Adjust this based on device screen density
  const distance = (effectiveVelocity * duration / 1000) * scalingFactor;
  
  // Start position (left side)
  const startPosition = patchSize / 2;
  
  // End position
  const endPosition = startPosition + distance;
  
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
  }, []);
  
  // Interpolate animation value to translate position
  const patchTranslate = patchAnim.interpolate({
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
                backgroundColor: 'red',
                transform: [{ translateX: patchTranslate }]
              }
            ]}
          >
            <Typography variant="labelSmall" style={styles.patchLabel}>
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
    justifyContent: 'center',
    alignItems: 'center',
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
