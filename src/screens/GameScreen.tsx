import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { ScoreInput } from '../types/game';
import FireworksModal from '../components/FireworksModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import Icon from '../components/Icon';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';

// States: 0 = default (25 drop), 1 = winner (0), 2 = custom score, 3 = invalid declaration (80)
type PlayerState = 0 | 1 | 2 | 3;

const GameScreen = ({ navigation }: any) => {
  const { currentGame, addRound, canPlayersRejoin, rejoinPlayer } = useGame();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [playerStates, setPlayerStates] = useState<{ [playerId: string]: PlayerState }>({});
  const [customScores, setCustomScores] = useState<{ [playerId: string]: number }>({});
  const [showFireworks, setShowFireworks] = useState(false);
  const [gameWinnerName, setGameWinnerName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingScores, setPendingScores] = useState<ScoreInput[] | null>(null);
  const inputRefs = useRef<{ [playerId: string]: TextInput | null }>({});

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

    // Swipe left to go to scoreboard (horizontal swipe, not vertical)
    if (deltaX < -80 && Math.abs(deltaY) < 100) {
      navigation.navigate('History');
    }
  };

  if (!currentGame) {
    navigation.navigate('Home');
    return null;
  }

  const hasWinner = Object.values(playerStates).includes(1);
  const hasInvalidDeclaration = Object.values(playerStates).includes(3);
  const roundStarter = hasWinner || hasInvalidDeclaration;

  const cyclePlayerState = (playerId: string) => {
    const currentState = playerStates[playerId] || 0;
    const newStates = { ...playerStates };

    // Check if THIS player is the current winner or invalid
    const isRoundStarter = currentState === 1 || currentState === 3;

    if (isRoundStarter) {
      // Tapping the winner/invalid cycles: Winner -> Invalid -> Clear
      if (currentState === 1) {
        newStates[playerId] = 3; // Winner -> Invalid
      } else {
        newStates[playerId] = 0; // Invalid -> Clear
      }
    } else if (!roundStarter) {
      // No winner/invalid yet - first tap sets winner
      newStates[playerId] = 1;
    } else {
      // Cycle losers: 0 (drop 25) -> 2 (custom) -> 0
      const loserCycle: PlayerState[] = [0, 2];
      const currentIndex = loserCycle.indexOf(currentState);
      const nextIndex = (currentIndex + 1) % loserCycle.length;
      newStates[playerId] = loserCycle[nextIndex];

      // Focus the input when entering custom state
      if (loserCycle[nextIndex] === 2) {
        setTimeout(() => {
          inputRefs.current[playerId]?.focus();
        }, 100);
      }
    }

    setPlayerStates(newStates);
  };

  const updateCustomScore = (playerId: string, points: string) => {
    // Only allow digits, limit to 2 characters
    const digitsOnly = points.replace(/[^0-9]/g, '').slice(0, 2);
    // Allow empty for typing, but clamp when there's a value
    if (digitsOnly === '') {
      setCustomScores({ ...customScores, [playerId]: 0 });
      return;
    }
    const value = parseInt(digitsOnly, 10) || 0;
    // Clamp to max 80 while typing
    const clampedValue = Math.min(value, 80);
    setCustomScores({
      ...customScores,
      [playerId]: clampedValue,
    });
  };

  const enforceMinScore = (playerId: string) => {
    // Enforce minimum of 2 when user finishes typing
    const score = customScores[playerId] ?? 0;
    if (score < 2) {
      setCustomScores({ ...customScores, [playerId]: 2 });
    }
  };

  const getPlayerScore = (playerId: string): number => {
    const state = playerStates[playerId] || 0;
    switch (state) {
      case 0: return 25; // Drop
      case 1: return 0;  // Winner
      case 2: {
        // Custom score: enforce valid range 2-80
        const score = customScores[playerId] ?? 0;
        return score < 2 ? 2 : score;
      }
      case 3: return 80; // Invalid declaration
      default: return 25;
    }
  };

  const getStateLabel = (state: PlayerState): string => {
    switch (state) {
      case 0: return 'Drop';
      case 1: return 'Winner';
      case 2: return 'Custom';
      case 3: return 'Invalid';
      default: return 'Drop';
    }
  };

  const submitRound = () => {
    // Enforce minimum scores for all custom entries before submitting
    const updatedScores = { ...customScores };
    let scoresUpdated = false;
    currentGame.players.forEach(p => {
      if (playerStates[p.id] === 2 && (customScores[p.id] ?? 0) < 2) {
        updatedScores[p.id] = 2;
        scoresUpdated = true;
      }
    });
    if (scoresUpdated) {
      setCustomScores(updatedScores);
    }

    const scores: ScoreInput[] = currentGame.players
      .filter(p => !p.isEliminated)
      .map(p => ({
        playerId: p.id,
        points: playerStates[p.id] === 2
          ? Math.max(2, updatedScores[p.id] ?? 2)
          : getPlayerScore(p.id),
        isDeclared: playerStates[p.id] === 1,
        hasInvalidDeclaration: playerStates[p.id] === 3,
      }));

    const declaredCount = scores.filter(s => s.isDeclared).length;
    const invalidDeclarationCount = scores.filter(s => s.hasInvalidDeclaration).length;

    if (declaredCount === 0 && invalidDeclarationCount === 0) {
      setErrorMessage('Please mark a winner (tap player name)');
      setShowError(true);
      return;
    }

    if (declaredCount > 1) {
      setErrorMessage('Only one player can be the winner');
      setShowError(true);
      return;
    }

    // Store scores and show confirmation
    setPendingScores(scores);
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    if (!pendingScores) return;

    // Check if this round will end the game (for pool rummy)
    // Player is eliminated when score > poolLimit (survives at exactly the limit)
    let winnerName: string | null = null;
    if (currentGame.config.variant === 'pool' && currentGame.config.poolLimit) {
      const playersAfterRound = currentGame.players
        .filter(p => !p.isEliminated)
        .map(p => ({
          ...p,
          newScore: p.score + getPlayerScore(p.id),
        }))
        .filter(p => p.newScore <= currentGame.config.poolLimit!);

      if (playersAfterRound.length === 1) {
        winnerName = playersAfterRound[0].name;
      }
    }

    addRound(pendingScores);
    setPlayerStates({});
    setCustomScores({});
    setPendingScores(null);
    setShowConfirmation(false);

    if (winnerName || currentGame.winner) {
      const winner = winnerName || currentGame.players.find(p => p.id === currentGame.winner)?.name;
      setGameWinnerName(winner || 'Unknown');
      setShowFireworks(true);
    }
  };

  const handleFireworksClose = () => {
    setShowFireworks(false);
    navigation.navigate('History');
  };

  const activePlayers = currentGame.players.filter(p => !p.isEliminated);
  const eliminatedPlayers = currentGame.players.filter(p => p.isEliminated);
  const rejoinEnabled = canPlayersRejoin();

  const getGameTypeLabel = () => {
    if (currentGame.config.variant === 'pool') {
      return `Pool ${currentGame.config.poolLimit}`;
    } else if (currentGame.config.variant === 'deals') {
      return `Deal ${currentGame.currentDeal}/${currentGame.config.numberOfDeals}`;
    }
    return 'Points';
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        style={styles.container}
        edges={['bottom']}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

          {/* Game Info Header */}
          <View style={styles.headerSection}>
            <View style={styles.gameInfoRow}>
              {currentGame.name && (
                <View style={styles.infoBadge}>
                  <Icon name="tag.fill" size={IconSize.small} color={colors.accent} weight="medium" />
                  <Text style={styles.infoBadgeText}>{currentGame.name}</Text>
                </View>
              )}
              <View style={styles.infoBadge}>
                <Icon
                  name={currentGame.config.variant === 'pool' ? 'person.3.fill' : currentGame.config.variant === 'deals' ? 'square.stack.fill' : 'star.fill'}
                  size={IconSize.small}
                  color={colors.accent}
                  weight="medium"
                />
                <Text style={styles.infoBadgeText}>{getGameTypeLabel()}</Text>
              </View>
              <View style={styles.infoBadge}>
                <Icon name="arrow.trianglehead.2.clockwise.rotate.90" size={IconSize.small} color={colors.accent} weight="medium" />
                <Text style={styles.infoBadgeText}>Round {currentGame.rounds.length + 1}</Text>
              </View>
            </View>
          </View>

          {/* Rejoin Opportunity Banner */}
          {rejoinEnabled && eliminatedPlayers.length > 0 && (
            <View style={styles.rejoinBanner}>
              <View style={styles.rejoinBannerIcon}>
                <Icon name="person.badge.plus" size={IconSize.large} color={colors.success} weight="medium" />
              </View>
              <View style={styles.rejoinBannerContent}>
                <Text style={styles.rejoinBannerTitle}>Rejoin Available!</Text>
                <Text style={styles.rejoinBannerText}>
                  {eliminatedPlayers.length === 1
                    ? `${eliminatedPlayers[0].name} can rejoin the game`
                    : `${eliminatedPlayers.length} players can rejoin the game`}
                </Text>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Icon name="hand.tap.fill" size={IconSize.medium} color={colors.secondaryLabel} weight="medium" />
            <Text style={styles.instructionText}>
              {roundStarter
                ? 'Tap player to cycle: Drop → Custom'
                : 'Tap player to select winner'}
            </Text>
          </View>

          {/* Score Table */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PLAYERS</Text>
            <View style={styles.card}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
                <Text style={[styles.headerCell, styles.statusColumn]}>Status</Text>
                <Text style={[styles.headerCell, styles.totalColumn]}>Total</Text>
                <Text style={[styles.headerCell, styles.ptsColumn]}>Pts</Text>
              </View>

              {/* Player Rows */}
              {activePlayers.map((player, index) => {
                const state = playerStates[player.id] || 0;
                const isLast = index === activePlayers.length - 1;
                const isWinner = state === 1;
                const isInvalid = state === 3;
                const isDealer = currentGame.dealerId === player.id;

                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.playerRow,
                      !isLast && styles.playerRowBorder,
                      isWinner && styles.playerRowWinner,
                      isInvalid && styles.playerRowInvalid,
                    ]}
                    onPress={() => cyclePlayerState(player.id)}
                    accessibilityLabel={`${player.name}${isDealer ? ', dealer' : ''}, ${getStateLabel(state)}, total ${player.score}`}
                    accessibilityRole="button">
                    {/* Player Name */}
                    <View style={styles.nameColumn}>
                      <View style={styles.nameWithDealer}>
                        <Text
                          style={[
                            styles.playerName,
                            isWinner && styles.playerNameWinner,
                            isInvalid && styles.playerNameInvalid,
                          ]}
                          numberOfLines={1}>
                          {player.name}
                        </Text>
                        {isDealer && (
                          <View style={styles.dealerBadge}>
                            <Text style={styles.dealerBadgeText}>D</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.statusColumn}>
                      <View style={[
                        styles.statusBadge,
                        isWinner && styles.statusBadgeWinner,
                        isInvalid && styles.statusBadgeInvalid,
                      ]}>
                        {isWinner && (
                          <Icon name="checkmark" size={12} color={colors.success} weight="bold" />
                        )}
                        {isInvalid && (
                          <Icon name="xmark" size={12} color={colors.destructive} weight="bold" />
                        )}
                        <Text style={[
                          styles.statusText,
                          isWinner && styles.statusTextWinner,
                          isInvalid && styles.statusTextInvalid,
                        ]}>
                          {getStateLabel(state)}
                        </Text>
                      </View>
                    </View>

                    {/* Total Score */}
                    <View style={styles.totalColumn}>
                      <Text style={styles.totalScore}>{player.score}</Text>
                    </View>

                    {/* Points Input/Display */}
                    <View style={styles.ptsColumn}>
                      {state === 2 ? (
                        <TextInput
                          ref={ref => { inputRefs.current[player.id] = ref; }}
                          style={styles.scoreInput}
                          value={customScores[player.id]?.toString() || ''}
                          onChangeText={text => updateCustomScore(player.id, text)}
                          onBlur={() => enforceMinScore(player.id)}
                          keyboardType="numeric"
                          placeholder="2"
                          placeholderTextColor={colors.placeholder}
                        />
                      ) : (
                        <Text style={[
                          styles.pointsDisplay,
                          isWinner && styles.pointsDisplayWinner,
                        ]}>
                          {getPlayerScore(player.id)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Eliminated Players Section */}
          {eliminatedPlayers.length > 0 && currentGame.config.variant === 'pool' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ELIMINATED PLAYERS</Text>
              <View style={styles.card}>
                {eliminatedPlayers.map((player, index) => {
                  const isLast = index === eliminatedPlayers.length - 1;
                  return (
                    <View
                      key={player.id}
                      style={[
                        styles.eliminatedRow,
                        !isLast && styles.playerRowBorder,
                      ]}>
                      <View style={styles.eliminatedInfo}>
                        <Text style={styles.eliminatedName}>{player.name}</Text>
                        <Text style={styles.eliminatedScore}>Score: {player.score}</Text>
                        {player.rejoinCount && player.rejoinCount > 0 && (
                          <Text style={styles.rejoinCount}>Rejoined: {player.rejoinCount}x</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.rejoinButton,
                          !rejoinEnabled && styles.rejoinButtonDisabled,
                        ]}
                        onPress={() => rejoinPlayer(player.id)}
                        disabled={!rejoinEnabled}
                        accessibilityLabel={`Rejoin ${player.name}`}
                        accessibilityRole="button">
                        <Icon
                          name="person.badge.plus"
                          size={IconSize.small}
                          color={rejoinEnabled ? colors.tint : colors.tertiaryLabel}
                          weight="medium"
                        />
                        <Text style={[
                          styles.rejoinButtonText,
                          !rejoinEnabled && styles.rejoinButtonTextDisabled,
                        ]}>
                          Rejoin
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {!rejoinEnabled && eliminatedPlayers.length > 0 && (
                  <View style={styles.rejoinHint}>
                    <Icon name="exclamationmark.triangle.fill" size={IconSize.small} color={colors.warning} weight="medium" />
                    <Text style={styles.rejoinHintText}>
                      Cannot rejoin while a player is in compulsory play
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitRound}
              accessibilityLabel="Submit round"
              accessibilityRole="button">
              <Icon name="checkmark.circle.fill" size={IconSize.medium} color={colors.label} weight="medium" />
              <Text style={styles.submitButtonText}>Submit Round</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <FireworksModal
          visible={showFireworks}
          winnerName={gameWinnerName}
          onClose={handleFireworksClose}
        />

        <ConfirmationDialog
          visible={showConfirmation}
          title="Submit Round"
          message="Are you sure you want to submit this round? Scores will be added to player totals."
          type="info"
          confirmText="Submit"
          cancelText="Cancel"
          onConfirm={confirmSubmit}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingScores(null);
          }}
        />

        <ConfirmationDialog
          visible={showError}
          title="Error"
          message={errorMessage}
          type="error"
          confirmText="OK"
          cancelText="Dismiss"
          onConfirm={() => setShowError(false)}
          onCancel={() => setShowError(false)}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header Section
  headerSection: {
    marginBottom: Spacing.md,
  },
  gameInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Rejoin Banner
  rejoinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '40',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  rejoinBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejoinBannerContent: {
    flex: 1,
  },
  rejoinBannerTitle: {
    ...Typography.headline,
    color: colors.success,
    marginBottom: 2,
  },
  rejoinBannerText: {
    ...Typography.footnote,
    color: colors.success,
  },

  // Instruction Card
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  instructionText: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
    flex: 1,
  },

  // Section Styles
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
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
  nameColumn: {
    flex: 2,
  },
  statusColumn: {
    flex: 1.5,
    alignItems: 'center',
  },
  totalColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  ptsColumn: {
    flex: 0.8,
    alignItems: 'center',
  },

  // Player Row
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TapTargets.comfortable,
  },
  playerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  playerRowWinner: {
    backgroundColor: colors.winnerBackground,
  },
  playerRowInvalid: {
    backgroundColor: colors.invalidBackground,
  },

  // Player Name
  nameWithDealer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerName: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.label,
    flexShrink: 1,
  },
  playerNameWinner: {
    color: colors.success,
    fontWeight: '600',
  },
  playerNameInvalid: {
    color: colors.destructive,
    fontWeight: '600',
  },
  dealerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.label,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  statusBadgeWinner: {
    backgroundColor: colors.success + '20',
  },
  statusBadgeInvalid: {
    backgroundColor: colors.destructive + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  statusTextWinner: {
    color: colors.success,
  },
  statusTextInvalid: {
    color: colors.destructive,
  },

  // Scores
  totalScore: {
    ...Typography.headline,
    color: colors.label,
  },
  pointsDisplay: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  pointsDisplayWinner: {
    color: colors.success,
  },
  scoreInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.tint,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    width: 48,
    color: colors.label,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Eliminated Players Section
  eliminatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TapTargets.comfortable,
  },
  eliminatedInfo: {
    flex: 1,
  },
  eliminatedName: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.tertiaryLabel,
  },
  eliminatedScore: {
    ...Typography.footnote,
    color: colors.tertiaryLabel,
  },
  rejoinCount: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
    fontStyle: 'italic',
  },
  rejoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    gap: Spacing.xs,
  },
  rejoinButtonDisabled: {
    backgroundColor: colors.separator,
  },
  rejoinButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.tint,
  },
  rejoinButtonTextDisabled: {
    color: colors.tertiaryLabel,
  },
  rejoinHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  rejoinHintText: {
    ...Typography.caption1,
    color: colors.warning,
    flex: 1,
  },

  // Action Section
  actionSection: {
    gap: Spacing.sm,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    minHeight: TapTargets.comfortable,
  },
  submitButtonText: {
    ...Typography.headline,
    color: colors.label,
  },
});

export default GameScreen;
