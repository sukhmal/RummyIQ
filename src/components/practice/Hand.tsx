/**
 * Hand Component
 *
 * Displays the player's cards in a fan or row layout.
 * Supports card selection for discard/meld operations.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType } from '../../engine/types';
import { ThemeColors, Spacing } from '../../theme';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  selectedCardIds?: string[];
  onCardPress?: (card: CardType) => void;
  onCardSelect?: (cardIds: string[]) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  isDisabled?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const Hand: React.FC<HandProps> = ({
  cards,
  selectedCardIds = [],
  onCardPress,
  onCardSelect,
  selectionMode = 'none',
  isDisabled = false,
  cardSize = 'medium',
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [internalSelection, setInternalSelection] = useState<string[]>([]);

  const effectiveSelection = onCardSelect ? selectedCardIds : internalSelection;

  const handleCardPress = useCallback((card: CardType) => {
    if (isDisabled) return;

    // Direct press callback
    if (onCardPress) {
      onCardPress(card);
      return;
    }

    // Selection mode handling
    if (selectionMode === 'none') return;

    let newSelection: string[];

    if (selectionMode === 'single') {
      newSelection = effectiveSelection.includes(card.id) ? [] : [card.id];
    } else {
      // Multiple selection
      newSelection = effectiveSelection.includes(card.id)
        ? effectiveSelection.filter(id => id !== card.id)
        : [...effectiveSelection, card.id];
    }

    if (onCardSelect) {
      onCardSelect(newSelection);
    } else {
      setInternalSelection(newSelection);
    }
  }, [isDisabled, onCardPress, selectionMode, effectiveSelection, onCardSelect]);

  // Calculate card overlap based on number of cards and available space
  const getCardOffset = (index: number, totalCards: number): ViewStyle => {
    // Cards overlap when there are many (max 13 cards in hand)
    const overlapFactor = Math.max(0.3, 1 - (totalCards - 5) * 0.05);
    const cardWidth = cardSize === 'small' ? 42 : cardSize === 'large' ? 78 : 60;
    const offset = cardWidth * overlapFactor;

    return {
      marginLeft: index === 0 ? 0 : -cardWidth + offset,
      zIndex: index,
    };
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <View
              key={card.id}
              style={[styles.cardWrapper, getCardOffset(index, cards.length)]}
            >
              <Card
                card={card}
                isSelected={effectiveSelection.includes(card.id)}
                isDisabled={isDisabled}
                size={cardSize}
                onPress={handleCardPress}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    scrollContent: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    cardsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    cardWrapper: {
      // Individual card wrapper for positioning
    },
  });

export default Hand;
