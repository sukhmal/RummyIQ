import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { Game } from '../types/game';
import Icon from '../components/Icon';
import SettingsModal from '../components/SettingsModal';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize } from '../theme';

const HomeScreen = ({ navigation }: any) => {
  const { currentGame, gameHistory, loadGame } = useGame();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

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
      {/* Header with Settings */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          accessibilityLabel="Open settings"
          accessibilityRole="button">
          <Icon name="gearshape.fill" size={IconSize.large} color={colors.secondaryLabel} weight="medium" />
        </TouchableOpacity>
      </View>

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
            <View style={styles.historyTitleRow}>
              <Icon name="clock.arrow.circlepath" size={IconSize.medium} color={colors.secondaryLabel} weight="medium" />
              <Text style={styles.historyTitle}>Past Games</Text>
            </View>
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

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerSpacer: {
    width: TapTargets.minimum,
  },
  settingsButton: {
    width: TapTargets.minimum,
    height: TapTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    ...Typography.largeTitle,
    fontSize: 42,
    color: colors.label,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.headline,
    color: colors.secondaryLabel,
    marginBottom: Spacing.xxl,
  },
  button: {
    width: '80%',
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: Spacing.sm,
    minHeight: TapTargets.comfortable,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  buttonText: {
    color: colors.labelLight,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '600',
  },
  historySection: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  historyTitle: {
    ...Typography.title3,
    color: colors.label,
  },
  historyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  historyVariant: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    color: colors.secondaryLabel,
    fontSize: 12,
  },
  historyWinner: {
    color: colors.labelLight,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDetails: {
    color: colors.secondaryLabel,
    fontSize: 12,
  },
  historyVariantSmall: {
    color: colors.secondaryLabel,
    fontSize: 12,
    marginBottom: 4,
  },
});

export default HomeScreen;
