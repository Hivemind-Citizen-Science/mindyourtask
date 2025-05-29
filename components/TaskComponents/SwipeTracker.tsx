import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, PanResponderGestureState, ViewStyle } from 'react-native';

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeCompleteData {
  trajectory: Point[];
  duration: number;
  startPosition: Point;
  endPosition: Point;
}

interface SwipeTrackerProps {
  onSwipeStart?: (point: Point) => void;
  onSwipeMove?: (point: Point) => void;
  onSwipeEnd?: (point: Point) => void;
  onSwipeComplete?: (data: SwipeCompleteData) => void;
  active?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * SwipeTracker - A component that tracks swipe movements and trajectories
 * 
 * @param {function} onSwipeStart - Callback when swipe starts
 * @param {function} onSwipeMove - Callback with position data during swipe
 * @param {function} onSwipeEnd - Callback when swipe ends
 * @param {function} onSwipeComplete - Callback with complete trajectory data
 * @param {boolean} active - Whether tracking is active
 * @param {object} style - Custom styles
 */
const SwipeTracker: React.FC<SwipeTrackerProps> = ({ 
  onSwipeStart, 
  onSwipeMove, 
  onSwipeEnd, 
  onSwipeComplete,
  active = true,
  style,
  children
}) => {
  const [displayedTrailPoints, setDisplayedTrailPoints] = useState<Point[]>([]);
  const currentTrajectoryRef = useRef<Point[]>([]);
  const startTime = useRef<number | null>(null);
  const isTracking = useRef<boolean>(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => active,
      onMoveShouldSetPanResponderCapture: () => active,
      
      onPanResponderGrant: (evt, gestureState) => {
        // Start tracking
        if (!active) return;
        
        isTracking.current = true;
        startTime.current = Date.now();
        currentTrajectoryRef.current = []; // Clear previous trajectory
        
        const initialPoint: Point = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
          timestamp: 0,
        };
        currentTrajectoryRef.current.push(initialPoint);
        setDisplayedTrailPoints([...currentTrajectoryRef.current]); // Update state for rendering
        
        if (onSwipeStart) {
          onSwipeStart(initialPoint);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Track movement
        if (!active || !isTracking.current) return;
        
        const currentTime = Date.now();
        const timestamp = currentTime - (startTime.current || currentTime); // Ensure startTime.current is not null
        
        const position: Point = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
          timestamp,
        };
        
        currentTrajectoryRef.current.push(position);
        setDisplayedTrailPoints([...currentTrajectoryRef.current]); // Update state with all current points
        
        if (onSwipeMove) {
          onSwipeMove(position);
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        // End tracking
        if (!active || !isTracking.current) return;
        
        const currentTime = Date.now();
        const timestamp = currentTime - (startTime.current || currentTime); // Ensure startTime.current is not null
        
        const finalPoint: Point = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
          timestamp,
        };
        currentTrajectoryRef.current.push(finalPoint);
        // Optionally update displayed points one last time if needed, or clear them
        // setDisplayedTrailPoints([...currentTrajectoryRef.current]); 
        
        if (onSwipeEnd) {
          onSwipeEnd(finalPoint);
        }
        
        if (onSwipeComplete && currentTrajectoryRef.current.length > 0) {
          onSwipeComplete({
            trajectory: currentTrajectoryRef.current,
            duration: timestamp,
            startPosition: currentTrajectoryRef.current[0],
            endPosition: currentTrajectoryRef.current[currentTrajectoryRef.current.length - 1],
          });
        }
        
        isTracking.current = false;
        // To clear trail after swipe:
        // setTimeout(() => setDisplayedTrailPoints([]), 100); 
      },
      
      onPanResponderTerminate: (evt, gestureState) => {
        // Handle termination (e.g., another component took over)
        if (isTracking.current) {
          // Potentially treat as a release or cancellation
          // For now, just stop tracking
          isTracking.current = false;
          // Optionally clear trail:
          // setDisplayedTrailPoints([]);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
      <View style={styles.gestureArea}>
            {displayedTrailPoints.map((point, index) => (
              <View
                key={index}
                style={{
                  position: "absolute",
                  width: 10, 
                  height: 10, 
                  backgroundColor: "rgba(0, 0, 255, 0.5)", 
                  borderRadius: 5, 
                  left: point.x - 5, 
                  top: point.y - 5, 
                  opacity: 1 - (index / displayedTrailPoints.length) * 0.8, 
                }}
              />
             ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  gestureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  }
});

export default SwipeTracker; 