/**
 * TableCenter Component
 *
 * Displays the draw and discard piles in the center of the virtual table.
 * Shows wild joker card at the base of the draw pile.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card as CardType } from '../../engine/types';
import { ThemeColors, Spacing, Typography } from '../../theme';
import Pile from './Pile';
import Card from './Card';

interface TableCenterProps {
  drawPile: CardType[];
  discardPile: CardType[];
  topDiscard: CardType | null;
  wildJokerCard?: CardType | null;
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  onDragDrawFromDeck?: (absoluteX: number) => void;
  onDragDrawFromDiscard?: (absoluteX: number) => void;
  isDrawPhase?: boolean;
  isHumanTurn?: boolean;
  style?: ViewStyle;
}

const TableCenter: React.FC<TableCenterProps> = ({
  drawPile,
  discardPile,
  topDiscard,
  wildJokerCard,
  onDrawFromDeck,
  onDrawFromDiscard,
  onDragDrawFromDeck,
  onDragDrawFromDiscard,
  isDrawPhase = false,
  isHumanTurn = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const canDraw = isDrawPhase && isHumanTurn;

  return (
    <View style={[styles.container, style]}>
      {/* Wild joker card display */}
      {wildJokerCard && (
        <View style={styles.wildJokerContainer}>
          <Card card={wildJokerCard} size="small" />
          <Text style={styles.wildLabel}>Wild</Text>
        </View>
      )}

      <Pile
        type="draw"
        cards={drawPile}
        onPress={canDraw ? onDrawFromDeck : undefined}
        onDragDraw={canDraw ? onDragDrawFromDeck : undefined}
        isDisabled={!canDraw}
        label="Draw"
      />

      <View style={styles.spacer} />

      <Pile
        type="discard"
        cards={discardPile}
        topCard={topDiscard}
        onPress={canDraw ? onDrawFromDiscard : undefined}
        onDragDraw={canDraw ? onDragDrawFromDiscard : undefined}
        isDisabled={!canDraw}
        label="Discard"
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    spacer: {
      width: Spacing.lg,
    },
    wildJokerContainer: {
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    wildLabel: {
      ...Typography.caption2,
      color: colors.warning,
      fontWeight: '600',
      marginTop: 2,
    },
  });

export default TableCenter;
