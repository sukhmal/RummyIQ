import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useGame } from '../context/GameContext';

const screenWidth = Dimensions.get('window').width;

const HistoryScreen = ({ navigation, route }: any) => {
  const { currentGame, gameHistory, resetGame } = useGame();

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

  const handleNewGame = () => {
    Alert.alert(
      'Start New Game',
      'This will clear the current game. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            resetGame();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const getPlayerWins = (playerId: string) => {
    return displayGame.rounds.filter(r => r.winner === playerId).length;
  };

  const sortedPlayers = [...displayGame.players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return a.score - b.score;
  });

  const winner = displayGame.winner
    ? displayGame.players.find(p => p.id === displayGame.winner)
    : null;

  // Calculate cumulative scores for the chart
  const getChartData = () => {
    if (displayGame.rounds.length === 0) return null;

    const playerColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#FF5722', '#3F51B5'];

    const datasets = displayGame.players.map((player, index) => {
      let cumulative = 0;
      const data = [0]; // Start at 0
      displayGame.rounds.forEach(round => {
        cumulative += round.scores[player.id] || 0;
        data.push(cumulative);
      });
      return {
        data,
        color: () => playerColors[index % playerColors.length],
        strokeWidth: 2,
      };
    });

    const labels = ['0', ...displayGame.rounds.map((_, i) => `${i + 1}`)];

    return {
      labels,
      datasets,
      legend: displayGame.players.map(p => p.name),
    };
  };

  const chartData = getChartData();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scoreboard</Text>

        {winner && (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerTitle}>Winner!</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
          </View>
        )}

        <View style={styles.gameInfo}>
          {displayGame.name && (
            <Text style={styles.gameNameText}>{displayGame.name}</Text>
          )}
          <Text style={styles.gameInfoText}>
            {displayGame.config.variant === 'pool'
              ? `Pool ${displayGame.config.poolLimit}`
              : displayGame.config.variant === 'deals'
              ? `Deals Rummy (${displayGame.config.numberOfDeals} deals)`
              : 'Points Rummy'}
          </Text>
          <Text style={styles.gameInfoText}>Rounds played: {displayGame.rounds.length}</Text>
        </View>

        {chartData && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Score Progression</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={chartData}
                width={Math.max(screenWidth - 40, displayGame.rounds.length * 50 + 80)}
                height={220}
                chartConfig={{
                  backgroundColor: '#16213e',
                  backgroundGradientFrom: '#16213e',
                  backgroundGradientTo: '#16213e',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
                  style: {
                    borderRadius: 12,
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
              {displayGame.players.map((player, index) => {
                const playerColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#FF5722', '#3F51B5'];
                return (
                  <View key={player.id} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: playerColors[index % playerColors.length] }]} />
                    <Text style={styles.legendText}>{player.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.leaderboard}>
          <View style={styles.leaderboardHeader}>
            <Text style={[styles.headerText, styles.rankColumn]}>Rank</Text>
            <Text style={[styles.headerText, styles.nameColumn]}>Player</Text>
            <Text style={[styles.headerText, styles.scoreColumn]}>Score</Text>
            <Text style={[styles.headerText, styles.winsColumn]}>Wins</Text>
          </View>

          {sortedPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerRow,
                player.isEliminated && styles.eliminatedRow,
              ]}>
              <Text style={[styles.rankText, styles.rankColumn]}>
                {index + 1}
              </Text>
              <Text
                style={[
                  styles.playerName,
                  styles.nameColumn,
                  player.isEliminated && styles.eliminatedText,
                ]}>
                {player.name}
                {player.isEliminated && ' (Out)'}
              </Text>
              <Text
                style={[
                  styles.scoreText,
                  styles.scoreColumn,
                  player.isEliminated && styles.eliminatedText,
                ]}>
                {player.score}
              </Text>
              <Text style={[styles.winsText, styles.winsColumn]}>
                {getPlayerWins(player.id)}
              </Text>
            </View>
          ))}
        </View>

        {displayGame.rounds.length > 0 && (
          <View style={styles.roundsSection}>
            <Text style={styles.sectionTitle}>Round History</Text>
            {[...displayGame.rounds].reverse().map((round, index) => {
              const roundNumber = displayGame.rounds.length - index;
              const roundWinner = round.winner
                ? displayGame.players.find(p => p.id === round.winner)
                : null;

              return (
                <View key={round.id} style={styles.roundCard}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundTitle}>Round {roundNumber}</Text>
                    {roundWinner && (
                      <Text style={styles.roundWinner}>
                        Winner: {roundWinner.name}
                      </Text>
                    )}
                  </View>
                  <View style={styles.roundScores}>
                    {displayGame.players.map(player => {
                      const score = round.scores[player.id] || 0;
                      return (
                        <View key={player.id} style={styles.roundScoreRow}>
                          <Text style={styles.roundPlayerName}>
                            {player.name}
                          </Text>
                          <Text style={styles.roundPlayerScore}>
                            {score > 0 ? `+${score}` : score}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {viewingHistoricalGame ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!winner && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => navigation.navigate('Game')}>
                <Text style={styles.continueButtonText}>Continue Game</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
              <Text style={styles.newGameButtonText}>New Game</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#eee',
    textAlign: 'center',
    marginBottom: 20,
  },
  winnerBanner: {
    backgroundColor: '#16213e',
    borderWidth: 3,
    borderColor: '#ffd700',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#eee',
  },
  gameInfo: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  gameNameText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  gameInfoText: {
    color: '#aaa',
    fontSize: 14,
    marginVertical: 3,
  },
  chartSection: {
    marginBottom: 20,
  },
  chart: {
    borderRadius: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: '#aaa',
    fontSize: 12,
  },
  leaderboard: {
    marginBottom: 30,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#0f3460',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rankColumn: {
    width: 50,
    textAlign: 'center',
  },
  nameColumn: {
    flex: 2,
  },
  scoreColumn: {
    flex: 1,
    textAlign: 'center',
  },
  winsColumn: {
    flex: 1,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
    alignItems: 'center',
  },
  eliminatedRow: {
    opacity: 0.5,
  },
  rankText: {
    color: '#eee',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#eee',
    fontSize: 16,
    fontWeight: '500',
  },
  scoreText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winsText: {
    color: '#0f3460',
    fontSize: 16,
    fontWeight: '600',
  },
  eliminatedText: {
    textDecorationLine: 'line-through',
  },
  roundsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 15,
  },
  roundCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  roundTitle: {
    color: '#eee',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roundWinner: {
    color: '#0f3460',
    fontSize: 14,
    fontWeight: '600',
  },
  roundScores: {
    gap: 5,
  },
  roundScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  roundPlayerName: {
    color: '#aaa',
    fontSize: 14,
  },
  roundPlayerScore: {
    color: '#eee',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '600',
  },
  newGameButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f3460',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  newGameButtonText: {
    color: '#0f3460',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HistoryScreen;
