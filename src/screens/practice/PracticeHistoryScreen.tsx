/**
 * PracticeHistoryScreen
 *
 * Shows game results, round history, and final scores.
 */

import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../../components/Icon';
import { Card } from '../../components/practice';
import { GameInfoBadges } from '../../components/shared';
import { autoArrangeHand } from '../../engine/declaration';
import { Meld, Card as CardType } from '../../engine/types';

const PracticeHistoryScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { gameState, resetGame } = usePracticeGame();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Keep landscape orientation, unlock when leaving
  useEffect(() => {
    Orientation.lockToLandscape();
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  const handlePlayAgain = async () => {
    Orientation.unlockAllOrientations();
    await resetGame();
    navigation.replace('PracticeSetup');
  };

  const handleGoHome = async () => {
    Orientation.unlockAllOrientations();
    await resetGame();
    navigation.navigate('Home');
  };

  // Get arranged hands for all players (must be before conditional return for hooks rule)
  // For the winner: use their declared melds
  // For others: use autoArrangeHand
  const arrangedHands = useMemo(() => {
    const hands: { [playerId: string]: { melds: Meld[]; deadwood: CardType[] } } = {};

    // Get the last round result which has declared melds and final hands
    const lastResult = gameState?.roundResults[gameState.roundResults.length - 1];
    const finalHands = lastResult?.finalHands || gameState?.currentRound?.hands || {};
    const declaredMelds = lastResult?.declaredMelds;
    const winnerId = lastResult?.winnerId;

    Object.entries(finalHands).forEach(([playerId, hand]) => {
      if (hand.length > 0) {
        // For the winner with valid declaration, use their declared melds
        if (playerId === winnerId && declaredMelds && declaredMelds.length > 0) {
          // Calculate deadwood from declared melds
          const meldCardIds = new Set(declaredMelds.flatMap(m => m.cards.map(c => c.id)));
          const deadwood = hand.filter(c => !meldCardIds.has(c.id));
          hands[playerId] = { melds: declaredMelds, deadwood };
        } else {
          // For others, use autoArrangeHand (first 13 cards)
          const handToArrange = hand.slice(0, 13);
          hands[playerId] = autoArrangeHand(handToArrange);
        }
      }
    });

    return hands;
  }, [gameState?.roundResults, gameState?.currentRound?.hands]);

  // Helper to get meld type label
  const getMeldTypeLabel = (meld: Meld): string => {
    if (meld.type === 'pure-sequence') return 'Pure';
    if (meld.type === 'sequence') return 'Seq';
    return 'Set';
  };

  // Helper to get meld type color
  const getMeldTypeColor = (meld: Meld): string => {
    if (meld.type === 'pure-sequence') return colors.success;
    if (meld.type === 'sequence') return colors.accent;
    return colors.warning;
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Final Hands - Show all players' melds */}
        {Object.keys(arrangedHands).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Final Hands</Text>
            {sortedPlayers.map((player) => {
              const arranged = arrangedHands[player.id];
              if (!arranged) return null;

              const isWinner = gameState.winner?.id === player.id;

              return (
                <View key={player.id} style={[styles.handCard, isWinner && styles.winnerHandCard]}>
                  <View style={styles.handHeader}>
                    <View style={styles.handPlayerInfo}>
                      <Icon
                        name={player.isBot ? 'cpu' : 'person.fill'}
                        size={14}
                        color={isWinner ? colors.gold : colors.label}
                      />
                      <Text style={[styles.handPlayerName, isWinner && styles.winnerHandPlayerName]}>
                        {player.id === 'human' ? 'You' : player.name}
                      </Text>
                      {isWinner && (
                        <Icon name="crown.fill" size={14} color={colors.gold} />
                      )}
                    </View>
                    <Text style={[styles.handScore, isWinner && styles.winnerHandScore]}>
                      {gameState.scores[player.id] || 0} pts
                    </Text>
                  </View>

                  {/* All cards in one line with gaps between groups */}
                  <View style={styles.allCardsRow}>
                    {arranged.melds.map((meld, meldIdx) => (
                      <View key={meldIdx} style={[styles.meldGroupContainer, meldIdx > 0 && styles.meldGap]}>
                        <View style={styles.meldGroup}>
                          {meld.cards.map((card, idx) => (
                            <View key={card.id} style={[styles.cardWrapper, idx > 0 && styles.cardOverlap]}>
                              <Card card={card} size="medium" />
                            </View>
                          ))}
                        </View>
                        <View style={[styles.meldTypeBadgeOverlay, { backgroundColor: getMeldTypeColor(meld) }]}>
                          <Text style={styles.meldTypeBadgeText}>{getMeldTypeLabel(meld)}</Text>
                        </View>
                      </View>
                    ))}
                    {arranged.deadwood.length > 0 && (
                      <View style={[styles.meldGroupContainer, styles.meldGap]}>
                        <View style={[styles.meldGroup, styles.deadwoodGroup]}>
                          {arranged.deadwood.map((card, idx) => (
                            <View key={card.id} style={[styles.cardWrapper, idx > 0 && styles.cardOverlap]}>
                              <Card card={card} size="medium" />
                            </View>
                          ))}
                        </View>
                        <View style={[styles.meldTypeBadgeOverlay, { backgroundColor: colors.destructive }]}>
                          <Text style={styles.meldTypeBadgeText}>
                            {arranged.deadwood.reduce((sum, c) => sum + c.value, 0)}pts
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
          <GameInfoBadges
            variant={gameState.config.variant}
            poolLimit={gameState.config.poolLimit}
            numberOfDeals={gameState.config.numberOfDeals}
            roundCount={gameState.roundResults.length}
            playerCount={gameState.players.length}
          />
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
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.headline,
      color: colors.label,
      marginBottom: Spacing.md,
    },
    // Final Hands styles
    handCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    winnerHandCard: {
      backgroundColor: colors.gold + '15',
      borderColor: colors.gold,
    },
    handHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      paddingBottom: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    handPlayerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    handPlayerName: {
      ...Typography.subheadline,
      color: colors.label,
      fontWeight: '600',
    },
    winnerHandPlayerName: {
      color: colors.gold,
    },
    handScore: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
      fontWeight: '600',
    },
    winnerHandScore: {
      color: colors.gold,
    },
    allCardsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      marginTop: Spacing.xs,
    },
    meldGroupContainer: {
      position: 'relative',
    },
    meldTypeBadgeOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingVertical: 3,
      alignItems: 'center',
      borderBottomLeftRadius: BorderRadius.small,
      borderBottomRightRadius: BorderRadius.small,
    },
    meldTypeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    meldGroup: {
      flexDirection: 'row',
    },
    meldGap: {
      marginLeft: Spacing.sm,
    },
    deadwoodGroup: {
      opacity: 0.6,
    },
    cardWrapper: {
      marginBottom: 2,
    },
    cardOverlap: {
      marginLeft: -30,
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
