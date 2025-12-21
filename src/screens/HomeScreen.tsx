import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { Game } from '../types/game';

const HomeScreen = ({ navigation }: any) => {
  const { currentGame, gameHistory, loadGame } = useGame();

  useEffect(() => {
    loadGame();
  }, []);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameSummary = (game: Game) => {
    const winnerPlayer = game.players.find(p => p.id === game.winner);
    const variant = game.config.variant === 'pool'
      ? `Pool ${game.config.poolLimit}`
      : game.config.variant === 'deals'
      ? `Deals ${game.config.numberOfDeals}`
      : 'Points';
    return {
      winner: winnerPlayer?.name || 'Unknown',
      variant,
      players: game.players.length,
      rounds: game.rounds.length,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Rummy Scorer</Text>
        <Text style={styles.subtitle}>Track your game scores</Text>

        {currentGame && !currentGame.winner ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Game')}>
            <Text style={styles.buttonText}>Continue Game</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('GameSetup')}>
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>

        {gameHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Past Games</Text>
            {gameHistory.map(game => {
              const summary = getGameSummary(game);
              return (
                <TouchableOpacity
                  key={game.id}
                  style={styles.historyCard}
                  onPress={() => navigation.navigate('History', { gameId: game.id })}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyVariant}>
                      {game.name || summary.variant}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(game.completedAt || game.startedAt)}
                    </Text>
                  </View>
                  {game.name && (
                    <Text style={styles.historyVariantSmall}>{summary.variant}</Text>
                  )}
                  <Text style={styles.historyWinner}>Winner: {summary.winner}</Text>
                  <Text style={styles.historyDetails}>
                    {summary.players} players • {summary.rounds} rounds
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 60,
  },
  button: {
    width: '80%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  buttonText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#0f3460',
    fontSize: 18,
    fontWeight: '600',
  },
  historySection: {
    width: '100%',
    marginTop: 40,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 15,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyVariant: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    color: '#888',
    fontSize: 12,
  },
  historyWinner: {
    color: '#eee',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDetails: {
    color: '#aaa',
    fontSize: 12,
  },
  historyVariantSmall: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default HomeScreen;
