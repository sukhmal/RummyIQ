/**
 * PracticeHistoryScreen
 *
 * Shows game results, round history, and final scores.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../../components/Icon';

const PracticeHistoryScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { gameState, resetGame } = usePracticeGame();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePlayAgain = async () => {
    await resetGame();
    navigation.replace('PracticeSetup');
  };

  const handleGoHome = async () => {
    await resetGame();
    navigation.navigate('Home');
  };

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No game data available</Text>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Sort players by score (lowest first for deals/points, winner first for pool)
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    const scoreA = gameState.scores[a.id] || 0;
    const scoreB = gameState.scores[b.id] || 0;

    if (gameState.config.variant.startsWith('pool')) {
      // Pool: winner is last remaining (lowest score among active)
      if (gameState.winner?.id === a.id) return -1;
      if (gameState.winner?.id === b.id) return 1;
    }

    return scoreA - scoreB;
  });

  const isPoolVariant = gameState.config.variant.startsWith('pool');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner Banner */}
        {gameState.winner && (
          <View style={styles.winnerBanner}>
            <Icon name="trophy.fill" size={40} color={colors.gold} weight="medium" />
            <Text style={styles.winnerTitle}>Winner!</Text>
            <Text style={styles.winnerName}>{gameState.winner.name}</Text>
            <Text style={styles.winnerScore}>
              {gameState.scores[gameState.winner.id] || 0} points
            </Text>
          </View>
        )}

        {/* Final Standings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Final Standings</Text>
          {sortedPlayers.map((player, index) => {
            const score = gameState.scores[player.id] || 0;
            const isWinner = gameState.winner?.id === player.id;
            const isEliminated = isPoolVariant && gameState.activePlayers.indexOf(player.id) === -1;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  isWinner && styles.winnerRow,
                  isEliminated && styles.eliminatedRow,
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankText, isWinner && styles.winnerRankText]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <View style={styles.playerNameRow}>
                    <Icon
                      name={player.isBot ? 'cpu' : 'person.fill'}
                      size={14}
                      color={isWinner ? colors.gold : colors.secondaryLabel}
                    />
                    <Text
                      style={[
                        styles.playerName,
                        isWinner && styles.winnerPlayerName,
                        isEliminated && styles.eliminatedText,
                      ]}
                    >
                      {player.name}
                    </Text>
                    {isWinner && (
                      <Icon name="crown.fill" size={14} color={colors.gold} />
                    )}
                  </View>
                  {player.isBot && player.difficulty && (
                    <Text style={styles.difficultyLabel}>
                      {player.difficulty.charAt(0).toUpperCase() + player.difficulty.slice(1)}
                    </Text>
                  )}
                </View>
                <View style={styles.scoreContainer}>
                  <Text
                    style={[
                      styles.scoreText,
                      isWinner && styles.winnerScoreText,
                      isEliminated && styles.eliminatedText,
                    ]}
                  >
                    {score}
                  </Text>
                  {isEliminated && (
                    <Text style={styles.eliminatedLabel}>OUT</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Round History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round History</Text>
          {gameState.roundResults.map((result, index) => (
            <View key={index} style={styles.roundCard}>
              <View style={styles.roundHeader}>
                <Text style={styles.roundNumber}>Round {index + 1}</Text>
                <View style={styles.roundResult}>
                  <Text style={styles.roundWinner}>{result.winnerName}</Text>
                  <Text style={styles.resultType}>
                    {result.declarationType === 'valid'
                      ? 'Declared'
                      : result.declarationType === 'invalid'
                      ? 'Invalid'
                      : result.declarationType.startsWith('drop')
                      ? 'Dropped'
                      : result.declarationType}
                  </Text>
                </View>
              </View>
              <View style={styles.roundScores}>
                {Object.entries(result.scores)
                  .sort(([, a], [, b]) => a - b)
                  .map(([playerId, roundScore]) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    return (
                      <View key={playerId} style={styles.roundScoreItem}>
                        <Text style={styles.roundPlayerName} numberOfLines={1}>
                          {player?.name || 'Unknown'}
                        </Text>
                        <Text
                          style={[
                            styles.roundScoreValue,
                            roundScore === 0 && styles.zeroScore,
                          ]}
                        >
                          {roundScore === 0 ? 'WIN' : `+${roundScore}`}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          ))}
        </View>

        {/* Game Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Variant</Text>
              <Text style={styles.infoValue}>{gameState.config.variant.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rounds Played</Text>
              <Text style={styles.infoValue}>{gameState.roundResults.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Players</Text>
              <Text style={styles.infoValue}>{gameState.players.length}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoHome}
        >
          <Icon name="house.fill" size={IconSize.medium} color={colors.accent} />
          <Text style={[styles.buttonText, { color: colors.accent }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handlePlayAgain}
        >
          <Icon name="arrow.counterclockwise" size={IconSize.medium} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      ...Typography.body,
      color: colors.secondaryLabel,
      marginBottom: Spacing.md,
    },
    homeButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.accent,
      borderRadius: BorderRadius.medium,
    },
    homeButtonText: {
      ...Typography.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    winnerBanner: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      backgroundColor: colors.gold + '15',
      borderRadius: BorderRadius.large,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.gold + '30',
    },
    winnerTitle: {
      ...Typography.title2,
      color: colors.gold,
      marginTop: Spacing.sm,
    },
    winnerName: {
      ...Typography.title1,
      color: colors.label,
      marginTop: Spacing.xs,
    },
    winnerScore: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
      marginTop: Spacing.xs,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.headline,
      color: colors.label,
      marginBottom: Spacing.md,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    winnerRow: {
      backgroundColor: colors.gold + '15',
      borderColor: colors.gold,
    },
    eliminatedRow: {
      opacity: 0.6,
    },
    rankContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    rankText: {
      ...Typography.headline,
      color: colors.label,
    },
    winnerRankText: {
      color: colors.gold,
    },
    playerInfo: {
      flex: 1,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    playerName: {
      ...Typography.body,
      color: colors.label,
      fontWeight: '600',
    },
    winnerPlayerName: {
      color: colors.gold,
    },
    eliminatedText: {
      color: colors.tertiaryLabel,
    },
    difficultyLabel: {
      ...Typography.caption2,
      color: colors.tertiaryLabel,
      marginTop: 2,
    },
    scoreContainer: {
      alignItems: 'flex-end',
    },
    scoreText: {
      ...Typography.title3,
      color: colors.label,
    },
    winnerScoreText: {
      color: colors.gold,
    },
    eliminatedLabel: {
      ...Typography.caption2,
      color: colors.destructive,
      marginTop: 2,
    },
    roundCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    roundHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    roundNumber: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
      fontWeight: '600',
    },
    roundResult: {
      alignItems: 'flex-end',
    },
    roundWinner: {
      ...Typography.body,
      color: colors.label,
      fontWeight: '600',
    },
    resultType: {
      ...Typography.caption2,
      color: colors.tertiaryLabel,
    },
    roundScores: {
      gap: Spacing.xs,
    },
    roundScoreItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roundPlayerName: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      flex: 1,
    },
    roundScoreValue: {
      ...Typography.footnote,
      color: colors.label,
      fontWeight: '600',
    },
    zeroScore: {
      color: colors.success,
    },
    infoCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    infoLabel: {
      ...Typography.body,
      color: colors.secondaryLabel,
    },
    infoValue: {
      ...Typography.body,
      color: colors.label,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      padding: Spacing.md,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.cardBackground,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.medium,
      borderWidth: 1,
      borderColor: colors.accent,
      gap: Spacing.xs,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.medium,
      backgroundColor: colors.success,
      gap: Spacing.xs,
    },
    buttonText: {
      ...Typography.body,
      fontWeight: '600',
    },
    primaryButtonText: {
      ...Typography.body,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default PracticeHistoryScreen;
