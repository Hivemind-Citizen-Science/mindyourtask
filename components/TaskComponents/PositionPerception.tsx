import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme, Text as Typography } from '@ui-kitten/components';

interface PositionPerceptionProps {
  isFirst?: boolean;
  velocity?: number;
  embeddedMotion?: number;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * PositionPerception - A component that shows a moving patch that disappears after a set duration
 * 
 * @param {boolean} isFirst - Whether this is the first or second stimulus
 * @param {number} velocity - Base velocity of the patch in cm/sec
 * @param {number} embeddedMotion - Embedded motion (can be positive or negative)
 * @param {number} duration - Duration of the motion in milliseconds
 * @param {number} width - Width of the container
 * @param {number} height - Height of the container
 */
const PositionPerception: React.FC<PositionPerceptionProps> = ({ 
  isFirst = true,
  velocity = 40, 
  embeddedMotion = 0,
  duration = 700,
  width = 300,
  height = 300,
}) => {
  const theme = useTheme();
  const patchSize: number = 40;
  const patchAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);
  
  // Calculate effective velocity
  const effectiveVelocity: number = velocity + embeddedMotion;
  
  // Calculate distance to travel based on velocity and duration
  // Here we're simulating cm/sec in the pixel space
  // Using a scaling factor to convert velocity to pixels per second
  const scalingFactor: number = 2; // Adjust this based on device screen density
  const distance: number = (effectiveVelocity * duration / 1000) * scalingFactor;
  
  // Start position (left side)
  const startPosition: number = patchSize / 2;
  
  // End position
  const endPosition: number = startPosition + distance;
  
  useEffect(() => {
    // Start the animation after a short delay
    const timer = setTimeout(() => {
      setAnimationStarted(true);
      
      // Move the patch
      Animated.timing(patchAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();
      
      // Fade out at the end
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150, // Quick fade out
        delay: duration - 150, // Start fading out just before the end
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
                backgroundColor: theme['color-primary-500'],
                transform: [{ translateX: patchTranslate }],
                opacity: opacityAnim,
              }
            ]}
          >
            <Typography category="label" style={styles.patchLabel}>
              {isFirst ? '1' : '2'}
            </Typography>
          </Animated.View>
        )}
      </View>
      
      {/* Visual indicator for fixation point */}
      <View style={styles.fixationPointContainer}>
        <View style={styles.fixationPoint} />
        <Typography category="p2" style={styles.fixationLabel}>
          Fixation point
        </Typography>
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
    height: 2,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#ccc',
  },
  patch: {
    position: 'absolute',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20, // Center vertically around track
    left: 0,
  },
  patchLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  fixationPointContainer: {
    position: 'absolute',
    right: 100, // Position near right side where patches should disappear
    alignItems: 'center',
  },
  fixationPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginBottom: 4,
  },
  fixationLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
});

export default PositionPerception; 