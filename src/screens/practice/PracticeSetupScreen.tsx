/**
 * PracticeSetupScreen
 *
 * Configure practice game settings: bot count, difficulty, variant.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { BotDifficulty, PracticeVariant, PracticeGameConfig } from '../../engine/types';
import { DEFAULT_FIRST_DROP, DEFAULT_MIDDLE_DROP, DEFAULT_INVALID_DECLARATION } from '../../engine/scoring';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../../components/Icon';

const VARIANT_OPTIONS: { value: PracticeVariant; label: string; description: string }[] = [
  { value: 'pool-101', label: 'Pool 101', description: 'Eliminated at 101 points' },
  { value: 'pool-201', label: 'Pool 201', description: 'Eliminated at 201 points' },
  { value: 'pool-250', label: 'Pool 250', description: 'Eliminated at 250 points' },
  { value: 'points', label: 'Points', description: 'Single round, lowest wins' },
  { value: 'deals', label: 'Deals', description: 'Fixed number of deals' },
];

const DIFFICULTY_OPTIONS: { value: BotDifficulty; label: string; icon: string }[] = [
  { value: 'easy', label: 'Easy', icon: 'tortoise.fill' },
  { value: 'medium', label: 'Medium', icon: 'hare.fill' },
  { value: 'hard', label: 'Hard', icon: 'bolt.fill' },
];

const PracticeSetupScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { createGame, startRound } = usePracticeGame();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Form state
  const [playerName, setPlayerName] = useState('You');
  const [botCount, setBotCount] = useState(3);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [variant, setVariant] = useState<PracticeVariant>('pool-201');
  const [numberOfDeals, setNumberOfDeals] = useState(3);

  const handleStartGame = useCallback(async () => {
    const config: PracticeGameConfig = {
      variant,
      numberOfDeals: variant === 'deals' ? numberOfDeals : undefined,
      firstDropPenalty: DEFAULT_FIRST_DROP,
      middleDropPenalty: DEFAULT_MIDDLE_DROP,
      invalidDeclarationPenalty: DEFAULT_INVALID_DECLARATION,
    };

    await createGame(playerName.trim() || 'You', botCount, difficulty, config);
    await startRound();
    navigation.replace('PracticeGame');
  }, [playerName, botCount, difficulty, variant, numberOfDeals, createGame, startRound, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="gamecontroller.fill" size={32} color={colors.accent} weight="medium" />
          </View>
          <Text style={styles.headerTitle}>Practice Mode</Text>
          <Text style={styles.headerSubtitle}>Play against AI opponents</Text>
        </View>

        {/* Player Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Name</Text>
          <View style={styles.inputContainer}>
            <Icon name="person.fill" size={IconSize.medium} color={colors.secondaryLabel} />
            <TextInput
              style={styles.textInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your name"
              placeholderTextColor={colors.placeholder}
              maxLength={20}
            />
          </View>
        </View>

        {/* Number of Bots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Opponents</Text>
          <View style={styles.segmentedControl}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.segment,
                  botCount === num && styles.selectedSegment,
                ]}
                onPress={() => setBotCount(num)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    botCount === num && styles.selectedSegmentText,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>
            {botCount + 1} players total (you + {botCount} bot{botCount > 1 ? 's' : ''})
          </Text>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bot Difficulty</Text>
          <View style={styles.optionsRow}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  difficulty === option.value && styles.selectedOption,
                ]}
                onPress={() => setDifficulty(option.value)}
              >
                <Icon
                  name={option.icon}
                  size={IconSize.large}
                  color={difficulty === option.value ? colors.accent : colors.secondaryLabel}
                  weight="medium"
                />
                <Text
                  style={[
                    styles.optionLabel,
                    difficulty === option.value && styles.selectedOptionLabel,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Game Variant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Variant</Text>
          {VARIANT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.variantOption,
                variant === option.value && styles.selectedVariant,
              ]}
              onPress={() => setVariant(option.value)}
            >
              <View style={styles.radioOuter}>
                {variant === option.value && <View style={styles.radioInner} />}
              </View>
              <View style={styles.variantInfo}>
                <Text
                  style={[
                    styles.variantLabel,
                    variant === option.value && styles.selectedVariantLabel,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.variantDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deals count (for Deals variant) */}
        {variant === 'deals' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Deals</Text>
            <View style={styles.segmentedControl}>
              {[2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.segment,
                    numberOfDeals === num && styles.selectedSegment,
                  ]}
                  onPress={() => setNumberOfDeals(num)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      numberOfDeals === num && styles.selectedSegmentText,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartGame}
          accessibilityLabel="Start practice game"
          accessibilityRole="button"
        >
          <Icon name="play.fill" size={IconSize.medium} color="#FFFFFF" weight="medium" />
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
    },
    header: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.md,
    },
    headerIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    headerTitle: {
      ...Typography.title1,
      color: colors.label,
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.headline,
      color: colors.label,
      marginBottom: Spacing.sm,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: Spacing.sm,
    },
    textInput: {
      flex: 1,
      ...Typography.body,
      color: colors.label,
      paddingVertical: Spacing.md,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    segment: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.small,
    },
    selectedSegment: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      ...Typography.body,
      color: colors.secondaryLabel,
      fontWeight: '600',
    },
    selectedSegmentText: {
      color: '#FFFFFF',
    },
    helperText: {
      ...Typography.footnote,
      color: colors.tertiaryLabel,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    optionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    optionCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: Spacing.xs,
    },
    selectedOption: {
      borderColor: colors.accent,
      borderWidth: 2,
      backgroundColor: colors.accent + '10',
    },
    optionLabel: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      fontWeight: '600',
    },
    selectedOptionLabel: {
      color: colors.accent,
    },
    variantOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: Spacing.md,
    },
    selectedVariant: {
      borderColor: colors.accent,
      borderWidth: 2,
      backgroundColor: colors.accent + '10',
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    variantInfo: {
      flex: 1,
    },
    variantLabel: {
      ...Typography.body,
      color: colors.label,
      fontWeight: '600',
    },
    selectedVariantLabel: {
      color: colors.accent,
    },
    variantDescription: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      marginTop: 2,
    },
    footer: {
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.cardBackground,
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      borderRadius: BorderRadius.medium,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    startButtonText: {
      ...Typography.headline,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default PracticeSetupScreen;
