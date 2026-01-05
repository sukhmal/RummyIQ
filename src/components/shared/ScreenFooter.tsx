/**
 * ScreenFooter
 *
 * Footer container for action buttons at the bottom of screens.
 * Provides consistent styling with border-top separator.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Spacing } from '../../theme';

export interface ScreenFooterProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  style?: ViewStyle;
}

export const ScreenFooter: React.FC<ScreenFooterProps> = ({
  children,
  direction = 'column',
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.footer, direction === 'row' && styles.footerRow, style]}>
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    footer: {
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.cardBackground,
      gap: Spacing.md,
    },
    footerRow: {
      flexDirection: 'row',
    },
  });

export default ScreenFooter;
