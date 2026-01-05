/**
 * PoolLimitSelector
 *
 * Shared component for selecting pool limit (101/201/250/Custom).
 * Used in both Scorer and Practice mode setup screens.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, BorderRadius } from '../../theme';

const PRESET_LIMITS = [101, 201, 250] as const;

export interface PoolLimitSelectorProps {
  value: number;
  onChange: (limit: number) => void;
  allowCustom?: boolean;
  customValue?: string;
  onCustomValueChange?: (value: string) => void;
  disabled?: boolean;
  showHelperText?: boolean;
}

export const PoolLimitSelector: React.FC<PoolLimitSelectorProps> = ({
  value,
  onChange,
  allowCustom = false,
  customValue = '',
  onCustomValueChange,
  disabled = false,
  showHelperText = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Determine if current value is a custom value
  const isPreset = PRESET_LIMITS.includes(value as 101 | 201 | 250);
  const isCustomSelected = allowCustom && !isPreset;

  // Build segment options
  const segmentOptions = allowCustom
    ? [...PRESET_LIMITS.map(String), 'Custom']
    : PRESET_LIMITS.map(String);

  // Determine selected index
  let selectedIndex: number;
  if (isCustomSelected) {
    selectedIndex = 3; // Custom is the 4th option
  } else {
    selectedIndex = PRESET_LIMITS.indexOf(value as 101 | 201 | 250);
    if (selectedIndex === -1) {
      selectedIndex = allowCustom ? 3 : 0;
    }
  }

  const handleSegmentChange = (index: number) => {
    if (allowCustom && index === 3) {
      // Custom selected - parse custom value or use default
      const parsed = parseInt(customValue, 10);
      onChange(parsed > 0 ? parsed : 300);
      if (!customValue && onCustomValueChange) {
        onCustomValueChange('300');
      }
    } else {
      onChange(PRESET_LIMITS[index]);
    }
  };

  return (
    <View style={styles.container}>
      <SegmentedControl
        values={segmentOptions}
        selectedIndex={selectedIndex}
        onChange={(event) => handleSegmentChange(event.nativeEvent.selectedSegmentIndex)}
        enabled={!disabled}
        style={styles.segmentedControl}
        fontStyle={styles.segmentedFont}
        activeFontStyle={styles.segmentedActiveFont}
        tintColor={colors.tint}
        backgroundColor={colors.cardBackground}
      />

      {allowCustom && isCustomSelected && (
        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Custom limit:</Text>
          <TextInput
            style={styles.customInput}
            value={customValue}
            onChangeText={(text) => {
              if (onCustomValueChange) {
                onCustomValueChange(text);
              }
              const parsed = parseInt(text, 10);
              if (parsed > 0) {
                onChange(parsed);
              }
            }}
            keyboardType="numeric"
            placeholder="300"
            placeholderTextColor={colors.placeholder}
            editable={!disabled}
          />
        </View>
      )}

      {showHelperText && (
        <Text style={styles.helperText}>
          Players are eliminated when they exceed {value} points
        </Text>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      padding: Spacing.md,
    },
    segmentedControl: {
      height: 36,
    },
    segmentedFont: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.label,
    },
    segmentedActiveFont: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.label,
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      gap: Spacing.sm,
    },
    customLabel: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
    },
    customInput: {
      flex: 1,
      ...Typography.body,
      color: colors.label,
      backgroundColor: colors.background,
      borderRadius: BorderRadius.small,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      textAlign: 'center',
    },
    helperText: {
      ...Typography.footnote,
      color: colors.tertiaryLabel,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
  });

export default PoolLimitSelector;
