/**
 * DrawAnimation Component
 *
 * Shows an animated card moving between piles and player positions.
 * Used to visualize when bots draw or discard cards.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { Card as CardType, DrawSource } from '../../engine/types';
import Card from './Card';

interface DrawAnimationProps {
  card: CardType | null;
  source: DrawSource;
  animationType: 'draw' | 'discard';
  targetPosition: { x: number; y: number };
  sourcePosition: { x: number; y: number };
  onComplete: () => void;
  isVisible: boolean;
}

const ANIMATION_DURATION = 350;

const DrawAnimation: React.FC<DrawAnimationProps> = ({
  card,
  source,
  animationType,
  targetPosition,
  sourcePosition,
  onComplete,
  isVisible,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && card) {
      // Reset and run animation
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  }, [isVisible, card, animatedValue, onComplete]);

  if (!isVisible || !card) return null;

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [sourcePosition.x, targetPosition.x],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [sourcePosition.y, targetPosition.y],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 0.6],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  // Only show face down when drawing from deck
  // Discard animations and picking from discard pile show face up
  const isFaceDown = animationType === 'draw' && source === 'deck';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Card
        card={card}
        isFaceDown={isFaceDown}
        size="medium"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
});

export default DrawAnimation;
