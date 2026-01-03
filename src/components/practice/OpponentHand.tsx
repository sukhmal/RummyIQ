/**
 * OpponentHand Component
 *
 * Displays a bot's hand as face-down cards.
 * Shows player name and card count.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PracticePlayer } from '../../engine/types';
import { ThemeColors, Spacing, BorderRadius, Typography } from '../../theme';
import Icon from '../Icon';

interface OpponentHandProps {
  player: PracticePlayer;
  cardCount: number;
  isCurrentTurn?: boolean;
  isDealer?: boolean;
  score?: number;
  style?: ViewStyle;
}

const OpponentHand: React.FC<OpponentHandProps> = ({
  player,
  cardCount,
  isCurrentTurn = false,
  isDealer = false,
  score = 0,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Calculate mini card display
  const displayCards = Math.min(cardCount, 13);
  const cardWidth = 20;
  const overlap = 8;
  const totalWidth = cardWidth + (displayCards - 1) * overlap;

  return (
    <View style={[styles.container, isCurrentTurn && styles.currentTurn, style]}>
      {/* Player info */}
      <View style={styles.playerInfo}>
        <View style={styles.nameRow}>
          <Icon
            name={player.isBot ? 'cpu' : 'person.fill'}
            size={14}
            color={colors.secondaryLabel}
            weight="medium"
          />
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
          {isDealer && (
            <View style={styles.dealerBadge}>
              <Text style={styles.dealerText}>D</Text>
            </View>
          )}
        </View>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {/* Cards display */}
      <View style={[styles.cardsContainer, { width: totalWidth + 8 }]}>
        {Array.from({ length: displayCards }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.miniCard,
              {
                left: index * overlap,
                zIndex: index,
              },
            ]}
          />
        ))}
      </View>

      {/* Card count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{cardCount}</Text>
      </View>

      {/* Turn indicator */}
      {isCurrentTurn && (
        <View style={styles.turnIndicator}>
          <Icon
            name="arrowtriangle.right.fill"
            size={12}
            color={colors.warning}
            weight="medium"
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.separator,
    },
    currentTurn: {
      borderColor: colors.warning,
      borderWidth: 2,
    },
    playerInfo: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    playerName: {
      ...Typography.subheadline,
      color: colors.label,
      fontWeight: '600',
      flex: 1,
    },
    dealerBadge: {
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
    scoreText: {
      ...Typography.caption1,
      color: colors.secondaryLabel,
      marginTop: 2,
    },
    cardsContainer: {
      height: 32,
      position: 'relative',
      marginRight: Spacing.xs,
    },
    miniCard: {
      position: 'absolute',
      width: 20,
      height: 28,
      backgroundColor: '#1a237e',
      borderRadius: 3,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    countBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.tertiaryLabel,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xs,
    },
    countText: {
      ...Typography.caption2,
      color: colors.label,
      fontWeight: '600',
    },
    turnIndicator: {
      position: 'absolute',
      left: -16,
      top: '50%',
      marginTop: -6,
    },
  });

export default OpponentHand;
