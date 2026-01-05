/**
 * GameInfoBadges
 *
 * Displays game information as a row of badges (variant, rounds, etc.)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GameVariant } from '../../types/shared';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import { getGameTypeLabel } from '../../utils/formatters';
import Icon from '../Icon';

export interface GameInfoBadgesProps {
  gameName?: string;
  variant: GameVariant;
  poolLimit?: number;
  numberOfDeals?: number;
  roundCount: number;
  playerCount?: number;
}

const getVariantIcon = (variant: GameVariant): string => {
  switch (variant) {
    case 'pool':
      return 'person.3.fill';
    case 'deals':
      return 'square.stack.fill';
    case 'points':
    default:
      return 'star.fill';
  }
};


export const GameInfoBadges: React.FC<GameInfoBadgesProps> = ({
  gameName,
  variant,
  poolLimit,
  numberOfDeals,
  roundCount,
  playerCount,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {gameName && (
          <View style={styles.badge}>
            <Icon name="tag.fill" size={IconSize.small} color={colors.accent} weight="medium" />
            <Text style={styles.badgeText}>{gameName}</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Icon
            name={getVariantIcon(variant)}
            size={IconSize.small}
            color={colors.accent}
            weight="medium"
          />
          <Text style={styles.badgeText}>
            {getGameTypeLabel(variant, poolLimit, numberOfDeals)}
          </Text>
        </View>
        <View style={styles.badge}>
          <Icon
            name="arrow.trianglehead.2.clockwise.rotate.90"
            size={IconSize.small}
            color={colors.accent}
            weight="medium"
          />
          <Text style={styles.badgeText}>{roundCount} rounds</Text>
        </View>
        {playerCount !== undefined && (
          <View style={styles.badge}>
            <Icon name="person.2.fill" size={IconSize.small} color={colors.accent} weight="medium" />
            <Text style={styles.badgeText}>{playerCount} players</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.large,
      gap: Spacing.sm,
    },
    badgeText: {
      ...Typography.subheadline,
      fontWeight: '600',
      color: colors.accent,
    },
  });

export default GameInfoBadges;
