/**
 * PlayerSeat Component
 *
 * Displays a player's seat around the virtual table.
 * Shows avatar, name, score, and turn indicator.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PracticePlayer } from '../../engine/types';
import { ThemeColors, Spacing, Typography } from '../../theme';
import Icon from '../Icon';

interface PlayerSeatProps {
  player: PracticePlayer;
  score: number;
  isCurrentTurn?: boolean;
  isDealer?: boolean;
  isHuman?: boolean;
  cardCount?: number;
  style?: ViewStyle;
}

const AVATAR_SIZE = 44;

const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  score,
  isCurrentTurn = false,
  isDealer = false,
  isHuman = false,
  cardCount,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Get initials for avatar
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <View style={[styles.avatar, isCurrentTurn && styles.avatarCurrentTurn]}>
        {isHuman ? (
          <Icon
            name="person.fill"
            size={22}
            color={colors.label}
            weight="medium"
          />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}

        {/* Dealer badge */}
        {isDealer && (
          <View style={styles.dealerBadge}>
            <Text style={styles.dealerText}>D</Text>
          </View>
        )}

        {/* Card count badge */}
        {cardCount !== undefined && (
          <View style={styles.cardCountBadge}>
            <Text style={styles.cardCountText}>{cardCount}</Text>
          </View>
        )}
      </View>

      {/* Name and Score */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {isHuman ? 'You' : player.name}
        </Text>
        <Text style={styles.score}>{score}</Text>
      </View>

      {/* Turn indicator arrow */}
      {isCurrentTurn && (
        <View style={styles.turnArrow}>
          <Icon
            name="arrowtriangle.down.fill"
            size={10}
            color={colors.warning}
            weight="bold"
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      width: 70,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.separator,
    },
    avatarCurrentTurn: {
      borderColor: colors.warning,
      borderWidth: 3,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
    },
    initials: {
      ...Typography.headline,
      color: colors.label,
      fontWeight: '600',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: 4,
    },
    name: {
      ...Typography.caption1,
      color: colors.label,
      fontWeight: '500',
      textAlign: 'center',
    },
    score: {
      ...Typography.caption2,
      color: colors.secondaryLabel,
    },
    dealerBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dealerText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#000',
    },
    cardCountBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    cardCountText: {
      ...Typography.caption2,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    turnArrow: {
      position: 'absolute',
      top: -14,
    },
  });

export default PlayerSeat;
