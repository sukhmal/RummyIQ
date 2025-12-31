import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import EditRoundModal from '../components/EditRoundModal';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';
import { Round } from '../types/game';

const screenWidth = Dimensions.get('window').width;

const HistoryScreen = ({ navigation, route }: any) => {
  const { currentGame, gameHistory } = useGame();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [editingRoundNumber, setEditingRoundNumber] = useState<number>(0);
  const [sortByScore, setSortByScore] = useState(false);

  // Track touch position for swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: GestureResponderEvent) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    const deltaX = e.nativeEvent.pageX - touchStartX.current;
    const deltaY = e.nativeEvent.pageY - touchStartY.current;

    // Swipe right to go back to game (if not viewing historical game)
    if (deltaX > 80 && Math.abs(deltaY) < 100 && !viewingHistoricalGame && !winner) {
      navigation.goBack();
    }
  };

  // Check if viewing a past game from history
  const gameId = route?.params?.gameId;
  const viewingHistoricalGame = gameId && gameId !== currentGame?.id;
  const historicalGame = viewingHistoricalGame
    ? gameHistory.find(g => g.id === gameId)
    : null;

  const displayGame = historicalGame || currentGame;

  if (!displayGame) {
    navigation.navigate('Home');
    return null;
  }

  const winner = displayGame.winner
    ? displayGame.players.find(p => p.id === displayGame.winner)
    : null;

  const getPlayerWins = (playerId: string) => {
    return displayGame.rounds.filter(r => r.winner === playerId).length;
  };

  const sortedPlayers = [...displayGame.players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return a.score - b.score;
  });

  // Use sorted or original player order based on toggle
  const leaderboardPlayers = sortByScore ? sortedPlayers : displayGame.players;

  // Calculate cumulative scores for the chart
  const getChartData = () => {
    if (displayGame.rounds.length === 0) return null;

    const datasets = displayGame.players.map((player, index) => {
      let cumulative = 0;
      const data = [0]; // Start at 0
      displayGame.rounds.forEach(round => {
        cumulative += round.scores[player.id] || 0;
        data.push(cumulative);
      });
      return {
        data,
        color: () => colors.chartColors[index % colors.chartColors.length],
        strokeWidth: 2,
      };
    });

    const labels = ['0', ...displayGame.rounds.map((_, i) => `${i + 1}`)];

    return {
      labels,
      datasets,
    };
  };

  const chartData = getChartData();

  const getGameTypeLabel = () => {
    if (displayGame.config.variant === 'pool') {
      return `Pool ${displayGame.config.poolLimit}`;
    } else if (displayGame.config.variant === 'deals') {
      return `${displayGame.config.numberOfDeals} Deals`;
    }
    return 'Points';
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['bottom']}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Winner Banner */}
        {winner && (
          <View style={styles.winnerBanner}>
            <View style={styles.winnerIconContainer}>
              <Icon name="trophy.fill" size={36} color={colors.gold} weight="medium" />
            </View>
            <View style={styles.winnerContent}>
              <Text style={styles.winnerLabel}>Winner</Text>
              <Text style={styles.winnerName}>{winner.name}</Text>
            </View>
          </View>
        )}

        {/* Game Info Badges */}
        <View style={styles.gameInfoSection}>
          <View style={styles.gameInfoRow}>
            {displayGame.name && (
              <View style={styles.infoBadge}>
                <Icon name="tag.fill" size={IconSize.small} color={colors.accent} weight="medium" />
                <Text style={styles.infoBadgeText}>{displayGame.name}</Text>
              </View>
            )}
            <View style={styles.infoBadge}>
              <Icon
                name={displayGame.config.variant === 'pool' ? 'person.3.fill' : displayGame.config.variant === 'deals' ? 'square.stack.fill' : 'star.fill'}
                size={IconSize.small}
                color={colors.accent}
                weight="medium"
              />
              <Text style={styles.infoBadgeText}>{getGameTypeLabel()}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Icon name="arrow.trianglehead.2.clockwise.rotate.90" size={IconSize.small} color={colors.accent} weight="medium" />
              <Text style={styles.infoBadgeText}>{displayGame.rounds.length} rounds</Text>
            </View>
          </View>
        </View>

        {/* Score Progression Chart */}
        {chartData && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SCORE PROGRESSION</Text>
            </View>
            <View style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth - 48, displayGame.rounds.length * 50 + 80)}
                  height={200}
                  chartConfig={{
                    backgroundColor: colors.cardBackground,
                    backgroundGradientFrom: colors.cardBackground,
                    backgroundGradientTo: colors.cardBackground,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(235, 235, 245, ${opacity * 0.6})`,
                    style: {
                      borderRadius: BorderRadius.large,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                    },
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                  withOuterLines={true}
                  fromZero={true}
                />
              </ScrollView>
              <View style={styles.legendContainer}>
                {displayGame.players.map((player, index) => (
                  <View key={player.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.chartColors[index % colors.chartColors.length] }]} />
                    <Text style={styles.legendText}>{player.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>LEADERBOARD</Text>
            <TouchableOpacity
              style={styles.sortToggle}
              onPress={() => setSortByScore(!sortByScore)}
              accessibilityLabel={sortByScore ? 'Show original order' : 'Sort by score'}
              accessibilityRole="button">
              <Icon
                name={sortByScore ? 'arrow.up.arrow.down.circle.fill' : 'arrow.up.arrow.down.circle'}
                size={IconSize.medium}
                color={sortByScore ? colors.tint : colors.tertiaryLabel}
                weight="medium"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.rankColumn]}>#</Text>
              <Text style={[styles.headerCell, styles.nameColumn]}>Player</Text>
              <Text style={[styles.headerCell, styles.scoreColumn]}>Score</Text>
              <Text style={[styles.headerCell, styles.winsColumn]}>Wins</Text>
            </View>

            {/* Player Rows */}
            {leaderboardPlayers.map((player, index) => {
              const isLast = index === leaderboardPlayers.length - 1;
              const isWinner = player.id === displayGame.winner;
              return (
                <View
                  key={player.id}
                  style={[
                    styles.leaderboardRow,
                    !isLast && styles.leaderboardRowBorder,
                    player.isEliminated && styles.eliminatedRow,
                  ]}>
                  <View style={[styles.rankColumn, styles.rankContainer]}>
                    {sortByScore && index === 0 && !player.isEliminated ? (
                      <View style={styles.rankBadgeGold}>
                        <Text style={styles.rankBadgeText}>1</Text>
                      </View>
                    ) : sortByScore && index === 1 && !player.isEliminated ? (
                      <View style={styles.rankBadgeSilver}>
                        <Text style={styles.rankBadgeText}>{index + 1}</Text>
                      </View>
                    ) : sortByScore && index === 2 && !player.isEliminated ? (
                      <View style={styles.rankBadgeBronze}>
                        <Text style={styles.rankBadgeText}>{index + 1}</Text>
                      </View>
                    ) : (
                      <Text style={styles.rankText}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.nameColumn}>
                    <Text
                      style={[
                        styles.playerName,
                        player.isEliminated && styles.eliminatedText,
                        isWinner && styles.winnerTextStyle,
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
                  <View style={styles.winsColumn}>
                    <View style={styles.winsBadge}>
                      <Text style={styles.winsText}>{getPlayerWins(player.id)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Round History */}
        {displayGame.rounds.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>ROUND HISTORY</Text>
              <View style={styles.roundHistoryBadge}>
                <Text style={styles.roundHistoryBadgeText}>{displayGame.rounds.length}</Text>
              </View>
            </View>

            {[...displayGame.rounds].reverse().map((round, index) => {
              const roundNumber = displayGame.rounds.length - index;
              const canEdit = !viewingHistoricalGame;

              return (
                <TouchableOpacity
                  key={round.id}
                  style={styles.roundCard}
                  onPress={() => {
                    if (canEdit) {
                      setEditingRound(round);
                      setEditingRoundNumber(roundNumber);
                    }
                  }}
                  disabled={!canEdit}
                  accessibilityLabel={`Edit round ${roundNumber}`}
                  accessibilityRole="button">
                  <View style={styles.roundHeader}>
                    <View style={styles.roundNumberBadge}>
                      <Text style={styles.roundNumberText}>R{roundNumber}</Text>
                    </View>
                    {canEdit && (
                      <Icon name="pencil" size={IconSize.small} color={colors.tertiaryLabel} weight="medium" />
                    )}
                  </View>
                  <View style={styles.roundScores}>
                    {displayGame.players.map((player, playerIndex) => {
                      const score = round.scores[player.id] || 0;
                      const isRoundWinner = player.id === round.winner;
                      const isLastPlayer = playerIndex === displayGame.players.length - 1;
                      return (
                        <View
                          key={player.id}
                          style={[
                            styles.roundScoreRow,
                            !isLastPlayer && styles.roundScoreRowBorder,
                          ]}>
                          <View style={styles.roundPlayerNameRow}>
                            <Text style={[
                              styles.roundPlayerName,
                              isRoundWinner && styles.roundPlayerNameWinner,
                            ]}>
                              {player.name}
                            </Text>
                            {isRoundWinner && (
                              <Icon name="crown.fill" size={12} color={colors.gold} weight="medium" />
                            )}
                          </View>
                          <Text style={[
                            styles.roundPlayerScore,
                            isRoundWinner && styles.roundPlayerScoreWinner,
                          ]}>
                            {score > 0 ? `+${score}` : score}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {viewingHistoricalGame ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Home')}
              accessibilityLabel="Back to home"
              accessibilityRole="button">
              <Icon name="house.fill" size={IconSize.medium} color={colors.label} weight="medium" />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          ) : !winner ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Continue game"
              accessibilityRole="button">
              <Icon name="play.fill" size={IconSize.medium} color={colors.label} weight="medium" />
              <Text style={styles.primaryButtonText}>Continue Game</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* Edit Round Modal */}
      <EditRoundModal
        visible={editingRound !== null}
        round={editingRound}
        roundNumber={editingRoundNumber}
        players={displayGame.players}
        onClose={() => {
          setEditingRound(null);
          setEditingRoundNumber(0);
        }}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Winner Banner
  winnerBanner: {
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
  winnerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerContent: {
    flex: 1,
  },
  winnerLabel: {
    ...Typography.caption1,
    color: colors.gold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  winnerName: {
    ...Typography.title1,
    color: colors.label,
  },

  // Game Info Badges
  gameInfoSection: {
    marginBottom: Spacing.lg,
  },
  gameInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    gap: Spacing.sm,
  },
  infoBadgeText: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.accent,
  },

  // Section Styles
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryLabel,
    letterSpacing: 0.5,
  },
  sortToggle: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },

  // Chart Card
  chartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.medium,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
  },

  // Card Styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },

  // Table Header
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

  // Column Definitions
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

  // Leaderboard Row
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TapTargets.minimum,
  },
  leaderboardRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  eliminatedRow: {
    opacity: 0.5,
  },

  // Rank Badges
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

  // Player Info
  playerName: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.label,
  },
  winnerTextStyle: {
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

  // Round History
  roundHistoryBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: Spacing.xs,
  },
  roundHistoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.label,
  },
  roundCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  roundNumberBadge: {
    backgroundColor: colors.tint + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  roundNumberText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: colors.tint,
  },
  roundScores: {
    padding: Spacing.md,
  },
  roundScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  roundScoreRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  roundPlayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roundPlayerName: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
  },
  roundPlayerNameWinner: {
    color: colors.success,
    fontWeight: '600',
  },
  roundPlayerScore: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.label,
  },
  roundPlayerScoreWinner: {
    color: colors.success,
  },

  // Action Buttons
  actionSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    minHeight: TapTargets.comfortable,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: colors.label,
  },
});

export default HistoryScreen;
