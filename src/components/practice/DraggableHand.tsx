/**
 * DraggableHand Component
 *
 * Displays the player's cards with drag-to-reorder functionality.
 * Uses react-native-gesture-handler for smooth drag interactions.
 * Shows visual gaps between meld groups when sorted.
 * Cards within melds overlap significantly (half visible).
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType } from '../../engine/types';
import { getMeldType } from '../../engine/meld';
import { ThemeColors, Spacing, BorderRadius } from '../../theme';
import Card from './Card';

interface CardWithMeta extends CardType {
  groupIndex?: number;
}

interface DraggableHandProps {
  cards: CardWithMeta[];
  selectedCardIds?: string[];
  onCardPress?: (card: CardType, index: number) => void;
  onCardLongPress?: (card: CardType, index: number) => void;
  onCardsReordered?: (newOrder: CardWithMeta[]) => void;
  onCardDiscard?: (card: CardType) => void;
  onCardSelect?: (cardIds: string[]) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  isDisabled?: boolean;
  canDiscard?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const MELD_GAP = 8; // Gap between meld groups (Spacing.sm)
const CARD_OVERLAP = -30; // Cards within a meld overlap (matching final hands)
const DISCARD_THRESHOLD = -60; // Drag up this many pixels to discard

// Meld type labels and colors (matching final hands style)
const MELD_TYPE_INFO: Record<string, { label: string; colorKey: 'success' | 'accent' | 'warning' }> = {
  'pure-sequence': { label: 'Pure', colorKey: 'success' },
  'sequence': { label: 'Seq', colorKey: 'accent' },
  'set': { label: 'Set', colorKey: 'warning' },
};

const DraggableHand: React.FC<DraggableHandProps> = ({
  cards,
  selectedCardIds = [],
  onCardPress,
  onCardsReordered,
  onCardDiscard,
  onCardSelect,
  selectionMode = 'none',
  isDisabled = false,
  canDiscard = false,
  cardSize = 'medium',
  style,
}) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const cardPositionsRef = useRef<number[]>([]);

  // Reset drag states when cards change
  React.useEffect(() => {
    setDraggingIndex(null);
    setDragOffset({ x: 0, y: 0 });
    setDropTargetIndex(null);
  }, [cards.length]);

  // Card dimensions
  const cardWidth = cardSize === 'small' ? 42 : cardSize === 'large' ? 78 : 60;

  // Calculate meld info for each group (including card count for badge width)
  const meldGroupInfo = useMemo(() => {
    const groups: { [key: number]: CardWithMeta[] } = {};
    cards.forEach(card => {
      const gi = card.groupIndex ?? -1;
      if (gi >= 0) {
        if (!groups[gi]) groups[gi] = [];
        groups[gi].push(card);
      }
    });

    const info: { [key: number]: { type: string | null; label: string; colorKey: 'success' | 'accent' | 'warning' | 'tertiaryLabel'; cardCount: number } } = {};
    Object.keys(groups).forEach(key => {
      const groupIndex = parseInt(key, 10);
      const groupCards = groups[groupIndex];
      if (groupCards.length >= 3) {
        const meldType = getMeldType(groupCards);
        if (meldType && MELD_TYPE_INFO[meldType]) {
          info[groupIndex] = { type: meldType, ...MELD_TYPE_INFO[meldType], cardCount: groupCards.length };
        } else {
          info[groupIndex] = { type: null, label: 'Invalid', colorKey: 'tertiaryLabel', cardCount: groupCards.length };
        }
      }
    });
    return info;
  }, [cards]);

  // Count meld gaps
  const meldGapsCount = countMeldGaps(cards);
  const totalMeldGapsWidth = meldGapsCount * MELD_GAP;
  // Cards within melds overlap (negative value reduces width)
  const cardsWithOverlap = cards.length > 1 ? cards.length - 1 - meldGapsCount : 0;
  const totalOverlapWidth = cardsWithOverlap * CARD_OVERLAP; // negative value

  // Calculate total content width (cards overlap within melds, gaps between melds)
  const contentWidth = cards.length > 0
    ? cardWidth * cards.length + totalOverlapWidth + totalMeldGapsWidth
    : 0;

  // Calculate padding for centering
  const availableWidth = screenWidth;
  const paddingForCenter = Math.max(Spacing.sm, (availableWidth - contentWidth) / 2);

  // Calculate card positions for drop detection
  const getCardPositions = useCallback((): number[] => {
    const positions: number[] = [];
    let currentX = paddingForCenter;

    for (let i = 0; i < cards.length; i++) {
      positions.push(currentX);

      // Check if next card is in a different meld group
      const currentGroup = cards[i]?.groupIndex;
      const nextGroup = cards[i + 1]?.groupIndex;
      const hasMeldGapAfter = i < cards.length - 1 && (
        (currentGroup !== undefined && currentGroup >= 0 && nextGroup !== undefined && nextGroup >= 0 && currentGroup !== nextGroup) ||
        (currentGroup !== undefined && currentGroup >= 0 && (nextGroup === undefined || nextGroup < 0)) ||
        ((currentGroup === undefined || currentGroup < 0) && nextGroup !== undefined && nextGroup >= 0)
      );

      // Cards within melds overlap, gaps between melds
      currentX += cardWidth + (hasMeldGapAfter ? MELD_GAP : CARD_OVERLAP);
    }

    return positions;
  }, [cards, paddingForCenter, cardWidth]);

  // Find drop index based on drag position
  const findDropIndex = useCallback((dragX: number, currentIndex: number): number => {
    const positions = cardPositionsRef.current;
    if (positions.length === 0) return currentIndex;

    const currentCardCenter = positions[currentIndex] + dragX + cardWidth / 2;
    let dropIndex = currentIndex;

    if (dragX > 0) {
      // Dragging right - find the rightmost position we've passed
      for (let i = currentIndex + 1; i < positions.length; i++) {
        const targetCenter = positions[i] + cardWidth / 2;
        if (currentCardCenter > targetCenter) {
          dropIndex = i;
        } else {
          break; // Cards are in order, so stop when we haven't passed one
        }
      }
    } else if (dragX < 0) {
      // Dragging left - find the leftmost position we've passed
      for (let i = currentIndex - 1; i >= 0; i--) {
        const targetCenter = positions[i] + cardWidth / 2;
        if (currentCardCenter < targetCenter) {
          dropIndex = i;
        } else {
          break; // Cards are in order, so stop when we haven't passed one
        }
      }
    }

    return dropIndex;
  }, [cardWidth]);

  const handleCardPress = useCallback((card: CardType, index: number) => {
    if (isDisabled) return;

    ReactNativeHapticFeedback.trigger('selection', hapticOptions);

    if (onCardPress) {
      onCardPress(card, index);
      return;
    }

    if (selectionMode === 'none') return;

    let newSelection: string[];
    if (selectionMode === 'single') {
      newSelection = selectedCardIds.includes(card.id) ? [] : [card.id];
    } else {
      newSelection = selectedCardIds.includes(card.id)
        ? selectedCardIds.filter(id => id !== card.id)
        : [...selectedCardIds, card.id];
    }

    if (onCardSelect) {
      onCardSelect(newSelection);
    }
  }, [isDisabled, onCardPress, selectionMode, selectedCardIds, onCardSelect]);

  const handlePanGesture = useCallback((index: number) => (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY, state } = event.nativeEvent;

    if (state === State.BEGAN) {
      cardPositionsRef.current = getCardPositions();
      setDraggingIndex(index);
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
    } else if (state === State.ACTIVE) {
      setDragOffset({ x: translationX, y: translationY });
      const newDropIndex = findDropIndex(translationX, index);
      if (newDropIndex !== dropTargetIndex) {
        setDropTargetIndex(newDropIndex);
        if (newDropIndex !== index) {
          ReactNativeHapticFeedback.trigger('selection', hapticOptions);
        }
      }
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      if (state === State.END && draggingIndex !== null) {
        // Check if card was dragged up to discard
        if (translationY < DISCARD_THRESHOLD && canDiscard && onCardDiscard) {
          const card = cards[draggingIndex];
          onCardDiscard(card);
          ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
        } else if (dropTargetIndex !== null && dropTargetIndex !== draggingIndex && onCardsReordered) {
          // Normal reorder
          const newCards = [...cards];
          const [removed] = newCards.splice(draggingIndex, 1);

          // Determine the group index for the moved card based on where it's dropped
          // Adjust dropTargetIndex since we removed a card
          const adjustedDropIndex = dropTargetIndex > draggingIndex ? dropTargetIndex - 1 : dropTargetIndex;

          // Check neighboring cards at the drop position to determine if we're dropping into a group
          const leftNeighbor = adjustedDropIndex > 0 ? newCards[adjustedDropIndex - 1] : null;
          const rightNeighbor = adjustedDropIndex < newCards.length ? newCards[adjustedDropIndex] : null;

          let newGroupIndex = -1;

          // If both neighbors belong to the same group, join that group
          if (leftNeighbor?.groupIndex !== undefined && leftNeighbor.groupIndex >= 0 &&
              rightNeighbor?.groupIndex !== undefined && rightNeighbor.groupIndex >= 0 &&
              leftNeighbor.groupIndex === rightNeighbor.groupIndex) {
            newGroupIndex = leftNeighbor.groupIndex;
          }
          // If dropping at the end of a group (left neighbor has group, right doesn't or is different)
          else if (leftNeighbor?.groupIndex !== undefined && leftNeighbor.groupIndex >= 0 &&
                   (rightNeighbor?.groupIndex === undefined || rightNeighbor.groupIndex !== leftNeighbor.groupIndex)) {
            newGroupIndex = leftNeighbor.groupIndex;
          }
          // If dropping at the start of a group (right neighbor has group, left doesn't or is different)
          else if (rightNeighbor?.groupIndex !== undefined && rightNeighbor.groupIndex >= 0 &&
                   (leftNeighbor?.groupIndex === undefined || leftNeighbor.groupIndex !== rightNeighbor.groupIndex)) {
            newGroupIndex = rightNeighbor.groupIndex;
          }

          const movedCard = { ...removed, groupIndex: newGroupIndex };
          newCards.splice(adjustedDropIndex, 0, movedCard);
          onCardsReordered(newCards);
          ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        }
      }
      setDraggingIndex(null);
      setDragOffset({ x: 0, y: 0 });
      setDropTargetIndex(null);
    }
  }, [cards, draggingIndex, dropTargetIndex, findDropIndex, getCardPositions, onCardsReordered, canDiscard, onCardDiscard]);

  const handleTapStateChange = useCallback((card: CardType, index: number) => (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      handleCardPress(card, index);
    }
  }, [handleCardPress]);

  // Update positions on layout
  const handleLayout = useCallback((_event: LayoutChangeEvent) => {
    cardPositionsRef.current = getCardPositions();
  }, [getCardPositions]);

  // Check if this is the last card in a meld group
  const isLastInGroup = useCallback((index: number): boolean => {
    const card = cards[index];
    const nextCard = cards[index + 1];
    if (card.groupIndex === undefined || card.groupIndex < 0) return false;
    if (!nextCard) return true; // Last card in array
    return nextCard.groupIndex !== card.groupIndex;
  }, [cards]);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isDragging = draggingIndex === index;
          const isDropTarget = dropTargetIndex === index && draggingIndex !== null && draggingIndex !== index;

          // Check if we need a meld gap before this card (different meld group than previous)
          const prevCard = index > 0 ? cards[index - 1] : null;
          const cardGroup = card.groupIndex ?? -1;
          const prevGroup = prevCard?.groupIndex ?? -1;
          // Show meld gap when: both are valid groups and different, OR one is grouped and other is not
          const showMeldGap = prevCard && (
            (cardGroup >= 0 && prevGroup >= 0 && cardGroup !== prevGroup) ||
            (cardGroup >= 0 && prevGroup < 0) ||
            (cardGroup < 0 && prevGroup >= 0)
          );

          const marginLeft = index === 0
            ? paddingForCenter
            : showMeldGap
              ? MELD_GAP
              : CARD_OVERLAP;

          // Check if this is the last card in a meld group and we should show badge
          const groupIdx = card.groupIndex ?? -1;
          const showMeldBadge = isLastInGroup(index) && groupIdx >= 0;
          const meldInfo = showMeldBadge ? meldGroupInfo[groupIdx] : null;

          return (
            <PanGestureHandler
              key={card.id}
              onGestureEvent={handlePanGesture(index)}
              onHandlerStateChange={handlePanGesture(index)}
              enabled={!!onCardsReordered || !!onCardDiscard}
              activeOffsetX={[-10, 10]}
              activeOffsetY={[-10, 10]}
            >
                <View
                style={[
                  styles.cardWrapper,
                  // Dynamic styles for drag behavior - marginLeft for spacing, zIndex/transform for drag feedback
                  // eslint-disable-next-line react-native/no-inline-styles
                  { marginLeft, zIndex: isDragging ? 1000 : index },
                  isDragging && {
                    transform: [
                      { translateX: dragOffset.x },
                      { translateY: dragOffset.y - 15 },
                      { scale: 1.08 },
                    ],
                  },
                  isDropTarget && { transform: [{ scale: 0.95 }] },
                  isDragging && styles.draggingCard,
                ]}
              >
                <TapGestureHandler
                  onHandlerStateChange={handleTapStateChange(card, index)}
                  enabled={!isDisabled}
                >
                  <View>
                    <Card
                      card={card}
                      isSelected={isSelected || isDragging}
                      isDisabled={isDisabled && !isDragging}
                      size={cardSize}
                    />
                    {/* Meld type badge at bottom spanning entire meld (matching final hands style) */}
                    {meldInfo && (() => {
                      // Calculate meld width: first card full width + remaining cards with overlap
                      const meldWidth = cardWidth + (meldInfo.cardCount - 1) * (cardWidth + CARD_OVERLAP);
                      // Badge extends left from the last card to cover the entire meld
                      const leftOffset = -(meldWidth - cardWidth);
                      return (
                        <View style={[
                          styles.meldBadgeOverlay,
                          {
                            backgroundColor: colors[meldInfo.colorKey as keyof ThemeColors] as string,
                            width: meldWidth,
                            left: leftOffset,
                          },
                        ]}>
                          <Text style={styles.meldBadgeText}>{meldInfo.label}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </TapGestureHandler>
              </View>
            </PanGestureHandler>
          );
        })}
      </View>
    </View>
  );
};

// Count number of meld group transitions (gaps needed)
const countMeldGaps = (cards: CardWithMeta[]): number => {
  let gaps = 0;
  for (let i = 1; i < cards.length; i++) {
    const currentGroup = cards[i]?.groupIndex ?? -1;
    const prevGroup = cards[i - 1]?.groupIndex ?? -1;
    // Count gap when: both are valid groups and different, OR one is grouped and other is not
    if (
      (currentGroup >= 0 && prevGroup >= 0 && currentGroup !== prevGroup) ||
      (currentGroup >= 0 && prevGroup < 0) ||
      (currentGroup < 0 && prevGroup >= 0)
    ) {
      gaps++;
    }
  }
  return gaps;
};

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    cardsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingVertical: Spacing.xs,
    },
    cardWrapper: {
      // Individual card wrapper for positioning
    },
    draggingCard: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    meldBadgeOverlay: {
      position: 'absolute',
      bottom: 0,
      paddingVertical: 3,
      alignItems: 'center',
      borderBottomLeftRadius: BorderRadius.small,
      borderBottomRightRadius: BorderRadius.small,
    },
    meldBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

export default DraggableHand;
