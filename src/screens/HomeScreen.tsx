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
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';

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
      {/* Header */}
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Icon name="suit.spade.fill" size={48} color={colors.accent} weight="medium" />
          </View>
          <Text style={styles.title}>RummyIQ</Text>
          <Text style={styles.subtitle}>Where Skill Wins</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsSection}>
          {currentGame && !currentGame.winner && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Game')}
              accessibilityLabel="Continue current game"
              accessibilityRole="button">
              <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '20' }]}>
                <Icon name="play.fill" size={IconSize.large} color={colors.success} weight="medium" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Continue Game</Text>
                <Text style={styles.actionSubtitle}>
                  Round {currentGame.rounds.length + 1} • {currentGame.players.filter(p => !p.isEliminated).length} players
                </Text>
              </View>
              <Icon name="chevron.right" size={IconSize.medium} color={colors.tertiaryLabel} weight="semibold" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('GameSetup')}
            accessibilityLabel="Start a new game"
            accessibilityRole="button">
            <View style={[styles.actionIconContainer, { backgroundColor: colors.tint + '20' }]}>
              <Icon name="plus" size={IconSize.large} color={colors.tint} weight="bold" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>New Game</Text>
              <Text style={styles.actionSubtitle}>Pool, Points, or Deals</Text>
            </View>
            <Icon name="chevron.right" size={IconSize.medium} color={colors.tertiaryLabel} weight="semibold" />
          </TouchableOpacity>
        </View>

        {/* Past Games Section */}
        {gameHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>RECENT GAMES</Text>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{gameHistory.length}</Text>
              </View>
            </View>

            <View style={styles.historyList}>
              {gameHistory.map((game, index) => {
                const summary = getGameSummary(game);
                const isLast = index === gameHistory.length - 1;
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[styles.historyItem, !isLast && styles.historyItemBorder]}
                    onPress={() => navigation.navigate('History', { gameId: game.id })}
                    accessibilityLabel={`View ${game.name || summary.variant} game`}
                    accessibilityRole="button">
                    <View style={styles.historyItemLeft}>
                      <View style={styles.historyIconContainer}>
                        <Icon name="trophy.fill" size={IconSize.medium} color={colors.gold} weight="medium" />
                      </View>
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle} numberOfLines={1}>
                          {game.name || summary.variant}
                        </Text>
                        <Text style={styles.historyItemSubtitle}>
                          {summary.winner} won • {summary.rounds} rounds
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyDate}>{formatDate(game.completedAt || game.startedAt)}</Text>
                      <Icon name="chevron.right" size={IconSize.small} color={colors.tertiaryLabel} weight="semibold" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {gameHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="gamecontroller.fill" size={40} color={colors.tertiaryLabel} weight="medium" />
            <Text style={styles.emptyStateText}>No games played yet</Text>
            <Text style={styles.emptyStateSubtext}>Start a new game to begin tracking!</Text>
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
    padding: Spacing.lg,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  title: {
    ...Typography.largeTitle,
    color: colors.label,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.subheadline,
    color: colors.secondaryLabel,
  },

  // Action Cards
  actionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.headline,
    color: colors.label,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
  },

  // History Section
  historySection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryLabel,
    letterSpacing: 0.5,
  },
  historyBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.label,
  },
  historyList: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.label,
    marginBottom: 2,
  },
  historyItemSubtitle: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyDate: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.headline,
    color: colors.secondaryLabel,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
    marginTop: Spacing.xs,
  },
});

export default HomeScreen;
