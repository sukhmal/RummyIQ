import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getCurrencySymbol } from '../context/SettingsContext';
import { GameVariant, GameConfig, Player, PoolType } from '../types/game';
import Icon from '../components/Icon';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';

const GAME_TYPES: { id: GameVariant; label: string }[] = [
  { id: 'pool', label: 'Pool' },
  { id: 'points', label: 'Points' },
  { id: 'deals', label: 'Deals' },
];

const POOL_LIMIT_OPTIONS = ['101', '201', '250', 'Custom'] as const;
const PRESET_POOL_LIMITS = [101, 201, 250] as const;

const GameSetupScreen = ({ navigation }: any) => {
  const { createGame, resetGame } = useGame();
  const { colors } = useTheme();
  const { defaults, getEffectiveDefaults, saveLastGameSettings } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [useDefaults, setUseDefaults] = useState<boolean>(true);
  const [gameName, setGameName] = useState<string>('');
  const [variantIndex, setVariantIndex] = useState<number>(0);
  const [poolLimitIndex, setPoolLimitIndex] = useState<number>(2); // Default to 250
  const [customPoolLimitText, setCustomPoolLimitText] = useState('');
  const [pointValue, setPointValue] = useState<number>(1);
  const [numberOfDeals, setNumberOfDeals] = useState<number>(2);
  const [dropPenalty, setDropPenalty] = useState<number>(25);
  const [joinTableAmount, setJoinTableAmount] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', score: 0 },
    { id: '2', name: '', score: 0 },
  ]);
  const [initialized, setInitialized] = useState(false);

  // Apply defaults on mount
  useEffect(() => {
    if (initialized) return;

    const effectiveDefaults = getEffectiveDefaults();

    // Set game type
    const gameTypeIndex = GAME_TYPES.findIndex(t => t.id === effectiveDefaults.gameType);
    if (gameTypeIndex >= 0) {
      setVariantIndex(gameTypeIndex);
    }

    // Set pool limit
    const poolLimit = effectiveDefaults.poolLimit;
    const presetIndex = PRESET_POOL_LIMITS.indexOf(poolLimit as 101 | 201 | 250);
    if (presetIndex >= 0) {
      setPoolLimitIndex(presetIndex);
    } else if (typeof poolLimit === 'number') {
      setPoolLimitIndex(3); // Custom
      setCustomPoolLimitText(poolLimit.toString());
    }

    // Set number of deals
    setNumberOfDeals(effectiveDefaults.numberOfDeals);

    // Set drop penalty and join table amount
    setDropPenalty(effectiveDefaults.dropPenalty);
    setJoinTableAmount(effectiveDefaults.joinTableAmount);

    // Set player count and names
    const playerCount = effectiveDefaults.playerCount;
    const playerNames = effectiveDefaults.playerNames || [];
    const initialPlayers: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      initialPlayers.push({
        id: (i + 1).toString(),
        name: playerNames[i] || '',
        score: 0,
      });
    }
    setPlayers(initialPlayers);

    setInitialized(true);
  }, [initialized, getEffectiveDefaults]);

  // Get effective variant based on toggle
  const getEffectiveVariant = (): GameVariant => {
    return useDefaults ? defaults.gameType : GAME_TYPES[variantIndex].id;
  };

  const getEffectivePoolLimit = (): PoolType => {
    if (useDefaults) {
      return defaults.poolLimit;
    }
    if (isCustomPoolLimit) {
      const parsed = parseInt(customPoolLimitText, 10);
      return parsed > 0 ? parsed : 250;
    }
    return PRESET_POOL_LIMITS[poolLimitIndex];
  };

  const getEffectiveNumberOfDeals = (): number => {
    return useDefaults ? defaults.numberOfDeals : numberOfDeals;
  };

  const getEffectiveDropPenalty = (): number => {
    return useDefaults ? defaults.dropPenalty : dropPenalty;
  };

  const getEffectiveJoinTableAmount = (): number => {
    return useDefaults ? defaults.joinTableAmount : joinTableAmount;
  };

  const variant = GAME_TYPES[variantIndex].id;
  const isCustomPoolLimit = poolLimitIndex === 3;

  const addPlayer = () => {
    if (players.length < 11) {
      setPlayers([
        ...players,
        { id: Date.now().toString(), name: '', score: 0 },
      ]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.name.trim() !== '');

    if (validPlayers.length < 2) {
      Alert.alert('Error', 'Please add at least 2 players with names');
      return;
    }

    const effectiveVariant = getEffectiveVariant();
    const effectivePoolLimit = getEffectivePoolLimit();
    const effectiveDeals = getEffectiveNumberOfDeals();
    const effectiveDropPenalty = getEffectiveDropPenalty();
    const effectiveJoinTableAmount = getEffectiveJoinTableAmount();

    const config: GameConfig = {
      variant: effectiveVariant,
      ...(effectiveVariant === 'pool' && {
        poolLimit: effectivePoolLimit,
        dropPenalty: effectiveDropPenalty,
        joinTableAmount: effectiveJoinTableAmount,
      }),
      ...(effectiveVariant === 'points' && { pointValue }),
      ...(effectiveVariant === 'deals' && { numberOfDeals: effectiveDeals }),
    };

    // Save last game settings for "Remember Last Game" feature
    saveLastGameSettings({
      gameType: effectiveVariant,
      poolLimit: effectivePoolLimit,
      numberOfDeals: effectiveDeals,
      playerCount: validPlayers.length,
      playerNames: validPlayers.map(p => p.name),
      dropPenalty: effectiveDropPenalty,
      joinTableAmount: effectiveJoinTableAmount,
    });

    resetGame();
    createGame(config, validPlayers, gameName.trim() || undefined);
    navigation.navigate('Game');
  };

  const validPlayerCount = players.filter(p => p.name.trim() !== '').length;

  const getVariantDescription = (v: GameVariant) => {
    switch (v) {
      case 'pool':
        return 'Players are eliminated when they exceed the pool limit. Eliminated players can rejoin when no one is in compulsory play. Last player standing wins.';
      case 'points':
        return 'Single round game. Winner gets 0 points, losers pay based on their hand value.';
      case 'deals':
        return 'Fixed number of deals. Player with lowest total score wins.';
    }
  };

  const getDefaultsSummary = () => {
    const v = defaults.gameType;
    if (v === 'pool') {
      return `Pool ${defaults.poolLimit}`;
    } else if (v === 'deals') {
      return `${defaults.numberOfDeals} Deals`;
    }
    return 'Points';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

        {/* Game Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GAME NAME</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Icon name="pencil" size={IconSize.medium} color={colors.secondaryLabel} weight="medium" />
              <TextInput
                style={styles.input}
                value={gameName}
                onChangeText={setGameName}
                placeholder="Friday Night Rummy (Optional)"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Use Defaults Toggle */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.toggleLabel}>Use Default Settings</Text>
                <Text style={styles.toggleHint}>{getDefaultsSummary()}</Text>
              </View>
              <Switch
                value={useDefaults}
                onValueChange={setUseDefaults}
                trackColor={{ false: colors.separator, true: colors.tint }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.separator}
              />
            </View>
          </View>
        </View>

        {/* Game Type Section - Only show when not using defaults */}
        {!useDefaults && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>GAME TYPE</Text>
            <View style={styles.segmentedCard}>
              <SegmentedControl
                values={GAME_TYPES.map(t => t.label)}
                selectedIndex={variantIndex}
                onChange={(event) => setVariantIndex(event.nativeEvent.selectedSegmentIndex)}
                style={styles.segmentedControl}
                fontStyle={styles.segmentedFont}
                activeFontStyle={styles.segmentedActiveFont}
                tintColor={colors.tint}
                backgroundColor={colors.cardBackground}
              />
              <View style={styles.variantDescriptionContainer}>
                <Icon
                  name={variant === 'pool' ? 'person.3.fill' : variant === 'deals' ? 'square.stack.fill' : 'star.fill'}
                  size={IconSize.medium}
                  color={colors.tint}
                  weight="medium"
                />
                <Text style={styles.variantDescription}>{getVariantDescription(variant)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Pool Limit Section - Only show when not using defaults and variant is pool */}
        {!useDefaults && variant === 'pool' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>POOL LIMIT</Text>
            <View style={styles.segmentedCard}>
              <SegmentedControl
                values={POOL_LIMIT_OPTIONS as unknown as string[]}
                selectedIndex={poolLimitIndex}
                onChange={(event) => {
                  const index = event.nativeEvent.selectedSegmentIndex;
                  setPoolLimitIndex(index);
                  if (index === 3 && !customPoolLimitText) {
                    setCustomPoolLimitText('300');
                  }
                }}
                style={styles.segmentedControl}
                fontStyle={styles.segmentedFont}
                activeFontStyle={styles.segmentedActiveFont}
                tintColor={colors.tint}
                backgroundColor={colors.cardBackground}
              />
              {isCustomPoolLimit && (
                <View style={styles.customLimitRow}>
                  <Text style={styles.customLimitLabel}>Custom limit:</Text>
                  <TextInput
                    style={styles.customLimitInput}
                    value={customPoolLimitText}
                    onChangeText={setCustomPoolLimitText}
                    keyboardType="numeric"
                    placeholder="300"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Pool Settings Row - Drop Penalty and Join Table Amount side by side */}
        {!useDefaults && variant === 'pool' && (
          <View style={styles.section}>
            <View style={styles.sideBySideRow}>
              {/* Drop Penalty */}
              <View style={styles.sideBySideItem}>
                <Text style={styles.sectionLabel}>DROP PENALTY</Text>
                <View style={styles.card}>
                  <View style={styles.compactInputRow}>
                    <TextInput
                      style={styles.compactInput}
                      value={dropPenalty.toString()}
                      onChangeText={text => setDropPenalty(parseInt(text, 10) || 25)}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Text style={styles.inputSuffix}>pts</Text>
                  </View>
                </View>
              </View>

              {/* Join Table Amount */}
              <View style={styles.sideBySideItem}>
                <Text style={styles.sectionLabel}>JOIN TABLE</Text>
                <View style={styles.card}>
                  <View style={styles.compactInputRow}>
                    <TextInput
                      style={styles.compactInput}
                      value={joinTableAmount.toString()}
                      onChangeText={text => setJoinTableAmount(parseInt(text, 10) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Text style={styles.inputSuffix}>{getCurrencySymbol(defaults.currency)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Points Value Section - Only show when not using defaults */}
        {!useDefaults && variant === 'points' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>POINT VALUE</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Text style={styles.currencyIcon}>{getCurrencySymbol(defaults.currency)}</Text>
                <TextInput
                  style={styles.input}
                  value={pointValue.toString()}
                  onChangeText={text => setPointValue(parseInt(text, 10) || 1)}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.inputSuffix}>per point</Text>
              </View>
            </View>
          </View>
        )}

        {/* Number of Deals Section - Only show when not using defaults */}
        {!useDefaults && variant === 'deals' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NUMBER OF DEALS</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Icon name="number.circle.fill" size={IconSize.medium} color={colors.secondaryLabel} weight="medium" />
                <TextInput
                  style={styles.input}
                  value={numberOfDeals.toString()}
                  onChangeText={text => setNumberOfDeals(parseInt(text, 10) || 2)}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.inputSuffix}>deals</Text>
              </View>
            </View>
          </View>
        )}

        {/* Players Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>PLAYERS</Text>
            <View style={styles.playerCountBadge}>
              <Text style={styles.playerCountText}>{players.length}/11</Text>
            </View>
          </View>
          <View style={styles.card}>
            {players.map((player, index) => {
              const isLast = index === players.length - 1;
              return (
                <View
                  key={player.id}
                  style={[
                    styles.playerRow,
                    !isLast && styles.playerRowBorder,
                  ]}>
                  <View style={styles.playerNumberContainer}>
                    <Text style={styles.playerNumber}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={styles.playerInput}
                    value={player.name}
                    onChangeText={text => updatePlayerName(player.id, text)}
                    placeholder={`Player ${index + 1}`}
                    placeholderTextColor={colors.placeholder}
                  />
                  {players.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePlayer(player.id)}
                      accessibilityLabel={`Remove ${player.name || 'player'}`}
                      accessibilityRole="button">
                      <Icon name="minus.circle.fill" size={IconSize.large} color={colors.destructive} weight="medium" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {players.length < 11 && (
            <TouchableOpacity
              style={styles.addPlayerButton}
              onPress={addPlayer}
              accessibilityLabel="Add another player"
              accessibilityRole="button">
              <Icon name="plus.circle.fill" size={IconSize.medium} color={colors.tint} weight="medium" />
              <Text style={styles.addPlayerText}>Add Player</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            validPlayerCount < 2 && styles.startButtonDisabled,
          ]}
          onPress={startGame}
          disabled={validPlayerCount < 2}
          accessibilityLabel="Start game"
          accessibilityRole="button">
          <Icon name="play.fill" size={IconSize.medium} color={validPlayerCount < 2 ? colors.tertiaryLabel : colors.label} weight="medium" />
          <Text style={[
            styles.startButtonText,
            validPlayerCount < 2 && styles.startButtonTextDisabled,
          ]}>
            Start Game
          </Text>
        </TouchableOpacity>

        {validPlayerCount < 2 && (
          <Text style={styles.startHint}>Add at least 2 players to start</Text>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Card Styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  segmentedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
  },

  // Segmented Control
  segmentedControl: {
    height: 36,
  },
  segmentedFont: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.label,
  },
  segmentedActiveFont: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.label,
  },

  // Variant Description
  variantDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    gap: Spacing.md,
  },
  variantDescription: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
    flex: 1,
    lineHeight: 18,
  },

  // Custom Limit
  customLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    gap: Spacing.sm,
  },
  customLimitLabel: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
  },
  customLimitInput: {
    flex: 1,
    ...Typography.body,
    color: colors.label,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    ...Typography.body,
    fontWeight: '500',
    color: colors.label,
  },
  toggleHint: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
    marginTop: 2,
  },

  // Input Row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: colors.label,
    padding: 0,
  },
  inputSuffix: {
    ...Typography.footnote,
    color: colors.secondaryLabel,
  },
  currencyIcon: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.secondaryLabel,
    minWidth: IconSize.medium,
    textAlign: 'center',
  },

  // Hint Row
  hintRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  hintText: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
  },

  // Side by Side Layout
  sideBySideRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sideBySideItem: {
    flex: 1,
  },
  compactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  compactInput: {
    ...Typography.body,
    color: colors.label,
    textAlign: 'center',
    minWidth: 50,
    padding: 0,
  },

  // Player Styles
  playerCountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: Spacing.xs,
  },
  playerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.label,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  playerNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  playerInput: {
    flex: 1,
    ...Typography.body,
    color: colors.label,
    padding: 0,
  },
  removeButton: {
    width: TapTargets.minimum,
    height: TapTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  addPlayerText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.tint,
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  startButtonDisabled: {
    backgroundColor: colors.cardBackground,
  },
  startButtonText: {
    ...Typography.headline,
    color: colors.label,
  },
  startButtonTextDisabled: {
    color: colors.tertiaryLabel,
  },
  startHint: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default GameSetupScreen;
