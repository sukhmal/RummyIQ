/**
 * BotDeclarationModal Component
 *
 * Shows a bot's declaration when they declare.
 * Displays their melds and whether it was valid.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType, Meld, PracticePlayer } from '../../engine/types';
import { ThemeColors, Spacing, BorderRadius, Typography } from '../../theme';
import Icon from '../Icon';
import Card from './Card';

interface BotDeclarationModalProps {
  visible: boolean;
  player: PracticePlayer | null;
  hand: CardType[];
  melds: Meld[];
  deadwood: CardType[];
  isValid: boolean;
  onClose: () => void;
}

const BotDeclarationModal: React.FC<BotDeclarationModalProps> = ({
  visible,
  player,
  hand,
  melds,
  deadwood,
  isValid,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!player) return null;

  const getMeldTypeLabel = (meld: Meld): string => {
    if (meld.type === 'pure-sequence') return 'Pure Sequence';
    if (meld.type === 'sequence') return 'Sequence';
    return 'Set';
  };

  const getMeldColor = (meld: Meld): string => {
    if (meld.type === 'pure-sequence') return colors.success;
    if (meld.type === 'sequence') return colors.accent;
    return colors.warning;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <BlurView
        style={styles.blurContainer}
        blurType="dark"
        blurAmount={10}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={[styles.badge, { backgroundColor: isValid ? colors.success : colors.destructive }]}>
                <Text style={styles.badgeText}>
                  {isValid ? 'Valid Declaration' : 'Invalid Declaration'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="xmark.circle.fill" size={28} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Show all cards if no melds (invalid declaration scenario) */}
            {melds.length === 0 && hand.length > 0 && (
              <View style={styles.meldContainer}>
                <Text style={styles.meldLabel}>Hand</Text>
                <View style={styles.cardsRow}>
                  {hand.map((card, idx) => (
                    <View key={card.id} style={[styles.cardWrapper, idx > 0 && styles.cardOverlap]}>
                      <Card card={card} size="small" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Melds */}
            {melds.map((meld, meldIdx) => (
              <View key={meldIdx} style={styles.meldContainer}>
                <View style={styles.meldHeader}>
                  <Text style={[styles.meldLabel, { color: getMeldColor(meld) }]}>
                    {getMeldTypeLabel(meld)}
                  </Text>
                  {meld.isPure && (
                    <View style={[styles.pureBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.pureBadgeText}>Pure</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardsRow}>
                  {meld.cards.map((card, idx) => (
                    <View key={card.id} style={[styles.cardWrapper, idx > 0 && styles.cardOverlap]}>
                      <Card card={card} size="small" />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Deadwood */}
            {deadwood.length > 0 && (
              <View style={styles.meldContainer}>
                <Text style={[styles.meldLabel, { color: colors.destructive }]}>
                  Deadwood ({deadwood.reduce((sum, c) => sum + c.value, 0)} points)
                </Text>
                <View style={styles.cardsRow}>
                  {deadwood.map((card, idx) => (
                    <View key={card.id} style={[styles.cardWrapper, idx > 0 && styles.cardOverlap]}>
                      <Card card={card} size="small" />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
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
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      padding: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    playerName: {
      ...Typography.title2,
      color: colors.label,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    badge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.small,
      alignSelf: 'flex-start',
    },
    badgeText: {
      ...Typography.caption1,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    closeButton: {
      padding: Spacing.xs,
    },
    scrollContent: {
      maxHeight: 300,
    },
    meldContainer: {
      marginBottom: Spacing.md,
    },
    meldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    meldLabel: {
      ...Typography.caption1,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    pureBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    pureBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cardsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cardWrapper: {
      marginBottom: Spacing.xs,
    },
    cardOverlap: {
      marginLeft: -20,
    },
    continueButton: {
      backgroundColor: colors.accent,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.medium,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    continueButtonText: {
      ...Typography.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

export default BotDeclarationModal;
