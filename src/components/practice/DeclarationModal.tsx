/**
 * DeclarationModal Component
 *
 * Modal for arranging cards into melds and declaring.
 * Shows meld validation and hints.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType, Meld } from '../../engine/types';
import { autoArrangeHand, validateDeclaration, getDeclarationHint } from '../../engine/declaration';
import { createMeld } from '../../engine/meld';

interface CardWithGroup extends CardType {
  groupIndex?: number;
}
import { ThemeColors, Spacing, BorderRadius, Typography, IconSize } from '../../theme';
import Icon from '../Icon';
import Card from './Card';

interface DeclarationModalProps {
  visible: boolean;
  cards: CardWithGroup[];
  onDeclare: (melds: Meld[]) => void;
  onCancel: () => void;
}

const DeclarationModal: React.FC<DeclarationModalProps> = ({
  visible,
  cards,
  onDeclare,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [melds, setMelds] = useState<Meld[]>([]);
  const [deadwood, setDeadwood] = useState<CardType[]>([]);
  const [closingCard, setClosingCard] = useState<CardType | null>(null);
  const [selectedMeldIndex, setSelectedMeldIndex] = useState<number | null>(null);

  // Helper to format card for logging
  const formatCard = (card: CardType): string => {
    if (card.jokerType === 'printed') return '🃏';
    if (card.jokerType === 'wild') return `${card.rank}${card.suit[0]}(W)`;
    const suitSymbol = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit] || card.suit[0];
    return `${card.rank}${suitSymbol}`;
  };

  // Convert grouped cards to melds when modal opens
  useEffect(() => {
    if (visible && cards && cards.length > 0) {
      try {
        console.log('\n📋 DECLARATION MODAL OPENED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total cards: ${cards.length}`);
        console.log('Cards with groupIndex:', cards.map(c => `${formatCard(c)}[g${c.groupIndex ?? -1}]`).join(' '));

        // Separate cards by their groupIndex
        const groupedCards: { [key: number]: CardType[] } = {};
        const ungroupedCards: CardType[] = [];

        cards.forEach(card => {
          const { groupIndex, ...cardWithoutGroup } = card;
          if (groupIndex !== undefined && groupIndex >= 0) {
            if (!groupedCards[groupIndex]) {
              groupedCards[groupIndex] = [];
            }
            groupedCards[groupIndex].push(cardWithoutGroup);
          } else {
            ungroupedCards.push(cardWithoutGroup);
          }
        });

        console.log(`\nGrouped cards (${Object.keys(groupedCards).length} groups):`);
        Object.entries(groupedCards).forEach(([idx, grpCards]) => {
          console.log(`  Group ${idx}: ${grpCards.map(formatCard).join(' ')} (${grpCards.length} cards)`);
        });
        console.log(`Ungrouped cards: ${ungroupedCards.map(formatCard).join(' ') || 'none'} (${ungroupedCards.length} cards)`);

        // Convert grouped cards to melds
        const manualMelds: Meld[] = [];
        const invalidGroupCards: CardType[] = [];

        Object.entries(groupedCards).forEach(([idx, groupCards]) => {
          if (groupCards.length >= 3) {
            const meld = createMeld(groupCards);
            if (meld) {
              console.log(`  ✓ Group ${idx} → Valid ${meld.type}: ${groupCards.map(formatCard).join(' ')}`);
              manualMelds.push(meld);
            } else {
              console.log(`  ✗ Group ${idx} → INVALID meld: ${groupCards.map(formatCard).join(' ')}`);
              invalidGroupCards.push(...groupCards);
            }
          } else {
            console.log(`  ✗ Group ${idx} → Too few cards (${groupCards.length}): ${groupCards.map(formatCard).join(' ')}`);
            invalidGroupCards.push(...groupCards);
          }
        });

        // Auto-arrange only the ungrouped cards
        const cardsToAutoArrange = [...ungroupedCards, ...invalidGroupCards];
        console.log(`\nCards to auto-arrange: ${cardsToAutoArrange.map(formatCard).join(' ') || 'none'} (${cardsToAutoArrange.length} cards)`);

        // Calculate total melded cards from manual melds
        const meldedCardCount = manualMelds.reduce((sum, m) => sum + m.cards.length, 0);

        // Check if we have exactly 13 cards melded and 1 card left (closing card scenario)
        if (cardsToAutoArrange.length === 1 && meldedCardCount === 13) {
          // This is the closing card - the card that will be discarded when declaring
          console.log(`\n✓ Closing card identified: ${formatCard(cardsToAutoArrange[0])}`);
          setMelds(manualMelds);
          setClosingCard(cardsToAutoArrange[0]);
          setDeadwood([]);
        } else if (cardsToAutoArrange.length > 0) {
          const analysis = autoArrangeHand(cardsToAutoArrange);
          console.log(`Auto-arranged melds: ${analysis.melds?.length || 0}`);
          analysis.melds?.forEach((m, i) => {
            console.log(`  Auto meld ${i}: ${m.type} - ${m.cards.map(formatCard).join(' ')}`);
          });

          const allMelds = [...manualMelds, ...(analysis.melds || [])];
          const totalMeldedNow = allMelds.reduce((sum, m) => sum + m.cards.length, 0);

          // After auto-arrange, check again if we have 13 melded + 1 closing
          if (analysis.deadwood?.length === 1 && totalMeldedNow === 13) {
            console.log(`\n✓ Closing card (after auto-arrange): ${formatCard(analysis.deadwood[0])}`);
            setMelds(allMelds);
            setClosingCard(analysis.deadwood[0]);
            setDeadwood([]);
          } else {
            console.log(`Auto deadwood: ${analysis.deadwood?.map(formatCard).join(' ') || 'none'}`);
            setMelds(allMelds);
            setClosingCard(null);
            setDeadwood(analysis.deadwood || []);
          }
        } else {
          setMelds(manualMelds);
          setClosingCard(null);
          setDeadwood([]);
        }

        console.log(`\nFinal melds: ${manualMelds.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        setSelectedMeldIndex(null);
      } catch (error) {
        console.error('Error arranging cards:', error);
        setMelds([]);
        setDeadwood([...cards]);
        setSelectedMeldIndex(null);
      }
    }
  }, [visible, cards]);

  const validation = useMemo(() => {
    try {
      // Don't include closing card in deadwood - it will be discarded
      // Only validate the 13 melded cards
      return validateDeclaration(melds, deadwood);
    } catch (error) {
      console.error('Error in validateDeclaration:', error);
      return {
        isValid: false,
        hasPureSequence: false,
        hasMinimumSequences: false,
        allCardsMelded: false,
        melds: [],
        deadwood: [],
        deadwoodPoints: 0,
        errors: ['Error validating declaration'],
      };
    }
  }, [melds, deadwood]);

  // Check if we have a valid declaration with closing card
  const isValidWithClosingCard = validation.isValid || (closingCard && deadwood.length === 0 && validation.hasPureSequence && validation.hasMinimumSequences);

  const hints = useMemo(() => {
    if (!cards || cards.length === 0) return [];
    try {
      return getDeclarationHint(cards);
    } catch (error) {
      console.error('Error in getDeclarationHint:', error);
      return [];
    }
  }, [cards]);

  const handleAutoArrange = useCallback(() => {
    if (!cards || cards.length === 0) return;

    // If already valid, don't change anything
    if (isValidWithClosingCard) {
      Alert.alert('Already Valid', 'Your declaration is already valid. No changes needed.');
      return;
    }

    try {
      // Get cards that are already in valid melds (preserve them)
      const validMeldCards = new Set<string>();
      const validMeldsToKeep: Meld[] = [];

      for (const meld of melds) {
        // Check if meld is valid (has 3+ cards and is a valid type)
        if (meld.cards.length >= 3 && (meld.type === 'pure-sequence' || meld.type === 'sequence' || meld.type === 'set')) {
          validMeldsToKeep.push(meld);
          meld.cards.forEach(c => validMeldCards.add(c.id));
        }
      }

      // Get cards not in valid melds
      const cardsToRearrange = cards.filter(c => !validMeldCards.has(c.id));

      if (cardsToRearrange.length === 0) {
        // All cards are in valid melds, but declaration is still invalid
        // This means we need sequence requirement - try full rearrange
        const analysis = autoArrangeHand(cards);
        setMelds(analysis.melds || []);
        setDeadwood(analysis.deadwood || []);
      } else {
        // Auto-arrange only the unmelded cards
        const analysis = autoArrangeHand(cardsToRearrange);

        // Combine valid melds with newly arranged ones
        const allMelds = [...validMeldsToKeep, ...(analysis.melds || [])];
        const totalMelded = allMelds.reduce((sum, m) => sum + m.cards.length, 0);

        // Check for closing card scenario
        if (analysis.deadwood?.length === 1 && totalMelded === 13) {
          setMelds(allMelds);
          setClosingCard(analysis.deadwood[0]);
          setDeadwood([]);
        } else {
          setMelds(allMelds);
          setClosingCard(null);
          setDeadwood(analysis.deadwood || []);
        }
      }
      setSelectedMeldIndex(null);
    } catch (error) {
      console.error('Error in handleAutoArrange:', error);
    }
  }, [cards, melds, isValidWithClosingCard]);

  const handleDeclare = useCallback(() => {
    if (!isValidWithClosingCard) {
      Alert.alert(
        'Invalid Declaration',
        'Your melds do not meet the requirements for a valid declaration. You will receive penalty points.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Declare Anyway', style: 'destructive', onPress: () => onDeclare(melds) },
        ]
      );
    } else {
      onDeclare(melds);
    }
  }, [isValidWithClosingCard, melds, onDeclare]);

  const getMeldTypeLabel = (meld: Meld): string => {
    switch (meld.type) {
      case 'pure-sequence':
        return 'Pure Sequence';
      case 'sequence':
        return 'Sequence';
      case 'set':
        return 'Set';
      default:
        return 'Meld';
    }
  };

  const getMeldTypeColor = (meld: Meld): string => {
    if (meld.type === 'pure-sequence') return colors.success;
    if (meld.type === 'sequence') return colors.accent;
    return colors.warning;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <BlurView style={styles.blurContainer} blurType="dark" blurAmount={10}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Declare</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
              accessibilityLabel="Close"
            >
              <Icon name="xmark.circle.fill" size={IconSize.large} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          </View>

          {/* Validation status */}
          <View style={[
            styles.validationBanner,
            { backgroundColor: isValidWithClosingCard ? colors.success + '20' : colors.destructive + '20' },
          ]}>
            <Icon
              name={isValidWithClosingCard ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
              size={IconSize.medium}
              color={isValidWithClosingCard ? colors.success : colors.destructive}
            />
            <Text style={[
              styles.validationText,
              { color: isValidWithClosingCard ? colors.success : colors.destructive },
            ]}>
              {isValidWithClosingCard ? 'Valid Declaration' : 'Invalid Declaration'}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Melds */}
            <Text style={styles.sectionTitle}>Melds ({melds.length})</Text>
            {melds.map((meld, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.meldContainer,
                  selectedMeldIndex === index && styles.selectedMeld,
                ]}
                onPress={() => setSelectedMeldIndex(index === selectedMeldIndex ? null : index)}
              >
                <View style={styles.meldHeader}>
                  <View style={[styles.meldTypeBadge, { backgroundColor: getMeldTypeColor(meld) }]}>
                    <Text style={styles.meldTypeText}>{getMeldTypeLabel(meld)}</Text>
                  </View>
                  <Text style={styles.meldCardCount}>{meld.cards.length} cards</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.meldCards}
                >
                  {meld.cards.map((card) => (
                    <View key={card.id} style={styles.meldCardWrapper}>
                      <Card card={card} size="small" />
                    </View>
                  ))}
                </ScrollView>
              </TouchableOpacity>
            ))}

            {/* Closing Card */}
            {closingCard && (
              <>
                <Text style={styles.sectionTitle}>Closing Card (will be discarded)</Text>
                <View style={styles.closingCardContainer}>
                  <View style={styles.meldCardWrapper}>
                    <Card card={closingCard} size="small" />
                  </View>
                  <Text style={styles.closingCardHint}>
                    This card will be discarded when you declare
                  </Text>
                </View>
              </>
            )}

            {/* Deadwood */}
            {deadwood.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Unmelded Cards ({deadwood.length}) - {validation.deadwoodPoints} points
                </Text>
                <View style={styles.deadwoodContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.meldCards}
                  >
                    {deadwood.map((card) => (
                      <View key={card.id} style={styles.meldCardWrapper}>
                        <Card card={card} size="small" />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Hints */}
            {hints.length > 0 && !isValidWithClosingCard && (
              <View style={styles.hintsContainer}>
                <Text style={styles.hintsTitle}>Requirements:</Text>
                {hints.map((hint, index) => (
                  <View key={index} style={styles.hintRow}>
                    <Icon
                      name="info.circle"
                      size={14}
                      color={colors.warning}
                    />
                    <Text style={styles.hintText}>{hint}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAutoArrange}
            >
              <Icon name="wand.and.stars" size={IconSize.medium} color={colors.accent} />
              <Text style={[styles.buttonText, { color: colors.accent }]}>Auto-Arrange</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: isValidWithClosingCard ? colors.success : colors.warning },
              ]}
              onPress={handleDeclare}
            >
              <Icon
                name={isValidWithClosingCard ? 'checkmark.seal.fill' : 'exclamationmark.triangle.fill'}
                size={IconSize.medium}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                {isValidWithClosingCard ? 'Declare' : 'Declare (Penalty)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    blurContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    title: {
      ...Typography.title2,
      color: colors.label,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    validationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.sm,
      gap: Spacing.xs,
    },
    validationText: {
      ...Typography.subheadline,
      fontWeight: '600',
    },
    content: {
      padding: Spacing.md,
    },
    sectionTitle: {
      ...Typography.headline,
      color: colors.label,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    meldContainer: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.medium,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    selectedMeld: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    meldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    meldTypeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.small,
    },
    meldTypeText: {
      ...Typography.caption2,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    meldCardCount: {
      ...Typography.caption1,
      color: colors.secondaryLabel,
    },
    meldCards: {
      flexDirection: 'row',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    meldCardWrapper: {
      // Individual card wrapper
    },
    closingCardContainer: {
      backgroundColor: colors.accent + '10',
      borderRadius: BorderRadius.medium,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent + '30',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    closingCardHint: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      flex: 1,
    },
    deadwoodContainer: {
      backgroundColor: colors.destructive + '10',
      borderRadius: BorderRadius.medium,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.destructive + '30',
    },
    hintsContainer: {
      backgroundColor: colors.warning + '10',
      borderRadius: BorderRadius.medium,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    hintsTitle: {
      ...Typography.subheadline,
      color: colors.warning,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    hintText: {
      ...Typography.footnote,
      color: colors.label,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      padding: Spacing.md,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.medium,
      borderWidth: 1,
      borderColor: colors.accent,
      gap: Spacing.xs,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.medium,
      gap: Spacing.xs,
    },
    buttonText: {
      ...Typography.body,
      fontWeight: '600',
    },
    primaryButtonText: {
      ...Typography.body,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default DeclarationModal;
