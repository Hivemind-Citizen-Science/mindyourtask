// components/TabOptionsSheet.tsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

export type TabOptionsSheetRef = {
  open: () => void;
};

type Props = {
  // options: { label: string; onPress: () => void }[]; // Removing old options
  onSettingsChange?: (settings: Settings) => void; // Callback for when settings change
};

export type Settings = {
  dotShape: 'circle' | 'square';
  dotBackground: string;
  dotColor: 'black' | 'white';
};

const DOT_BACKGROUND_COLORS = ['#FFFFFF', '#DDDDDD', '#AAAAAA', '#333333', '#000000']; // Example palette

const TabOptionsSheet = forwardRef<TabOptionsSheetRef, Props>(({ onSettingsChange }, ref) => {
  const sheetRef = useRef<BottomSheet>(null);

  const [dotShape, setDotShape] = useState<Settings['dotShape']>('circle');
  const [dotBackground, setDotBackground] = useState<Settings['dotBackground']>('#FFFFFF');
  const [dotColor, setDotColor] = useState<Settings['dotColor']>('black');

  useImperativeHandle(ref, () => ({
    open: () => {
      sheetRef.current?.expand();
    },
  }));

  const handleSettingChange = () => {
    if (onSettingsChange) {
      onSettingsChange({ dotShape, dotBackground, dotColor });
    }
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
        // If user picks a light background with white dots, switch dots to black
        // Alternatively, alert user or prevent this combination
        setDotColor('black');
    } else if (dotColor === 'black' && (color === '#333333' || color === '#000000')) {
        // If user picks a dark background with black dots, switch dots to white
        setDotColor('white');
    }
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
        <Text style={styles.settingLabel}>Dot Display Shape</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionButton, dotShape === 'circle' && styles.selectedOption]}
            onPress={() => { setDotShape('circle'); handleSettingChange(); }}
          >
            <View style={[styles.shapeIcon, styles.circleIcon]} />
            <Text>Circle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, dotShape === 'square' && styles.selectedOption]}
            onPress={() => { setDotShape('square'); handleSettingChange(); }}
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
});

export default TabOptionsSheet;