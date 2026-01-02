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
import { ThemeColors, Spacing, BorderRadius, Typography, IconSize } from '../../theme';
import Icon from '../Icon';
import Card from './Card';

interface DeclarationModalProps {
  visible: boolean;
  cards: CardType[];
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
  const [selectedMeldIndex, setSelectedMeldIndex] = useState<number | null>(null);

  // Auto-arrange cards when modal opens
  useEffect(() => {
    if (visible && cards.length > 0) {
      const analysis = autoArrangeHand(cards);
      setMelds(analysis.melds);
      setDeadwood(analysis.deadwood);
      setSelectedMeldIndex(null);
    }
  }, [visible, cards]);

  const validation = useMemo(() => {
    return validateDeclaration(melds, deadwood);
  }, [melds, deadwood]);

  const hints = useMemo(() => {
    return getDeclarationHint(cards);
  }, [cards]);

  const handleAutoArrange = useCallback(() => {
    const analysis = autoArrangeHand(cards);
    setMelds(analysis.melds);
    setDeadwood(analysis.deadwood);
    setSelectedMeldIndex(null);
  }, [cards]);

  const handleDeclare = useCallback(() => {
    if (!validation.isValid) {
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
  }, [validation.isValid, melds, onDeclare]);

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
            { backgroundColor: validation.isValid ? colors.success + '20' : colors.destructive + '20' },
          ]}>
            <Icon
              name={validation.isValid ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
              size={IconSize.medium}
              color={validation.isValid ? colors.success : colors.destructive}
            />
            <Text style={[
              styles.validationText,
              { color: validation.isValid ? colors.success : colors.destructive },
            ]}>
              {validation.isValid ? 'Valid Declaration' : 'Invalid Declaration'}
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
            {hints.length > 0 && !validation.isValid && (
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
                { backgroundColor: validation.isValid ? colors.success : colors.warning },
              ]}
              onPress={handleDeclare}
            >
              <Icon
                name={validation.isValid ? 'checkmark.seal.fill' : 'exclamationmark.triangle.fill'}
                size={IconSize.medium}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                {validation.isValid ? 'Declare' : 'Declare (Penalty)'}
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
