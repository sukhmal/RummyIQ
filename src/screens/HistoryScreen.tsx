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
import { WinnerBanner, GameInfoBadges, Leaderboard, LeaderboardPlayer, PrimaryButton, SectionHeader } from '../components/shared';
import { ThemeColors, Typography, Spacing, IconSize, BorderRadius } from '../theme';
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
          <WinnerBanner winnerName={winner.name} />
        )}

        {/* Game Info Badges */}
        <GameInfoBadges
          gameName={displayGame.name}
          variant={displayGame.config.variant}
          poolLimit={displayGame.config.poolLimit}
          numberOfDeals={displayGame.config.numberOfDeals}
          roundCount={displayGame.rounds.length}
        />

        {/* Score Progression Chart */}
        {chartData && (
          <View style={styles.section}>
            <SectionHeader label="SCORE PROGRESSION" />
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
          <SectionHeader
            label="LEADERBOARD"
            action={{
              icon: 'arrow.up.arrow.down.circle',
              iconFilled: 'arrow.up.arrow.down.circle.fill',
              isActive: sortByScore,
              onPress: () => setSortByScore(!sortByScore),
              accessibilityLabel: sortByScore ? 'Show original order' : 'Sort by score',
            }}
          />
          <Leaderboard
            players={leaderboardPlayers.map((player): LeaderboardPlayer => ({
              id: player.id,
              name: player.name,
              score: player.score,
              wins: getPlayerWins(player.id),
              isWinner: player.id === displayGame.winner,
              isEliminated: player.isEliminated,
            }))}
            showRanks={sortByScore}
            showWins={true}
            winnerId={displayGame.winner || undefined}
          />
        </View>

        {/* Round History */}
        {displayGame.rounds.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="ROUND HISTORY" badge={displayGame.rounds.length} />

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
            <PrimaryButton
              label="Back to Home"
              icon="house.fill"
              onPress={() => navigation.navigate('Home')}
            />
          ) : !winner ? (
            <PrimaryButton
              label="Continue Game"
              icon="play.fill"
              onPress={() => navigation.goBack()}
            />
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

  // Section Styles
  section: {
    marginBottom: Spacing.lg,
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

  // Round History
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
});

export default HistoryScreen;
