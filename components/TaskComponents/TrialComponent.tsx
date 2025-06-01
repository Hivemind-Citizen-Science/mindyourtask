import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

// Define the possible phases as a string literal union type
type TrialPhase = 
  | 'resting'
  | 'stimulus'
  | 'stimulus1'
  | 'interval'
  | 'stimulus2'
  | 'response'
  | 'feedback';

interface TrialComponentProps {
  phase: TrialPhase;
  parameters?: Record<string, any>; // Or a more specific type if known
  onResting?: () => React.ReactNode;
  onStimulus?: () => React.ReactNode;
  onStimulus1?: () => React.ReactNode;
  onInterval?: () => React.ReactNode;
  onStimulus2?: () => React.ReactNode;
  onResponse?: () => React.ReactNode;
  onFeedback?: () => React.ReactNode;
}

/**
 * TrialComponent - A flexible component that renders different content based on the current phase of a trial
 TaskContext */
const TrialComponent: React.FC<TrialComponentProps> = ({ 
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
  const renderPhaseContent = (): React.ReactNode => {
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
        // It's good practice to handle unexpected phase values,
        // though TypeScript should prevent this if phase is correctly typed.
        // You could throw an error or return a default UI element.
        console.warn(`Unknown phase: ${phase}`);
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderPhaseContent()}
    </View>
  );
};

interface Styles {
  container: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    borderWidth: 1,
    flex: 1,
    width: '100%',
    // justifyContent: 'center',
    // flexDirection: 'column-reverse'
  },
});

export default TrialComponent; 