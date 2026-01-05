/**
 * SectionHeader
 *
 * Reusable section header with label, optional badge, and optional action.
 * Used across setup and history screens.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Spacing, IconSize } from '../../theme';
import Icon from '../Icon';

export interface SectionHeaderProps {
  label: string;
  badge?: string | number;
  action?: {
    icon: string;
    iconFilled?: string;
    isActive?: boolean;
    onPress: () => void;
    accessibilityLabel: string;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  badge,
  action,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {action && (
        <TouchableOpacity
          style={styles.action}
          onPress={action.onPress}
          accessibilityLabel={action.accessibilityLabel}
          accessibilityRole="button">
          <Icon
            name={action.isActive && action.iconFilled ? action.iconFilled : action.icon}
            size={IconSize.medium}
            color={action.isActive ? colors.tint : colors.tertiaryLabel}
            weight="medium"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
      gap: Spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondaryLabel,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      flex: 1,
    },
    badge: {
      backgroundColor: colors.accent,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.label,
    },
    action: {
      padding: Spacing.xs,
    },
  });

export default SectionHeader;
