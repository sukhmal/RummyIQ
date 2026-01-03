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
  size?: 'tiny' | 'small' | 'medium' | 'large';
  onPress?: (card: CardType) => void;
  onLongPress?: (card: CardType) => void;
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
  onLongPress,
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

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(card);
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
      <View style={styles.cardFace}>
        {/* Top-left corner */}
        <View style={styles.topLeftCorner}>
          <Text style={[styles.rankText, { color: textColor }]}>{card.rank}</Text>
          <Text style={[styles.smallSuit, { color: textColor }]}>{symbol}</Text>
        </View>

        {/* Center suit */}
        <View style={styles.centerContainer}>
          <Text style={[styles.centerSuit, { color: textColor }]}>{symbol}</Text>
        </View>

        {/* Bottom-right corner (upside down) */}
        <View style={styles.bottomRightCorner}>
          <Text style={[styles.smallSuit, { color: textColor }]}>{symbol}</Text>
          <Text style={[styles.rankText, { color: textColor }]}>{card.rank}</Text>
        </View>

        {/* Wild joker badge */}
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
      onLongPress={handleLongPress}
      delayLongPress={300}
      disabled={isDisabled || (!onPress && !onLongPress)}
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

const createStyles = (colors: ThemeColors, size: 'tiny' | 'small' | 'medium' | 'large') => {
  const sizeMultiplier = size === 'tiny' ? 0.5 : size === 'small' ? 0.7 : size === 'large' ? 1.3 : 1;
  const cardWidth = 60 * sizeMultiplier;
  const cardHeight = 84 * sizeMultiplier;

  return StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      height: cardHeight,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.small,
      borderWidth: 1,
      borderColor: '#DDD',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    selectedCard: {
      borderColor: colors.accent,
      borderWidth: 2,
      transform: [{ translateY: -8 }],
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    disabledCard: {
      opacity: 0.5,
    },
    cardBack: {
      flex: 1,
      backgroundColor: '#1a237e',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 3,
      borderRadius: BorderRadius.small - 1,
    },
    cardBackPattern: {
      flex: 1,
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 3,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    cardFace: {
      flex: 1,
      position: 'relative',
    },
    topLeftCorner: {
      position: 'absolute',
      top: 3,
      left: 4,
      alignItems: 'center',
    },
    bottomRightCorner: {
      position: 'absolute',
      bottom: 3,
      right: 4,
      alignItems: 'center',
      transform: [{ rotate: '180deg' }],
    },
    rankText: {
      fontSize: 12 * sizeMultiplier,
      fontWeight: '700',
      lineHeight: 14 * sizeMultiplier,
    },
    smallSuit: {
      fontSize: 10 * sizeMultiplier,
      lineHeight: 12 * sizeMultiplier,
      marginTop: -2,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerSuit: {
      fontSize: 28 * sizeMultiplier,
    },
    jokerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    jokerText: {
      fontSize: 22 * sizeMultiplier,
      fontWeight: '700',
    },
    jokerLabel: {
      fontSize: 7 * sizeMultiplier,
      fontWeight: '600',
      letterSpacing: 1,
      marginTop: 2,
    },
    wildBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 14 * sizeMultiplier,
      height: 14 * sizeMultiplier,
      borderRadius: 7 * sizeMultiplier,
      backgroundColor: colors.warning,
      justifyContent: 'center',
      alignItems: 'center',
    },
    wildBadgeText: {
      fontSize: 8 * sizeMultiplier,
      fontWeight: '700',
      color: '#000',
    },
  });
};

export default Card;
