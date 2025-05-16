import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * TrialComponent - A flexible component that renders different content based on the current phase of a trial
 * 
 * @param {string} phase - Current phase of the trial (resting, stimulus, response, feedback, etc.)
 * @param {object} parameters - Parameters for the current trial
 * @param {function} onResting - Render function for the resting phase
 * @param {function} onStimulus - Render function for the stimulus phase
 * @param {function} onStimulus1 - Render function for the first stimulus phase
 * @param {function} onInterval - Render function for the interval between stimuli
 * @param {function} onStimulus2 - Render function for the second stimulus phase
 * @param {function} onResponse - Render function for the response phase
 * @param {function} onFeedback - Render function for the feedback phase
 */
const TrialComponent = ({ 
  phase, 
  parameters,
  onResting,
  onStimulus,
  onStimulus1,
  onInterval,
  onStimulus2, 
  onResponse,
  onFeedback
}) => {
  const renderPhaseContent = () => {
    switch (phase) {
      case 'resting':
        return onResting ? onResting() : null;
      
      case 'stimulus':
        return onStimulus ? onStimulus() : null;
      
      case 'stimulus1':
        return onStimulus1 ? onStimulus1() : null;
      
      case 'interval':
        return onInterval ? onInterval() : null;
      
      case 'stimulus2':
        return onStimulus2 ? onStimulus2() : null;
      
      case 'response':
        return onResponse ? onResponse() : null;
      
      case 'feedback':
        return onFeedback ? onFeedback() : null;
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderPhaseContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flex: 1,
    width: '100%',
    // justifyContent: 'center',
    // flexDirection: 'column-reverse'
  },
});

export default TrialComponent;
