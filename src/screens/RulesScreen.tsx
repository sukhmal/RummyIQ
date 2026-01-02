import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import { ThemeColors, Typography, Spacing, IconSize, BorderRadius } from '../theme';

interface RuleSection {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

const RULES_DATA: RuleSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: 'info.circle.fill',
    content: [
      'Indian Rummy is a card game where players aim to form valid sets and sequences.',
      'A valid declaration requires at least two sequences, one of which must be a pure sequence (without joker).',
      'The player who declares first with valid melds wins the round.',
    ],
  },
  {
    id: 'pool',
    title: 'Pool Rummy',
    icon: 'drop.fill',
    content: [
      'Players accumulate points across multiple rounds.',
      'Players are eliminated when their score exceeds the pool limit (e.g., 250 points in Pool 250).',
      'Last player remaining wins the game.',
      'Eliminated players can rejoin at highest score + 1 (if no one is in compulsory play).',
    ],
  },
  {
    id: 'points',
    title: 'Points Rummy',
    icon: 'number.circle.fill',
    content: [
      'Cash game where each point has a pre-decided monetary value.',
      'Single round format - fastest way to play.',
      'Winner collects from each loser based on their unmelded cards × point value.',
    ],
  },
  {
    id: 'deals',
    title: 'Deals Rummy',
    icon: 'rectangle.stack.fill',
    content: [
      'Fixed number of deals (rounds) are played.',
      'Points are accumulated across all deals.',
      'Player with lowest total score at the end wins.',
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring Rules',
    icon: 'plus.forwardslash.minus',
    content: [
      'Declared winner: 0 points',
      'Invalid declaration: 80 points (Pool) or full hand count (other variants)',
      'Face cards (J, Q, K, A): 10 points each',
      'Number cards: Face value (2-10)',
      'Jokers in unmelded cards: 0 points',
    ],
  },
  {
    id: 'drop',
    title: 'Drop & Penalties',
    icon: 'hand.raised.fill',
    content: [
      'First drop (before picking any card): 25 points.',
      'Middle drop (after picking a card): 50 points.',
      'Drop penalties can be customized in game settings.',
      'Compulsory play: When remaining points space is less than first drop penalty, player must play.',
    ],
  },
  {
    id: 'dealer',
    title: 'Dealer Rotation',
    icon: 'arrow.triangle.2.circlepath',
    content: [
      'Dealer rotates based on the "open card rule".',
      'The player who receives the open card becomes the next dealer.',
      'If that player is eliminated, the current dealer continues.',
      'If the dealer is eliminated, dealership goes to the previous active player.',
    ],
  },
  {
    id: 'rejoin',
    title: 'Rejoin Rules',
    icon: 'arrow.uturn.backward.circle.fill',
    content: [
      'Only available in Pool Rummy.',
      'Eliminated players can rejoin when no active player is in compulsory play.',
      'Rejoin score = Highest active player score + 1',
      'Rejoining player is seated to the left of the current dealer.',
      'Players can rejoin multiple times (if eligible).',
    ],
  },
  {
    id: 'splitpot',
    title: 'Split Pot',
    icon: 'chart.pie.fill',
    content: [
      'Available in Pool Rummy when 2 or more players remain.',
      'Total pot = Join amount × (initial players + total rejoins).',
      'Proportional split based on drops available (pool limit - score).',
      'Equal split divides the pot evenly among remaining players.',
      'Custom option lets players enter any amounts they agree on.',
    ],
  },
];

const RulesScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="book.fill" size={32} color={colors.accent} weight="medium" />
          </View>
          <Text style={styles.headerTitle}>Game Rules</Text>
          <Text style={styles.headerSubtitle}>Learn how to play Indian Rummy</Text>
        </View>

        {/* Rules Sections */}
        <View style={styles.sectionsContainer}>
          {RULES_DATA.map((section, index) => {
            const isExpanded = expandedSection === section.id;
            const isLast = index === RULES_DATA.length - 1;

            return (
              <View key={section.id}>
                <TouchableOpacity
                  style={[styles.sectionHeader, !isLast && !isExpanded && styles.sectionBorder]}
                  onPress={() => toggleSection(section.id)}
                  accessibilityLabel={`${section.title} section`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIcon, { backgroundColor: colors.accent + '20' }]}>
                      <Icon name={section.icon} size={IconSize.medium} color={colors.accent} weight="medium" />
                    </View>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <Icon
                    name={isExpanded ? 'chevron.up' : 'chevron.down'}
                    size={IconSize.medium}
                    color={colors.tertiaryLabel}
                    weight="semibold"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.sectionContent, !isLast && styles.sectionBorder]}>
                    {section.content.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Icon name="lightbulb.fill" size={IconSize.medium} color={colors.warning} weight="medium" />
          <Text style={styles.footerText}>
            Tip: Tap any section above to expand or collapse it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: Spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
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

  // Sections
  sectionsContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  sectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.headline,
    color: colors.label,
  },
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  bulletText: {
    ...Typography.body,
    color: colors.secondaryLabel,
    flex: 1,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerText: {
    ...Typography.footnote,
    color: colors.tertiaryLabel,
  },
});

export default RulesScreen;
