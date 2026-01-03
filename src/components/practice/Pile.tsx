/**
 * Pile Component
 *
 * Displays draw pile (face-down) or discard pile (face-up).
 * Shows card count and supports tap to draw.
 * Includes visual feedback when tappable.
 */

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType } from '../../engine/types';
import { ThemeColors, Spacing, BorderRadius, Typography } from '../../theme';
import Card from './Card';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const DRAW_THRESHOLD = 50; // Drag down this many pixels to draw

interface PileProps {
  type: 'draw' | 'discard';
  cards: CardType[];
  topCard?: CardType | null;
  onPress?: () => void;
  onDragDraw?: (absoluteX: number) => void; // Called when card is dragged to draw, passes X position
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
  onDragDraw,
  isDisabled = false,
  showCount = true,
  label,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cardCount = cards.length;
  const displayCard = type === 'discard' ? topCard : null;
  const canTap = !isDisabled && !!onPress;

  // Drag state for drag-to-draw
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pulsing animation for tappable piles
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (canTap) {
      // Single looping animation for both pulse and glow
      // Use JS driver since shadowOpacity doesn't support native driver
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [canTap, pulseAnim, glowAnim]);

  const handlePress = () => {
    if (onPress) {
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
      onPress();
    }
  };

  // Handle drag gesture for drag-to-draw
  const handlePanGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY, absoluteX, state } = event.nativeEvent;

    if (state === State.BEGAN) {
      setIsDragging(true);
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    } else if (state === State.ACTIVE) {
      setDragOffset({ x: translationX, y: translationY });
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      if (state === State.END && translationY > DRAW_THRESHOLD) {
        // Dragged down past threshold - trigger draw
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
        if (onDragDraw) {
          // Use drag draw callback with position for insertion
          onDragDraw(absoluteX);
        } else if (onPress) {
          // Fallback to simple press
          onPress();
        }
      }
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [onPress, onDragDraw]);

  const glowStyle = canTap ? {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim,
    shadowRadius: 12,
  } : {};

  // Get the card underneath the top card (for reveal during drag)
  const getSecondCard = (): CardType | null => {
    if (type === 'discard') {
      // Return the second card in discard pile
      return cards.length > 1 ? cards[cards.length - 2] : null;
    }
    // For draw pile, we just show another face-down card
    return cards.length > 1 ? cards[1] : null;
  };

  const secondCard = getSecondCard();

  // Render the base/underlying cards (static, shown when dragging)
  const renderBaseStack = () => {
    if (type === 'draw') {
      const stackDepth = Math.min(3, Math.floor(cardCount / 10) + 1);
      // When dragging, we show one less card in the stack
      const visibleDepth = isDragging ? Math.max(1, stackDepth - 1) : stackDepth;

      return (
        <View style={styles.stackContainer}>
          {Array.from({ length: visibleDepth }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stackCard,
                {
                  bottom: index * 2,
                  left: index * 1,
                  zIndex: visibleDepth - index,
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

    // Discard pile - when dragging, show the card underneath
    if (isDragging && secondCard) {
      return (
        <Card
          card={secondCard}
          size="medium"
        />
      );
    }

    // Not dragging - show top card normally
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

  // Render the dragging card (top card that moves with finger)
  const renderDraggingCard = () => {
    if (!isDragging) return null;

    if (type === 'draw') {
      return (
        <View
          style={[
            styles.draggingCardContainer,
            {
              transform: [
                { translateX: dragOffset.x },
                { translateY: dragOffset.y },
              ],
            },
          ]}
        >
          <Card
            card={cards[0] || { id: 'placeholder', suit: 'spades', rank: 'A', jokerType: null, value: 0 }}
            isFaceDown
            size="medium"
          />
        </View>
      );
    }

    // Discard pile - drag the top card
    if (displayCard) {
      return (
        <View
          style={[
            styles.draggingCardContainer,
            {
              transform: [
                { translateX: dragOffset.x },
                { translateY: dragOffset.y },
              ],
            },
          ]}
        >
          <Card
            card={displayCard}
            size="medium"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <PanGestureHandler
      onGestureEvent={handlePanGesture}
      onHandlerStateChange={handlePanGesture}
      enabled={canTap}
      activeOffsetY={[0, 10]}
    >
      <View style={[styles.container, style]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={!canTap}
          activeOpacity={0.7}
          accessibilityLabel={`${label || type} pile${cardCount > 0 ? `, ${cardCount} cards` : ', empty'}${canTap ? ', tap or drag to draw' : ''}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canTap }}
        >
          <Animated.View
            style={[
              styles.pileWrapper,
              { transform: [{ scale: isDragging ? 1 : pulseAnim }] },
              glowStyle,
            ]}
          >
            {/* Base stack - static cards underneath */}
            {renderBaseStack()}

          </Animated.View>

          {label && (
            <Text style={[styles.label, canTap && styles.labelActive]}>{label}</Text>
          )}

          {showCount && (
            <View style={[styles.countBadge, canTap && styles.countBadgeActive]}>
              <Text style={styles.countText}>{cardCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Dragging card - follows finger */}
        {renderDraggingCard()}
      </View>
    </PanGestureHandler>
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
    countBadgeActive: {
      backgroundColor: colors.success,
    },
    labelActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    draggingCardContainer: {
      position: 'absolute',
      top: 0,
      left: 5,
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  });

export default Pile;
