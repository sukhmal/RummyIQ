/**
 * PrimaryButton
 *
 * Reusable primary action button with icon support.
 * Used for main actions like "Start Game", "Submit", "Continue", etc.
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../../theme';
import Icon from '../Icon';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  color?: 'primary' | 'success' | 'destructive';
  size?: 'default' | 'compact';
  flex?: boolean;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  icon,
  disabled = false,
  variant = 'filled',
  color = 'primary',
  size = 'default',
  flex = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getBackgroundColor = () => {
    if (disabled) {
      return variant === 'filled' ? colors.cardBackground : 'transparent';
    }
    if (variant === 'outlined') return 'transparent';
    switch (color) {
      case 'success':
        return colors.success;
      case 'destructive':
        return colors.destructive;
      case 'primary':
      default:
        return colors.tint;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.separator;
    switch (color) {
      case 'success':
        return colors.success;
      case 'destructive':
        return colors.destructive;
      case 'primary':
      default:
        return colors.accent;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.tertiaryLabel;
    if (variant === 'outlined') {
      switch (color) {
        case 'success':
          return colors.success;
        case 'destructive':
          return colors.destructive;
        case 'primary':
        default:
          return colors.accent;
      }
    }
    // Filled variant - use label color (typically white/light)
    return colors.label;
  };

  const buttonStyle = [
    styles.button,
    size === 'compact' && styles.buttonCompact,
    flex && styles.buttonFlex,
    { backgroundColor: getBackgroundColor() },
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: getBorderColor(),
    },
    style,
  ];

  const textStyle = [
    size === 'compact' ? styles.textCompact : styles.text,
    { color: getTextColor() },
  ];

  const iconColor = getTextColor();

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      {icon && (
        <Icon
          name={icon}
          size={size === 'compact' ? IconSize.small : IconSize.medium}
          color={iconColor}
          weight="medium"
        />
      )}
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.large,
      padding: Spacing.lg,
      gap: Spacing.sm,
      minHeight: TapTargets.comfortable,
    },
    buttonCompact: {
      padding: Spacing.md,
      borderRadius: BorderRadius.medium,
      minHeight: TapTargets.minimum,
    },
    buttonFlex: {
      flex: 1,
    },
    text: {
      ...Typography.headline,
      fontWeight: '600',
    },
    textCompact: {
      ...Typography.body,
      fontWeight: '600',
    },
  });

export default PrimaryButton;
