/**
 * Leaderboard
 *
 * Displays player rankings with scores, wins, and rank badges.
 * Used in both Scorer and Practice history screens.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Typography, Spacing, TapTargets, BorderRadius } from '../../theme';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  wins?: number;
  isWinner?: boolean;
  isEliminated?: boolean;
}

export interface LeaderboardProps {
  players: LeaderboardPlayer[];
  showRanks?: boolean;
  showWins?: boolean;
  winnerId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  showRanks = true,
  showWins = true,
  winnerId,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        {showRanks && <Text style={[styles.headerCell, styles.rankColumn]}>#</Text>}
        <Text style={[styles.headerCell, styles.nameColumn]}>Player</Text>
        <Text style={[styles.headerCell, styles.scoreColumn]}>Score</Text>
        {showWins && <Text style={[styles.headerCell, styles.winsColumn]}>Wins</Text>}
      </View>

      {/* Player Rows */}
      {players.map((player, index) => {
        const isLast = index === players.length - 1;
        const isWinner = player.isWinner || player.id === winnerId;
        const rank = index + 1;

        return (
          <View
            key={player.id}
            style={[
              styles.row,
              !isLast && styles.rowBorder,
              player.isEliminated && styles.eliminatedRow,
            ]}>
            {showRanks && (
              <View style={[styles.rankColumn, styles.rankContainer]}>
                {rank === 1 && !player.isEliminated ? (
                  <View style={styles.rankBadgeGold}>
                    <Text style={styles.rankBadgeText}>1</Text>
                  </View>
                ) : rank === 2 && !player.isEliminated ? (
                  <View style={styles.rankBadgeSilver}>
                    <Text style={styles.rankBadgeText}>2</Text>
                  </View>
                ) : rank === 3 && !player.isEliminated ? (
                  <View style={styles.rankBadgeBronze}>
                    <Text style={styles.rankBadgeText}>3</Text>
                  </View>
                ) : (
                  <Text style={styles.rankText}>{rank}</Text>
                )}
              </View>
            )}
            <View style={styles.nameColumn}>
              <Text
                style={[
                  styles.playerName,
                  player.isEliminated && styles.eliminatedText,
                  isWinner && styles.winnerText,
                ]}
                numberOfLines={1}>
                {player.name}
              </Text>
              {player.isEliminated && (
                <Text style={styles.eliminatedLabel}>Eliminated</Text>
              )}
            </View>
            <View style={styles.scoreColumn}>
              <Text style={[styles.scoreText, player.isEliminated && styles.eliminatedText]}>
                {player.score}
              </Text>
            </View>
            {showWins && (
              <View style={styles.winsColumn}>
                <View style={styles.winsBadge}>
                  <Text style={styles.winsText}>{player.wins || 0}</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
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
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
      backgroundColor: colors.background,
    },
    headerCell: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.tertiaryLabel,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rankColumn: {
      width: 44,
      alignItems: 'center',
    },
    rankContainer: {
      justifyContent: 'center',
    },
    nameColumn: {
      flex: 2,
    },
    scoreColumn: {
      flex: 1,
      alignItems: 'center',
    },
    winsColumn: {
      flex: 0.8,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: TapTargets.minimum,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    eliminatedRow: {
      opacity: 0.5,
    },
    rankBadgeGold: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rankBadgeSilver: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#C0C0C0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rankBadgeBronze: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#CD7F32',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rankBadgeText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#000',
    },
    rankText: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.secondaryLabel,
    },
    playerName: {
      ...Typography.body,
      fontWeight: '500',
      color: colors.label,
    },
    winnerText: {
      color: colors.success,
      fontWeight: '600',
    },
    eliminatedText: {
      textDecorationLine: 'line-through',
      color: colors.tertiaryLabel,
    },
    eliminatedLabel: {
      ...Typography.caption2,
      color: colors.destructive,
      marginTop: 2,
    },
    scoreText: {
      ...Typography.headline,
      color: colors.label,
    },
    winsBadge: {
      backgroundColor: colors.accent + '30',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.small,
    },
    winsText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
  });

export default Leaderboard;
