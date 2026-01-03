import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from './Icon';
import ConfirmationDialog from './ConfirmationDialog';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';
import { Round, Player, ScoreInput } from '../types/game';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.75;

type PlayerState = 0 | 1 | 2 | 3; // 0=drop(25), 1=winner(0), 2=custom, 3=invalid(80)

interface EditRoundModalProps {
  visible: boolean;
  round: Round | null;
  roundNumber: number;
  players: Player[];
  onClose: () => void;
}

const EditRoundModal: React.FC<EditRoundModalProps> = ({
  visible,
  round,
  roundNumber,
  players,
  onClose,
}) => {
  const { colors } = useTheme();
  const { updateRound, currentGame } = useGame();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [playerStates, setPlayerStates] = useState<{ [playerId: string]: PlayerState }>({});
  const [customScores, setCustomScores] = useState<{ [playerId: string]: number }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [changePreview, setChangePreview] = useState<string>('');
  const inputRefs = useRef<{ [playerId: string]: TextInput | null }>({});

  // Initialize states from round data
  useEffect(() => {
    if (round && visible) {
      const states: { [playerId: string]: PlayerState } = {};
      const scores: { [playerId: string]: number } = {};

      players.forEach(player => {
        const score = round.scores[player.id] || 0;
        const isWinner = player.id === round.winner;

        if (isWinner) {
          states[player.id] = 1; // Winner
        } else if (score === 80) {
          states[player.id] = 3; // Invalid
        } else if (score === 25) {
          states[player.id] = 0; // Drop
        } else {
          states[player.id] = 2; // Custom
          scores[player.id] = score;
        }
      });

      setPlayerStates(states);
      setCustomScores(scores);
    }
  }, [round, players, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(MODAL_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const hasWinner = Object.values(playerStates).includes(1);
  const hasInvalidDeclaration = Object.values(playerStates).includes(3);
  const roundStarter = hasWinner || hasInvalidDeclaration;

  const cyclePlayerState = (playerId: string) => {
    const currentState = playerStates[playerId] || 0;
    const newStates = { ...playerStates };

    const isRoundStarter = currentState === 1 || currentState === 3;

    if (isRoundStarter) {
      if (currentState === 1) {
        newStates[playerId] = 3;
      } else {
        newStates[playerId] = 0;
      }
    } else if (!roundStarter) {
      newStates[playerId] = 1;
    } else {
      const loserCycle: PlayerState[] = [0, 2];
      const currentIndex = loserCycle.indexOf(currentState);
      const nextIndex = (currentIndex + 1) % loserCycle.length;
      newStates[playerId] = loserCycle[nextIndex];

      if (loserCycle[nextIndex] === 2) {
        setTimeout(() => {
          inputRefs.current[playerId]?.focus();
        }, 100);
      }
    }

    setPlayerStates(newStates);
  };

  const updateCustomScore = (playerId: string, points: string) => {
    const digitsOnly = points.replace(/[^0-9]/g, '').slice(0, 2);
    if (digitsOnly === '') {
      setCustomScores({ ...customScores, [playerId]: 0 });
      return;
    }
    const value = parseInt(digitsOnly, 10) || 0;
    const clampedValue = Math.min(value, 80);
    setCustomScores({
      ...customScores,
      [playerId]: clampedValue,
    });
  };

  const enforceMinScore = (playerId: string) => {
    const score = customScores[playerId] ?? 0;
    if (score < 2) {
      setCustomScores({ ...customScores, [playerId]: 2 });
    }
  };

  const getPlayerScore = (playerId: string): number => {
    const state = playerStates[playerId] || 0;
    switch (state) {
      case 0: return 25;
      case 1: return 0;
      case 2: {
        const score = customScores[playerId] ?? 0;
        return score < 2 ? 2 : score;
      }
      case 3: return 80;
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

  const [validationError, setValidationError] = useState<string | null>(null);

  const calculateChangePreview = (): string => {
    if (!round || !currentGame) return '';

    const changes: string[] = [];
    const roundIndex = currentGame.rounds.findIndex(r => r.id === round.id);
    if (roundIndex === -1) return '';

    // Calculate new round scores
    const newRoundScores: { [playerId: string]: number } = {};
    players.forEach(player => {
      const state = playerStates[player.id] || 0;
      let score: number;
      switch (state) {
        case 0: score = 25; break;
        case 1: score = 0; break;
        case 2: score = Math.max(2, customScores[player.id] ?? 2); break;
        case 3: score = 80; break;
        default: score = 25;
      }
      newRoundScores[player.id] = score;
    });

    // Check for round score changes
    players.forEach(player => {
      const oldScore = round.scores[player.id] || 0;
      const newScore = newRoundScores[player.id];
      if (oldScore !== newScore) {
        const diff = newScore - oldScore;
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        changes.push(`${player.name}: ${oldScore} → ${newScore} (${diffStr})`);
      }
    });

    // Simulate total scores after edit
    if (currentGame.config.variant === 'pool' && currentGame.config.poolLimit) {
      const poolLimit = currentGame.config.poolLimit;

      // Replay all rounds with the edited one
      const simulatedTotals: { [playerId: string]: number } = {};
      players.forEach(p => { simulatedTotals[p.id] = 0; });

      currentGame.rounds.forEach((r, idx) => {
        const scores = idx === roundIndex ? newRoundScores : r.scores;
        players.forEach(player => {
          simulatedTotals[player.id] += scores[player.id] || 0;
        });
      });

      // Check for elimination changes
      players.forEach(player => {
        const currentTotal = player.score;
        const newTotal = simulatedTotals[player.id];
        const wasEliminated = currentTotal > poolLimit;
        const willBeEliminated = newTotal > poolLimit;

        if (!wasEliminated && willBeEliminated) {
          changes.push(`⚠️ ${player.name} will be eliminated (${newTotal} pts)`);
        } else if (wasEliminated && !willBeEliminated) {
          changes.push(`✓ ${player.name} will be restored (${newTotal} pts)`);
        }
      });
    }

    if (changes.length === 0) {
      return 'No changes detected.';
    }

    return changes.join('\n');
  };

  const handleSave = () => {
    const declaredCount = Object.values(playerStates).filter(s => s === 1).length;
    const invalidCount = Object.values(playerStates).filter(s => s === 3).length;

    if (declaredCount === 0 && invalidCount === 0) {
      setValidationError('Please mark a winner (tap player name)');
      return;
    }

    if (declaredCount > 1) {
      setValidationError('Only one player can be the winner');
      return;
    }

    setValidationError(null);
    setChangePreview(calculateChangePreview());
    setShowConfirmation(true);
  };

  const confirmSave = () => {
    if (!round) return;

    const scores: ScoreInput[] = players.map(player => ({
      playerId: player.id,
      points: playerStates[player.id] === 2
        ? Math.max(2, customScores[player.id] ?? 2)
        : getPlayerScore(player.id),
      isDeclared: playerStates[player.id] === 1,
      hasInvalidDeclaration: playerStates[player.id] === 3,
    }));

    updateRound(round.id, scores);
    setShowConfirmation(false);
    handleClose();
  };

  if (!round) return null;

  return (
    <Modal visible={visible} transparent animationType="none" supportedOrientations={['portrait', 'landscape']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none">
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="black"
            />
          </Animated.View>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>

          {/* Modal Content */}
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] },
            ]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Round {roundNumber}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

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
              <View style={styles.card}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.headerCell, styles.statusColumn]}>Status</Text>
                  <Text style={[styles.headerCell, styles.ptsColumn]}>Pts</Text>
                </View>

                {/* Player Rows */}
                {players.map((player, index) => {
                  const state = playerStates[player.id] || 0;
                  const isLast = index === players.length - 1;
                  const isWinner = state === 1;
                  const isInvalid = state === 3;

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
                      accessibilityLabel={`${player.name}, ${getStateLabel(state)}`}
                      accessibilityRole="button">
                      {/* Player Name */}
                      <View style={styles.nameColumn}>
                        <Text
                          style={[
                            styles.playerName,
                            isWinner && styles.playerNameWinner,
                            isInvalid && styles.playerNameInvalid,
                          ]}
                          numberOfLines={1}>
                          {player.name}
                        </Text>
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

              {/* Validation Error */}
              {validationError && (
                <View style={styles.errorCard}>
                  <Icon name="exclamationmark.triangle.fill" size={IconSize.medium} color={colors.destructive} weight="medium" />
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>

          <ConfirmationDialog
            visible={showConfirmation}
            title="Confirm Changes"
            message={changePreview || 'No changes to save.'}
            type="warning"
            confirmText="Save Changes"
            cancelText="Cancel"
            onConfirm={confirmSave}
            onCancel={() => setShowConfirmation(false)}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: MODAL_HEIGHT,
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.tertiaryLabel,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    ...Typography.headline,
    color: colors.label,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: colors.tint,
  },
  saveButton: {
    padding: Spacing.sm,
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.tint,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
  playerName: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.label,
  },
  playerNameWinner: {
    color: colors.success,
    fontWeight: '600',
  },
  playerNameInvalid: {
    color: colors.destructive,
    fontWeight: '600',
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

  // Error Card
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.destructive + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.footnote,
    color: colors.destructive,
    flex: 1,
  },
});

export default EditRoundModal;
