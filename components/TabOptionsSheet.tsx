// components/TabOptionsSheet.tsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';

export type TabOptionsSheetRef = {
  open: () => void;
};

type Props = {
  // options: { label: string; onPress: () => void }[]; // Removing old options
  onSettingsChange?: (settings: Settings) => void; // Callback for when settings change
};

export type Settings = {
  canvasShape: 'circle' | 'square';
  dotBackground: string;
  dotColor: 'black' | 'white';
  coherence: number;
};

const DOT_BACKGROUND_COLORS = ['#FFFFFF', '#DDDDDD', '#AAAAAA', '#333333', '#000000']; // Example palette

const TabOptionsSheet = forwardRef<TabOptionsSheetRef, Props>(({ onSettingsChange }, ref) => {
  const sheetRef = useRef<BottomSheet>(null);

  const [canvasShape, setCanvasShape] = useState<Settings['canvasShape']>('circle');
  const [dotBackground, setDotBackground] = useState<Settings['dotBackground']>('#FFFFFF');
  const [dotColor, setDotColor] = useState<Settings['dotColor']>('black');
  const [coherence, setCoherence] = useState<number>(0.3);
  const [settingsChanged, setSettingsChanged] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      sheetRef.current?.expand();
      setSettingsChanged(false);
    },
  }));

  const handleSettingChange = () => {
    setSettingsChanged(true);
  };

  const applySettings = () => {
    if (onSettingsChange) {
      onSettingsChange({ canvasShape, dotBackground, dotColor, coherence });
    }
    setSettingsChanged(false);
    sheetRef.current?.close();
  };

  const handleCanvasShapeChange = (shape: Settings['canvasShape']) => {
    setCanvasShape(shape);
    handleSettingChange();
  };

  const handleDotColorChange = (color: Settings['dotColor']) => {
    setDotColor(color);
    // Ensure contrast: if white dots, suggest/force dark background, and vice-versa
    if (color === 'white' && (dotBackground === '#FFFFFF' || dotBackground === '#DDDDDD' || dotBackground === '#AAAAAA')) {
      setDotBackground('#333333'); // Default dark background
    } else if (color === 'black' && (dotBackground === '#333333' || dotBackground === '#000000')) {
      setDotBackground('#FFFFFF'); // Default light background
    }
    handleSettingChange();
  };
  
  const handleDotBackgroundChange = (color: string) => {
    setDotBackground(color);
    // Ensure contrast with dot color
    if (dotColor === 'white' && (color === '#FFFFFF' || color === '#DDDDDD' || color === '#AAAAAA')) {
        setDotColor('black');
    } else if (dotColor === 'black' && (color === '#333333' || color === '#000000')) {
        setDotColor('white');
    }
    handleSettingChange();
  };

  const handleCoherenceChange = (value: number) => {
    setCoherence(value);
    handleSettingChange();
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%']} // Adjusted snap point for more content
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Dot Display Shape */}
        <Text style={styles.settingLabel}>Canvas Display Shape</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionButton, canvasShape === 'circle' && styles.selectedOption]}
            onPress={() => { handleCanvasShapeChange('circle'); }}
          >
            <View style={[styles.shapeIcon, styles.circleIcon]} />
            <Text>Circle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, canvasShape === 'square' && styles.selectedOption]}
            onPress={() => { handleCanvasShapeChange('square'); }}
          >
            <View style={[styles.shapeIcon, styles.squareIcon]} />
            <Text>Square</Text>
          </TouchableOpacity>
        </View>

        {/* Dot Display Background */}
        <Text style={styles.settingLabel}>Dot Display Background</Text>
        <View style={styles.optionsRow}>
          {DOT_BACKGROUND_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                dotBackground === color && styles.selectedColorOption,
              ]}
              onPress={() => handleDotBackgroundChange(color)}
            />
          ))}
        </View>

        {/* Dot Colors */}
        <Text style={styles.settingLabel}>Dot Colors</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[
              styles.colorOption,
              styles.dotColorBlack,
              dotColor === 'black' && styles.selectedColorOption,
            ]}
            onPress={() => handleDotColorChange('black')}
          />
          <TouchableOpacity
            style={[
              styles.colorOption,
              styles.dotColorWhite,
              dotColor === 'white' && styles.selectedColorOption,
            ]}
            onPress={() => handleDotColorChange('white')}
          />
        </View>

        {/* Coherence Setting */}
        <Text style={styles.settingLabel}>Coherence</Text>
        <View style={styles.optionsRow}>
          <Slider
            style={{flex: 1}}
            minimumValue={0}
            maximumValue={1}
            step={0.01} // Adjust step for desired precision
            value={coherence}
            onValueChange={(value: number) => {
              handleCoherenceChange(value);
            }}
            minimumTrackTintColor="#007AFF" // iOS blue
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#007AFF" // iOS blue
          />
          <Text style={styles.sliderValueText}>{coherence.toFixed(2)}</Text>
        </View>

        <Button title="Apply" onPress={applySettings} disabled={!settingsChanged} />

      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 10,
  },
  selectedOption: {
    borderColor: 'blue', // Highlight color
    backgroundColor: '#e0e0ff',
  },
  shapeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  circleIcon: {
    borderRadius: 10,
    backgroundColor: 'gray',
  },
  squareIcon: {
    backgroundColor: 'gray',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedColorOption: {
    borderColor: 'blue', // Highlight color for selected color
    borderWidth: 3,
  },
  dotColorBlack: {
    backgroundColor: 'black',
  },
  dotColorWhite: {
    backgroundColor: 'white',
    borderColor: '#ccc', // Border for white to be visible on white background
  },
  sliderValueText: {
    marginLeft: 10,
    minWidth: 35,
    textAlign: 'right',
  },
});

export default TabOptionsSheet;