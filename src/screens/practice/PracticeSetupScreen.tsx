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
  Modal,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { useSettings } from '../../context/SettingsContext';
import { BotDifficulty, PracticeVariant, PracticeGameConfig } from '../../engine/types';
import { DEFAULT_INVALID_DECLARATION } from '../../engine/scoring';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../../components/Icon';
import { VariantSelector, NumberSelector, PrimaryButton, SectionHeader, ScreenFooter } from '../../components/shared';

const DIFFICULTY_OPTIONS: { value: BotDifficulty; label: string; icon: string }[] = [
  { value: 'easy', label: 'Easy', icon: 'tortoise.fill' },
  { value: 'medium', label: 'Medium', icon: 'hare.fill' },
  { value: 'hard', label: 'Hard', icon: 'bolt.fill' },
];

const PracticeSetupScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { createGame } = usePracticeGame();
  const { defaults } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Form state - use settings defaults
  const [playerName, setPlayerName] = useState('You');
  const [botCount, setBotCount] = useState(3);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [variant, setVariant] = useState<PracticeVariant>(defaults.gameType);
  const [poolLimit, setPoolLimit] = useState(defaults.poolLimit);
  const [numberOfDeals, setNumberOfDeals] = useState(defaults.numberOfDeals);
  const [showDifficultyInfo, setShowDifficultyInfo] = useState(false);

  const handleStartGame = useCallback(async () => {
    const config: PracticeGameConfig = {
      variant,
      poolLimit: variant === 'pool' ? poolLimit : undefined,
      numberOfDeals: variant === 'deals' ? numberOfDeals : undefined,
      firstDropPenalty: defaults.firstDropPenalty,
      middleDropPenalty: defaults.middleDropPenalty,
      invalidDeclarationPenalty: DEFAULT_INVALID_DECLARATION,
    };

    await createGame(playerName.trim() || 'You', botCount, difficulty, config);
    navigation.replace('PracticeGame');
  }, [playerName, botCount, difficulty, variant, poolLimit, numberOfDeals, defaults, createGame, navigation]);

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
          <SectionHeader label="YOUR NAME" />
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
          <SectionHeader label="NUMBER OF OPPONENTS" />
          <NumberSelector
            value={botCount}
            onChange={setBotCount}
            options={[1, 2, 3, 4, 5]}
            helperText={(val) => `${val + 1} players total (you + ${val} bot${val > 1 ? 's' : ''})`}
          />
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <SectionHeader
            label="BOT DIFFICULTY"
            action={{
              icon: 'info.circle',
              onPress: () => setShowDifficultyInfo(true),
              accessibilityLabel: 'Learn about bot difficulties',
            }}
          />
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
          <SectionHeader label="GAME VARIANT" />
          <VariantSelector
            value={variant}
            onChange={setVariant}
            style="radio"
            showDescription={false}
          />
        </View>

        {/* Pool limit (for Pool variant) */}
        {variant === 'pool' && (
          <View style={styles.section}>
            <SectionHeader label="POINT LIMIT" />
            <NumberSelector
              value={poolLimit}
              onChange={setPoolLimit}
              options={[101, 201, 250]}
              helperText={(val) => `Players are eliminated when they exceed ${val} points`}
            />
          </View>
        )}

        {/* Deals count (for Deals variant) */}
        {variant === 'deals' && (
          <View style={styles.section}>
            <SectionHeader label="NUMBER OF DEALS" />
            <NumberSelector
              value={numberOfDeals}
              onChange={setNumberOfDeals}
              options={[2, 3, 4, 5, 6]}
            />
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <ScreenFooter>
        <PrimaryButton
          label="Start Game"
          icon="play.fill"
          onPress={handleStartGame}
          color="success"
          size="compact"
        />
      </ScreenFooter>

      {/* Difficulty Info Modal */}
      <Modal
        visible={showDifficultyInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDifficultyInfo(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <BlurView style={styles.modalBlur} blurType="dark" blurAmount={10}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bot Difficulty Levels</Text>
              <TouchableOpacity
                onPress={() => setShowDifficultyInfo(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="xmark.circle.fill" size={28} color={colors.secondaryLabel} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Easy Bot */}
              <View style={styles.difficultySection}>
                <View style={styles.difficultyHeader}>
                  <Icon name="tortoise.fill" size={IconSize.large} color={colors.success} />
                  <Text style={[styles.difficultyTitle, { color: colors.success }]}>Easy</Text>
                </View>
                <Text style={styles.difficultySubtitle}>Mostly random with minimal logic</Text>
                <View style={styles.difficultyDetails}>
                  <Text style={styles.detailItem}>• Draws from deck 80% of the time</Text>
                  <Text style={styles.detailItem}>• Discards highest value cards randomly</Text>
                  <Text style={styles.detailItem}>• Rarely drops (5% chance on first turn)</Text>
                  <Text style={styles.detailItem}>• No meld awareness</Text>
                </View>
              </View>

              {/* Medium Bot */}
              <View style={styles.difficultySection}>
                <View style={styles.difficultyHeader}>
                  <Icon name="hare.fill" size={IconSize.large} color={colors.warning} />
                  <Text style={[styles.difficultyTitle, { color: colors.warning }]}>Medium</Text>
                </View>
                <Text style={styles.difficultySubtitle}>Basic meld awareness</Text>
                <View style={styles.difficultyDetails}>
                  <Text style={styles.detailItem}>• Always picks up jokers from discard</Text>
                  <Text style={styles.detailItem}>• Picks discard if it helps form melds</Text>
                  <Text style={styles.detailItem}>• Avoids discarding potential meld cards</Text>
                  <Text style={styles.detailItem}>• Strategic dropping based on hand quality</Text>
                </View>
              </View>

              {/* Hard Bot */}
              <View style={styles.difficultySection}>
                <View style={styles.difficultyHeader}>
                  <Icon name="bolt.fill" size={IconSize.large} color={colors.destructive} />
                  <Text style={[styles.difficultyTitle, { color: colors.destructive }]}>Hard</Text>
                </View>
                <Text style={styles.difficultySubtitle}>Tracks discards, opponent awareness</Text>
                <View style={styles.difficultyDetails}>
                  <Text style={styles.detailItem}>• Evaluates hand improvement before picking</Text>
                  <Text style={styles.detailItem}>• Tracks discard history to find safe discards</Text>
                  <Text style={styles.detailItem}>• Avoids giving opponents useful cards</Text>
                  <Text style={styles.detailItem}>• Calculates expected value for drop decisions</Text>
                </View>
              </View>

              {/* Comparison Table */}
              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonTitle}>Feature Comparison</Text>
                <View style={styles.comparisonTable}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Tracks discards</Text>
                    <Text style={styles.comparisonValue}>❌  ❌  ✅</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Evaluates hand value</Text>
                    <Text style={styles.comparisonValue}>❌  ❌  ✅</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Meld awareness</Text>
                    <Text style={styles.comparisonValue}>❌  ✅  ✅</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Strategic dropping</Text>
                    <Text style={styles.comparisonValue}>❌  ✅  ✅</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Opponent modeling</Text>
                    <Text style={styles.comparisonValue}>❌  ❌  ✅</Text>
                  </View>
                </View>
                <Text style={styles.comparisonLegend}>Easy  Medium  Hard</Text>
              </View>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
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
    modalBlur: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxHeight: '85%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      padding: Spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalTitle: {
      ...Typography.title2,
      color: colors.label,
      fontWeight: '700',
    },
    modalCloseButton: {
      padding: Spacing.xs,
    },
    modalScroll: {
      maxHeight: 500,
    },
    difficultySection: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.medium,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    difficultyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    difficultyTitle: {
      ...Typography.headline,
      fontWeight: '700',
    },
    difficultySubtitle: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
      marginBottom: Spacing.sm,
    },
    difficultyDetails: {
      gap: 4,
    },
    detailItem: {
      ...Typography.footnote,
      color: colors.label,
      lineHeight: 18,
    },
    comparisonSection: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.medium,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    comparisonTitle: {
      ...Typography.subheadline,
      color: colors.label,
      fontWeight: '600',
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    comparisonTable: {
      gap: Spacing.xs,
    },
    comparisonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    comparisonLabel: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      flex: 1,
    },
    comparisonValue: {
      ...Typography.footnote,
      color: colors.label,
      fontFamily: 'Menlo',
      letterSpacing: 2,
    },
    comparisonLegend: {
      ...Typography.caption2,
      color: colors.tertiaryLabel,
      textAlign: 'right',
      marginTop: Spacing.xs,
      fontFamily: 'Menlo',
      letterSpacing: 1,
    },
  });

export default PracticeSetupScreen;
