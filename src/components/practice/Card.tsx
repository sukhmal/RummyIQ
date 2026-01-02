/**
 * Card Component
 *
 * Visual representation of a playing card with suit and rank.
 * Supports selection state and flip animation.
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
import { Card as CardType, Suit } from '../../engine/types';
import { ThemeColors, BorderRadius } from '../../theme';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isFaceDown?: boolean;
  isDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: (card: CardType) => void;
  style?: ViewStyle;
}

const SUIT_SYMBOLS: { [key in Suit]: string } = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isFaceDown = false,
  isDisabled = false,
  size = 'medium',
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isPrintedJoker = card.jokerType === 'printed';
  const isWildJoker = card.jokerType === 'wild';

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress(card);
    }
  };

  const getCardContent = () => {
    if (isFaceDown) {
      return (
        <View style={styles.cardBack}>
          <View style={styles.cardBackPattern} />
        </View>
      );
    }

    if (isPrintedJoker) {
      return (
        <View style={styles.jokerContent}>
          <Text style={[styles.jokerText, { color: colors.destructive }]}>J</Text>
          <Text style={[styles.jokerLabel, { color: colors.destructive }]}>JOKER</Text>
        </View>
      );
    }

    const textColor = isRed ? '#D32F2F' : '#212121';
    const symbol = SUIT_SYMBOLS[card.suit];

    return (
      <View style={styles.cardContent}>
        <View style={styles.cardCorner}>
          <Text style={[styles.rankText, { color: textColor }]}>{card.rank}</Text>
          <Text style={[styles.suitText, { color: textColor }]}>{symbol}</Text>
        </View>
        <Text style={[styles.centerSuit, { color: textColor }]}>{symbol}</Text>
        <View style={[styles.cardCorner, styles.bottomCorner]}>
          <Text style={[styles.rankText, { color: textColor }]}>{card.rank}</Text>
          <Text style={[styles.suitText, { color: textColor }]}>{symbol}</Text>
        </View>
        {isWildJoker && (
          <View style={styles.wildBadge}>
            <Text style={styles.wildBadgeText}>W</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        isSelected && styles.selectedCard,
        isDisabled && styles.disabledCard,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled || !onPress}
      activeOpacity={0.8}
      accessibilityLabel={
        isFaceDown
          ? 'Face down card'
          : isPrintedJoker
          ? 'Joker'
          : `${card.rank} of ${card.suit}${isWildJoker ? ' (wild)' : ''}`
      }
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
    >
      {getCardContent()}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors, size: 'small' | 'medium' | 'large') => {
  const sizeMultiplier = size === 'small' ? 0.7 : size === 'large' ? 1.3 : 1;
  const cardWidth = 60 * sizeMultiplier;
  const cardHeight = 84 * sizeMultiplier;

  return StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      height: cardHeight,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.small,
      borderWidth: 1,
      borderColor: colors.separator,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
    },
    selectedCard: {
      borderColor: colors.accent,
      borderWidth: 2,
      transform: [{ translateY: -8 }],
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
    disabledCard: {
      opacity: 0.5,
    },
    cardBack: {
      flex: 1,
      backgroundColor: '#1a237e',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    cardBackPattern: {
      flex: 1,
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardContent: {
      flex: 1,
      padding: 4,
    },
    cardCorner: {
      alignItems: 'center',
    },
    bottomCorner: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      transform: [{ rotate: '180deg' }],
    },
    rankText: {
      fontSize: 14 * sizeMultiplier,
      fontWeight: '700',
      lineHeight: 16 * sizeMultiplier,
    },
    suitText: {
      fontSize: 12 * sizeMultiplier,
      lineHeight: 14 * sizeMultiplier,
    },
    centerSuit: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [
        { translateX: -12 * sizeMultiplier },
        { translateY: -12 * sizeMultiplier },
      ],
      fontSize: 24 * sizeMultiplier,
    },
    jokerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    jokerText: {
      fontSize: 24 * sizeMultiplier,
      fontWeight: '700',
    },
    jokerLabel: {
      fontSize: 8 * sizeMultiplier,
      fontWeight: '600',
      letterSpacing: 1,
    },
    wildBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 16 * sizeMultiplier,
      height: 16 * sizeMultiplier,
      borderRadius: 8 * sizeMultiplier,
      backgroundColor: colors.warning,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wildBadgeText: {
      fontSize: 10 * sizeMultiplier,
      fontWeight: '700',
      color: '#000',
    },
  });
};

export default Card;
