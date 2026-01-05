/**
 * NumberInputField
 *
 * Labeled numeric input field with optional icon, prefix, and suffix.
 * Used for drop penalties, join table amount, point value, etc.
 */

import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../Icon';

export interface NumberInputFieldProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  defaultValue?: number;
  icon?: string;
  prefix?: React.ReactNode;
  suffix?: string;
  disabled?: boolean;
}

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  value,
  onChange,
  placeholder = '0',
  defaultValue = 0,
  icon,
  prefix,
  suffix,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleChangeText = (text: string) => {
    const parsed = parseInt(text, 10);
    onChange(isNaN(parsed) ? defaultValue : parsed);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        {icon && (
          <Icon name={icon} size={IconSize.medium} color={colors.secondaryLabel} weight="medium" />
        )}
        {prefix}
        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={!disabled}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      overflow: 'hidden',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
    },
    input: {
      flex: 1,
      ...Typography.body,
      color: colors.label,
      padding: 0,
    },
    suffix: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
    },
  });

export default NumberInputField;
