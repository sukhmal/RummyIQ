/**
 * WinnerBanner
 *
 * Displays a banner announcing the game winner with trophy icon.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, BorderRadius } from '../../theme';
import Icon from '../Icon';

export interface WinnerBannerProps {
  winnerName: string;
  subtitle?: string;
  icon?: 'trophy' | 'crown';
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({
  winnerName,
  subtitle = 'Winner',
  icon = 'trophy',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon
          name={icon === 'trophy' ? 'trophy.fill' : 'crown.fill'}
          size={36}
          color={colors.gold}
          weight="medium"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{subtitle}</Text>
        <Text style={styles.name}>{winnerName}</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.gold + '15',
      borderWidth: 2,
      borderColor: colors.gold,
      borderRadius: BorderRadius.large,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.gold + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    label: {
      ...Typography.caption1,
      color: colors.gold,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    name: {
      ...Typography.title1,
      color: colors.label,
    },
  });

export default WinnerBanner;
