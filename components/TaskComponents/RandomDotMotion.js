import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@ui-kitten/components';

/**
 * RandomDotMotion - A component that displays a cloud of moving dots with coherent motion
 * 
 * @param {number} dotCount - Number of dots to display
 * @param {number} coherence - Coherence level (0-1, proportion of dots moving coherently)
 * @param {string} direction - Direction of coherent motion ('left' or 'right')
 * @param {number} speed - Speed of dot movement
 * @param {number} width - Width of the container
 * @param {number} height - Height of the container
 * @param {number} dotSize - Size of each dot
 */
const RandomDotMotion = ({ 
  dotCount = 100, 
  coherence = 0.3, 
  direction = 'right', 
  speed = 1,
  width = 500,
  height = 1500,
  dotSize = 10
}) => {
  const { themeColors } = useTheme();
  const animationFrameId = useRef(null);
  const [dots, setDots] = useState([]);
  const canvasRef = useRef(null);
  
  // Initialize dots with random positions
  useEffect(() => {
    // Clear any existing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    // Create the dots
    setDots(Array.from({ length: dotCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      isCoherent: Math.random() < coherence,
      randomAngle: Math.random() * Math.PI * 2,
    })));
    // Start the animation
    const animate = () => {
      // Update dot positions
      setDots((prevState) => prevState.map(dot => {
          if (dot.isCoherent) {
            // Coherent motion in specified direction
            if (direction === 'left') {
              dot.x -= speed;
            } else {
              dot.x += speed;
            }
          } else {
            // Random motion
            dot.x += Math.cos(dot.randomAngle) * speed;
            dot.y += Math.sin(dot.randomAngle) * speed;
            
            // Occasionally change the random direction
            if (Math.random() < 0.05) {
              dot.randomAngle = Math.random() * Math.PI * 2;
            }
          }
          
          // Wrap dots around the edges
          if (dot.x < 0) dot.x += width;
          if (dot.x > width) dot.x -= width;
          if (dot.y < 0) dot.y += height;
          if (dot.y > height) dot.y -= height;

          return dot
        })
      )

      
      // Force re-render
      if (canvasRef.current) {
        canvasRef.current.setNativeProps({ dots: [...dots] });
      }
      
      // Continue animation
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Clean up animation on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [dotCount, coherence, direction, speed, width, height]);
  
  const DOT_RADIUS = 3;
  // Custom component to render dots efficiently
  const DotsCanvas = React.forwardRef((props, ref) => {

    return (
    //   <View style={[styles.dotsContainer, { width: props.width, height: props.height }]}>
    //   {props.dots.map((dot, index) => (
    //     <View
    //       key={index}
    //       style={{
    //         position: "absolute",
    //         width: DOT_RADIUS * 2,
    //         height: DOT_RADIUS * 2,
    //         backgroundColor: "black",
    //         borderRadius: DOT_RADIUS,
    //         left: dot.x,
    //         top: dot.y,
    //       }}
    //     />
    //   ))}
    // </View>
      <View ref={ref} style={[styles.canvas, { width: props.width, height: props.height }]}>
        {props.dots.map((dot, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: props.dotSize,
                height: props.dotSize,
                borderRadius: props.dotSize / 2,
                left: dot.x,
                top: dot.y,
                zIndex: 1,
                backgroundColor: 'black', 
                //props.themeColors.backgroundColor,
              },
            ]}
          />
        ))}
      </View>
    );
  });
  
  return (
    <View style={[styles.container, { width, height }]}>
      <DotsCanvas ref={canvasRef} width={width} height={height} dots={dots} dotSize={dotSize} themeColors={themeColors} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dotsContainer: {
    // width: width/2,
    // height: width/2,
    backgroundColor: "lightgray",
    // borderRadius: width/4,
    position: 'relative',
    overflow: 'hidden'
  },
  canvas: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    backgroundColor: 'red'
  },
});

export default React.memo(RandomDotMotion);
