/**
 * CountBadge
 *
 * Small badge displaying a count or short text.
 * Used for player counts, round numbers, etc.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing } from '../../theme';

export interface CountBadgeProps {
  value: string | number;
  variant?: 'accent' | 'tint' | 'muted';
  size?: 'small' | 'default';
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  value,
  variant = 'accent',
  size = 'default',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const badgeStyle = [
    styles.badge,
    size === 'small' && styles.badgeSmall,
    variant === 'tint' && styles.badgeTint,
    variant === 'muted' && styles.badgeMuted,
  ];

  const textStyle = [
    styles.text,
    size === 'small' && styles.textSmall,
    variant === 'tint' && styles.textTint,
    variant === 'muted' && styles.textMuted,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{value}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      backgroundColor: colors.accent,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 10,
    },
    badgeSmall: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: 8,
    },
    badgeTint: {
      backgroundColor: colors.tint + '20',
    },
    badgeMuted: {
      backgroundColor: colors.separator,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.label,
    },
    textSmall: {
      fontSize: 11,
    },
    textTint: {
      ...Typography.footnote,
      fontWeight: '700',
      color: colors.tint,
    },
    textMuted: {
      color: colors.secondaryLabel,
    },
  });

export default CountBadge;
