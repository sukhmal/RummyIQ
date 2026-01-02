/**
 * Pile Component
 *
 * Displays draw pile (face-down) or discard pile (face-up).
 * Shows card count and supports tap to draw.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType } from '../../engine/types';
import { ThemeColors, Spacing, BorderRadius, Typography } from '../../theme';
import Card from './Card';

interface PileProps {
  type: 'draw' | 'discard';
  cards: CardType[];
  topCard?: CardType | null;
  onPress?: () => void;
  isDisabled?: boolean;
  showCount?: boolean;
  label?: string;
  style?: ViewStyle;
}

const Pile: React.FC<PileProps> = ({
  type,
  cards,
  topCard,
  onPress,
  isDisabled = false,
  showCount = true,
  label,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cardCount = cards.length;
  const displayCard = type === 'discard' ? topCard : null;

  const renderPileStack = () => {
    // Show stacked card effect for draw pile
    if (type === 'draw') {
      const stackDepth = Math.min(3, Math.floor(cardCount / 10) + 1);

      return (
        <View style={styles.stackContainer}>
          {Array.from({ length: stackDepth }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stackCard,
                {
                  bottom: index * 2,
                  left: index * 1,
                  zIndex: stackDepth - index,
                },
              ]}
            >
              <Card
                card={cards[0] || { id: 'placeholder', suit: 'spades', rank: 'A', jokerType: null, value: 0 }}
                isFaceDown
                size="medium"
              />
            </View>
          ))}
        </View>
      );
    }

    // Discard pile - show top card face up
    if (displayCard) {
      return (
        <Card
          card={displayCard}
          size="medium"
        />
      );
    }

    // Empty discard pile
    return (
      <View style={styles.emptyPile}>
        <Text style={styles.emptyText}>Empty</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={isDisabled || !onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${label || type} pile${cardCount > 0 ? `, ${cardCount} cards` : ', empty'}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={styles.pileWrapper}>
        {renderPileStack()}
      </View>

      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {showCount && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cardCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    pileWrapper: {
      width: 70,
      height: 94,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stackContainer: {
      width: 60,
      height: 84,
      position: 'relative',
    },
    stackCard: {
      position: 'absolute',
    },
    emptyPile: {
      width: 60,
      height: 84,
      borderRadius: BorderRadius.small,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.separator,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    emptyText: {
      ...Typography.caption2,
      color: colors.tertiaryLabel,
    },
    label: {
      ...Typography.caption1,
      color: colors.secondaryLabel,
      marginTop: Spacing.xs,
    },
    countBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xs,
    },
    countText: {
      ...Typography.caption2,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default Pile;
