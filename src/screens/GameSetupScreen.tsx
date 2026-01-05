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
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getCurrencySymbol } from '../context/SettingsContext';
import { GameVariant, GameConfig, Player, PoolType } from '../types/game';
import Icon from '../components/Icon';
import { ThemeColors, Typography, Spacing, TapTargets, IconSize, BorderRadius } from '../theme';
import { VariantSelector, PoolLimitSelector, NumberInputField, PrimaryButton, SectionHeader } from '../components/shared';

const PRESET_POOL_LIMITS = [101, 201, 250] as const;

const GameSetupScreen = ({ navigation }: any) => {
  const { createGame, resetGame } = useGame();
  const { colors } = useTheme();
  const { defaults, getEffectiveDefaults, saveLastGameSettings } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [useDefaults, setUseDefaults] = useState<boolean>(true);
  const [gameName, setGameName] = useState<string>('');
  const [variant, setVariant] = useState<GameVariant>('pool');
  const [poolLimit, setPoolLimit] = useState<number>(250);
  const [customPoolLimitText, setCustomPoolLimitText] = useState('');
  const [pointValue, setPointValue] = useState<number>(1);
  const [numberOfDeals, setNumberOfDeals] = useState<number>(2);
  const [firstDropPenalty, setFirstDropPenalty] = useState<number>(25);
  const [middleDropPenalty, setMiddleDropPenalty] = useState<number>(50);
  const [joinTableAmount, setJoinTableAmount] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', score: 0 },
    { id: '2', name: '', score: 0 },
  ]);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null); // null = last player
  const [showDealerSelection, setShowDealerSelection] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);

  // Apply defaults on mount
  useEffect(() => {
    if (initialized) return;

    const effectiveDefaults = getEffectiveDefaults();

    // Set game type
    setVariant(effectiveDefaults.gameType);

    // Set pool limit
    const defaultPoolLimit = effectiveDefaults.poolLimit;
    setPoolLimit(defaultPoolLimit);
    const isPreset = PRESET_POOL_LIMITS.includes(defaultPoolLimit as 101 | 201 | 250);
    if (!isPreset && typeof defaultPoolLimit === 'number') {
      setCustomPoolLimitText(defaultPoolLimit.toString());
    }

    // Set number of deals
    setNumberOfDeals(effectiveDefaults.numberOfDeals);

    // Set drop penalties and join table amount
    setFirstDropPenalty(effectiveDefaults.firstDropPenalty);
    setMiddleDropPenalty(effectiveDefaults.middleDropPenalty);
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
    return useDefaults ? defaults.gameType : variant;
  };

  const getEffectivePoolLimit = (): PoolType => {
    return useDefaults ? defaults.poolLimit : poolLimit;
  };

  const getEffectiveNumberOfDeals = (): number => {
    return useDefaults ? defaults.numberOfDeals : numberOfDeals;
  };

  const getEffectiveFirstDropPenalty = (): number => {
    return useDefaults ? defaults.firstDropPenalty : firstDropPenalty;
  };

  const getEffectiveMiddleDropPenalty = (): number => {
    return useDefaults ? defaults.middleDropPenalty : middleDropPenalty;
  };

  const getEffectiveJoinTableAmount = (): number => {
    return useDefaults ? defaults.joinTableAmount : joinTableAmount;
  };

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
    const effectiveFirstDrop = getEffectiveFirstDropPenalty();
    const effectiveMiddleDrop = getEffectiveMiddleDropPenalty();
    const effectiveJoinTableAmount = getEffectiveJoinTableAmount();

    const config: GameConfig = {
      variant: effectiveVariant,
      ...(effectiveVariant === 'pool' && {
        poolLimit: effectivePoolLimit,
        firstDropPenalty: effectiveFirstDrop,
        middleDropPenalty: effectiveMiddleDrop,
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
      firstDropPenalty: effectiveFirstDrop,
      middleDropPenalty: effectiveMiddleDrop,
      joinTableAmount: effectiveJoinTableAmount,
    });

    resetGame();
    // Pass dealerId - if selected, use that; otherwise createGame will default to last player
    const dealerId = selectedDealerId || undefined;
    createGame(config, validPlayers, gameName.trim() || undefined, dealerId);
    navigation.navigate('Game');
  };

  const validPlayerCount = players.filter(p => p.name.trim() !== '').length;

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
          <SectionHeader label="GAME NAME" />
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
            <SectionHeader label="GAME TYPE" />
            <VariantSelector
              value={variant}
              onChange={setVariant}
              style="segmented"
              showDescription={true}
            />
          </View>
        )}

        {/* Pool Limit Section - Only show when not using defaults and variant is pool */}
        {!useDefaults && variant === 'pool' && (
          <View style={styles.section}>
            <SectionHeader label="POOL LIMIT" />
            <PoolLimitSelector
              value={poolLimit}
              onChange={setPoolLimit}
              allowCustom={true}
              customValue={customPoolLimitText}
              onCustomValueChange={setCustomPoolLimitText}
              showHelperText={false}
            />
          </View>
        )}

        {/* Pool Settings - Drop Penalties */}
        {!useDefaults && variant === 'pool' && (
          <View style={styles.section}>
            <View style={styles.sideBySideRow}>
              {/* First Drop */}
              <View style={styles.sideBySideItem}>
                <SectionHeader label="FIRST DROP" />
                <View style={styles.card}>
                  <View style={styles.compactInputRow}>
                    <TextInput
                      style={styles.compactInput}
                      value={firstDropPenalty.toString()}
                      onChangeText={text => setFirstDropPenalty(parseInt(text, 10) || 25)}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Text style={styles.inputSuffix}>pts</Text>
                  </View>
                </View>
              </View>

              {/* Middle Drop */}
              <View style={styles.sideBySideItem}>
                <SectionHeader label="MIDDLE DROP" />
                <View style={styles.card}>
                  <View style={styles.compactInputRow}>
                    <TextInput
                      style={styles.compactInput}
                      value={middleDropPenalty.toString()}
                      onChangeText={text => setMiddleDropPenalty(parseInt(text, 10) || 50)}
                      keyboardType="numeric"
                      placeholder="50"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Text style={styles.inputSuffix}>pts</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Pool Settings - Join Table Amount */}
        {!useDefaults && variant === 'pool' && (
          <View style={styles.section}>
            <SectionHeader label="JOIN TABLE AMOUNT" />
            <NumberInputField
              value={joinTableAmount}
              onChange={setJoinTableAmount}
              placeholder="0"
              defaultValue={0}
              prefix={<Text style={styles.currencyIcon}>{getCurrencySymbol(defaults.currency)}</Text>}
              suffix="per player"
            />
          </View>
        )}

        {/* Points Value Section - Only show when not using defaults */}
        {!useDefaults && variant === 'points' && (
          <View style={styles.section}>
            <SectionHeader label="POINT VALUE" />
            <NumberInputField
              value={pointValue}
              onChange={setPointValue}
              placeholder="1"
              defaultValue={1}
              prefix={<Text style={styles.currencyIcon}>{getCurrencySymbol(defaults.currency)}</Text>}
              suffix="per point"
            />
          </View>
        )}

        {/* Number of Deals Section - Only show when not using defaults */}
        {!useDefaults && variant === 'deals' && (
          <View style={styles.section}>
            <SectionHeader label="NUMBER OF DEALS" />
            <NumberInputField
              value={numberOfDeals}
              onChange={setNumberOfDeals}
              placeholder="2"
              defaultValue={2}
              icon="number.circle.fill"
              suffix="deals"
            />
          </View>
        )}

        {/* Players Section */}
        <View style={styles.section}>
          <SectionHeader label="PLAYERS" badge={`${players.length}/11`} />
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

        {/* Dealer Selection */}
        {validPlayerCount >= 2 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleLabel}>Select Dealer</Text>
                  <Text style={styles.toggleHint}>
                    {showDealerSelection
                      ? 'Choose who deals first'
                      : `Default: ${players.filter(p => p.name.trim() !== '').slice(-1)[0]?.name || 'Last player'}`}
                  </Text>
                </View>
                <Switch
                  value={showDealerSelection}
                  onValueChange={(value) => {
                    setShowDealerSelection(value);
                    if (!value) {
                      setSelectedDealerId(null); // Reset to default when hiding
                    }
                  }}
                  trackColor={{ false: colors.separator, true: colors.tint }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={colors.separator}
                />
              </View>
              {showDealerSelection && (
                <>
                  <View style={styles.dealerSeparator} />
                  {players.filter(p => p.name.trim() !== '').map((player, index, filteredPlayers) => {
                    const isLast = index === filteredPlayers.length - 1;
                    const isSelected = selectedDealerId === player.id ||
                      (selectedDealerId === null && index === filteredPlayers.length - 1);
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[
                          styles.dealerRow,
                          !isLast && styles.playerRowBorder,
                        ]}
                        onPress={() => setSelectedDealerId(player.id)}
                        accessibilityLabel={`Select ${player.name} as dealer`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}>
                        <View style={styles.dealerInfo}>
                          <Text style={styles.dealerName}>{player.name}</Text>
                        </View>
                        {isSelected && (
                          <Icon name="checkmark.circle.fill" size={IconSize.large} color={colors.tint} weight="medium" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          </View>
        )}

        {/* Start Button */}
        <PrimaryButton
          label="Start Game"
          icon="play.fill"
          onPress={startGame}
          disabled={validPlayerCount < 2}
          style={styles.startButton}
        />

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

  // Card Styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
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

  // Dealer Selection
  dealerSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TapTargets.minimum,
  },
  dealerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dealerName: {
    ...Typography.body,
    color: colors.label,
  },

  // Start Button
  startButton: {
    marginTop: Spacing.md,
  },
  startHint: {
    ...Typography.caption1,
    color: colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default GameSetupScreen;
