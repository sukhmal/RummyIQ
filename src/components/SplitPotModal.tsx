import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getCurrencySymbol } from '../context/SettingsContext';
import { Player, SplitPotShare } from '../types/game';
import { ThemeColors, Typography, Spacing, IconSize, BorderRadius } from '../theme';

interface SplitPotModalProps {
  visible: boolean;
  totalPot: number;
  poolLimit: number;
  activePlayers: Player[];
  onConfirm: (shares: SplitPotShare[]) => void;
  onCancel: () => void;
}

const SplitPotModal: React.FC<SplitPotModalProps> = ({
  visible,
  totalPot,
  poolLimit,
  activePlayers,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { defaults } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currencySymbol = getCurrencySymbol(defaults.currency);

  const [shares, setShares] = useState<{ [playerId: string]: string }>({});
  const [selectedMode, setSelectedMode] = useState<'proportional' | 'equal' | 'custom'>('proportional');
  const [customInputMode, setCustomInputMode] = useState<'amount' | 'percent'>('amount');
  const [percentages, setPercentages] = useState<{ [playerId: string]: string }>({});

  // Calculate proportional split based on drops available (poolLimit - score)
  // This is intuitive: your share is proportional to your remaining room in the pool
  const calculateProportionalSplit = useCallback((limit: number): { [playerId: string]: number } => {
    if (activePlayers.length === 0) return {};

    const dropsAvailable = activePlayers.map(p => ({
      id: p.id,
      score: p.score,
      drops: limit - p.score,
    }));

    const totalDrops = dropsAvailable.reduce((sum, p) => sum + p.drops, 0);

    const result: { [playerId: string]: number } = {};
    let allocated = 0;

    // Find player with lowest score (they get the remainder)
    const lowestScorePlayer = dropsAvailable.reduce((min, p) =>
      p.score < min.score ? p : min
    );

    // Calculate shares, giving remainder to player with lowest score
    dropsAvailable.forEach((p) => {
      if (p.id === lowestScorePlayer.id) {
        // Skip for now, will calculate after others
      } else {
        const share = Math.floor((p.drops / totalDrops) * totalPot);
        result[p.id] = share;
        allocated += share;
      }
    });

    // Give remainder to player with lowest score
    result[lowestScorePlayer.id] = totalPot - allocated;

    return result;
  }, [activePlayers, totalPot]);

  // Initialize shares when modal opens
  useEffect(() => {
    if (visible) {
      const proportionalShares = calculateProportionalSplit(poolLimit);
      const initialShares: { [playerId: string]: string } = {};
      activePlayers.forEach(p => {
        initialShares[p.id] = (proportionalShares[p.id] || 0).toString();
      });
      setShares(initialShares);
    }
  }, [visible, activePlayers, totalPot, poolLimit, calculateProportionalSplit]);

  const updateShare = (playerId: string, value: string) => {
    setShares(prev => ({
      ...prev,
      [playerId]: value,
    }));
  };

  const getCurrentTotal = (): number => {
    return Object.values(shares).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
  };

  const handleConfirm = () => {
    const shareArray: SplitPotShare[] = activePlayers.map(p => ({
      playerId: p.id,
      amount: parseInt(shares[p.id], 10) || 0,
    }));
    onConfirm(shareArray);
  };

  const resetToProportional = () => {
    const proportionalShares = calculateProportionalSplit(poolLimit);
    const newShares: { [playerId: string]: string } = {};
    activePlayers.forEach(p => {
      newShares[p.id] = (proportionalShares[p.id] || 0).toString();
    });
    setShares(newShares);
    setSelectedMode('proportional');
  };

  const clearForCustom = () => {
    const newShares: { [playerId: string]: string } = {};
    const newPercentages: { [playerId: string]: string } = {};
    activePlayers.forEach(p => {
      newShares[p.id] = '';
      newPercentages[p.id] = '';
    });
    setShares(newShares);
    setPercentages(newPercentages);
    setSelectedMode('custom');
  };

  const updatePercentage = (playerId: string, value: string) => {
    // Allow digits and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

    setPercentages(prev => ({
      ...prev,
      [playerId]: sanitized,
    }));

    // Calculate amount from percentage
    const percent = parseFloat(sanitized) || 0;
    const amount = Math.floor((percent / 100) * totalPot);
    setShares(prev => ({
      ...prev,
      [playerId]: amount.toString(),
    }));
  };

  const recalculateAmountsFromPercentages = () => {
    const newShares: { [playerId: string]: number } = {};
    let allocated = 0;

    // Find player with lowest score (they get the remainder)
    const lowestScorePlayer = activePlayers.reduce((min, p) =>
      p.score < min.score ? p : min
    );

    // Calculate shares for all except lowest scorer
    activePlayers.forEach((p) => {
      if (p.id === lowestScorePlayer.id) {
        // Skip for now, will calculate after others
      } else {
        const percent = parseFloat(percentages[p.id]) || 0;
        const amount = Math.floor((percent / 100) * totalPot);
        newShares[p.id] = amount;
        allocated += amount;
      }
    });

    // Give remainder to player with lowest score
    newShares[lowestScorePlayer.id] = totalPot - allocated;

    // Convert to string state
    const stringShares: { [playerId: string]: string } = {};
    Object.keys(newShares).forEach(id => {
      stringShares[id] = newShares[id].toString();
    });
    setShares(stringShares);
  };

  const splitEqually = () => {
    const equalShare = Math.floor(totalPot / activePlayers.length);
    const remainder = totalPot - (equalShare * activePlayers.length);
    const newShares: { [playerId: string]: string } = {};
    // Sort by score (lowest first) so best players get the extra
    const sortedByScore = [...activePlayers].sort((a, b) => a.score - b.score);
    sortedByScore.forEach((p, index) => {
      // Distribute remainder to players with lowest scores (1 extra each)
      newShares[p.id] = (equalShare + (index < remainder ? 1 : 0)).toString();
    });
    setShares(newShares);
    setSelectedMode('equal');
  };

  const currentTotal = getCurrentTotal();
  const isBalanced = currentTotal === totalPot;

  if (!visible) return null;

  // Sort players by score (lowest first - they get more)
  const sortedPlayers = [...activePlayers].sort((a, b) => a.score - b.score);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="black"
        />
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.gold + '20' }]}>
              <Icon name="chart.pie.fill" size={IconSize.medium} color={colors.gold} weight="medium" />
            </View>
            <Text style={styles.title}>Split Pot</Text>
          </View>

          {/* Total Pot */}
          <View style={styles.potRow}>
            <Text style={styles.potLabel}>Total Pot</Text>
            <Text style={styles.potValue}>{currencySymbol}{totalPot}</Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, selectedMode === 'proportional' && styles.segmentSelected]}
              onPress={resetToProportional}>
              <Text style={[styles.segmentText, selectedMode === 'proportional' && styles.segmentTextSelected]}>
                Proportional
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, selectedMode === 'equal' && styles.segmentSelected]}
              onPress={splitEqually}>
              <Text style={[styles.segmentText, selectedMode === 'equal' && styles.segmentTextSelected]}>
                Equal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, styles.segmentLast, selectedMode === 'custom' && styles.segmentSelected]}
              onPress={clearForCustom}>
              <Text style={[styles.segmentText, selectedMode === 'custom' && styles.segmentTextSelected]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Mode Toggle */}
          {selectedMode === 'custom' && (
            <View style={styles.customToggle}>
              <TouchableOpacity
                style={[styles.customToggleButton, customInputMode === 'amount' && styles.customToggleButtonSelected]}
                onPress={() => setCustomInputMode('amount')}>
                <Text style={[styles.customToggleText, customInputMode === 'amount' && styles.customToggleTextSelected]}>
                  {currencySymbol} Amount
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customToggleButton, customInputMode === 'percent' && styles.customToggleButtonSelected]}
                onPress={() => {
                  setCustomInputMode('percent');
                  // Initialize percentages from current amounts if any
                  const sharesTotal = getCurrentTotal();
                  if (sharesTotal > 0) {
                    const newPercentages: { [playerId: string]: string } = {};
                    activePlayers.forEach(p => {
                      const share = parseInt(shares[p.id], 10) || 0;
                      newPercentages[p.id] = ((share / totalPot) * 100).toFixed(1);
                    });
                    setPercentages(newPercentages);
                  }
                }}>
                <Text style={[styles.customToggleText, customInputMode === 'percent' && styles.customToggleTextSelected]}>
                  % Percent
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Player Shares */}
          <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
            {sortedPlayers.map((player, index) => (
              <View key={player.id} style={[styles.playerRow, index < sortedPlayers.length - 1 && styles.playerRowBorder]}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.playerScore}>{player.score} pts</Text>
                </View>
                {selectedMode === 'custom' && customInputMode === 'percent' ? (
                  <View style={styles.shareInputRow}>
                    <View style={styles.shareInput}>
                      <TextInput
                        style={styles.input}
                        value={percentages[player.id] || ''}
                        onChangeText={(text) => updatePercentage(player.id, text)}
                        onBlur={recalculateAmountsFromPercentages}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={colors.placeholder}
                        selectTextOnFocus
                      />
                      <Text style={styles.percentSuffix}>%</Text>
                    </View>
                    <Text style={styles.amountPreview}>
                      {currencySymbol}{shares[player.id] || '0'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.shareInput}>
                    <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                    <TextInput
                      style={styles.input}
                      value={shares[player.id] || '0'}
                      onChangeText={(text) => updateShare(player.id, text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Total Check */}
          <View style={[styles.totalRow, !isBalanced && styles.totalRowError]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, !isBalanced && styles.totalValueError]}>
              {currencySymbol}{currentTotal}
              {!isBalanced && (
                <Text style={styles.difference}>
                  {' '}({currentTotal > totalPot ? '+' : ''}{currentTotal - totalPot})
                </Text>
              )}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityLabel="Cancel"
              accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !isBalanced && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!isBalanced}
              accessibilityLabel="Confirm Split"
              accessibilityRole="button">
              <Text style={[styles.confirmText, !isBalanced && styles.confirmTextDisabled]}>
                Confirm Split
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.title3,
    fontWeight: '600',
    color: colors.label,
  },
  potRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  potLabel: {
    ...Typography.body,
    color: colors.secondaryLabel,
  },
  potValue: {
    ...Typography.title2,
    fontWeight: '700',
    color: colors.gold,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.medium,
    padding: 2,
    marginBottom: Spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  segmentLast: {
    // No additional styles needed, just for clarity
  },
  segmentSelected: {
    backgroundColor: colors.tint,
  },
  segmentText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  segmentTextSelected: {
    color: colors.label,
  },
  customToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.small,
    padding: 2,
    marginBottom: Spacing.sm,
  },
  customToggleButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.small - 2,
  },
  customToggleButtonSelected: {
    backgroundColor: colors.cardBackground,
  },
  customToggleText: {
    ...Typography.caption1,
    fontWeight: '500',
    color: colors.tertiaryLabel,
  },
  customToggleTextSelected: {
    color: colors.label,
  },
  playerList: {
    maxHeight: 200,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  playerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.label,
  },
  playerScore: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
  },
  shareInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shareInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    minWidth: 80,
  },
  currencyPrefix: {
    ...Typography.body,
    color: colors.secondaryLabel,
    marginRight: 4,
  },
  percentSuffix: {
    ...Typography.body,
    color: colors.secondaryLabel,
    marginLeft: 2,
  },
  input: {
    ...Typography.body,
    color: colors.label,
    paddingVertical: Spacing.sm,
    minWidth: 50,
    textAlign: 'right',
  },
  amountPreview: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
    minWidth: 50,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  totalRowError: {
    backgroundColor: colors.destructive + '20',
  },
  totalLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.label,
  },
  totalValue: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.success,
  },
  totalValueError: {
    color: colors.destructive,
  },
  difference: {
    ...Typography.caption1,
    fontWeight: '400',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.tint,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.separator,
  },
  confirmText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.label,
  },
  confirmTextDisabled: {
    color: colors.tertiaryLabel,
  },
});

export default SplitPotModal;
