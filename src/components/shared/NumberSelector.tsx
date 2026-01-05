/**
 * NumberSelector
 *
 * Shared component for selecting a number from a set of options.
 * Used for selecting bot count, number of deals, etc.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, BorderRadius } from '../../theme';

export interface NumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  helperText?: string | ((value: number) => string);
  disabled?: boolean;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({
  value,
  onChange,
  options,
  helperText,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const resolvedHelperText = typeof helperText === 'function'
    ? helperText(value)
    : helperText;

  return (
    <View>
      <View style={styles.segmentedControl}>
        {options.map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.segment,
              value === num && styles.selectedSegment,
            ]}
            onPress={() => !disabled && onChange(num)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: value === num }}
          >
            <Text
              style={[
                styles.segmentText,
                value === num && styles.selectedSegmentText,
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {resolvedHelperText && (
        <Text style={styles.helperText}>{resolvedHelperText}</Text>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    segment: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.small,
    },
    selectedSegment: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      ...Typography.body,
      color: colors.secondaryLabel,
      fontWeight: '600',
    },
    selectedSegmentText: {
      color: '#FFFFFF',
    },
    helperText: {
      ...Typography.footnote,
      color: colors.tertiaryLabel,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
  });

export default NumberSelector;
