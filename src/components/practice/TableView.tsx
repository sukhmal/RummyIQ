/**
 * TableView Component
 *
 * Displays an oval virtual table with players positioned around it.
 * Human player is always at the bottom, others counter-clockwise.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PracticePlayer, Card as CardType } from '../../engine/types';
import { ThemeColors, Spacing } from '../../theme';
import PlayerSeat from './PlayerSeat';
import TableCenter from './TableCenter';

interface TableViewProps {
  players: PracticePlayer[];
  humanPlayerId: string;
  currentPlayerIndex: number;
  dealerIndex: number;
  scores: { [playerId: string]: number };
  hands: { [playerId: string]: CardType[] };
  drawPile: CardType[];
  discardPile: CardType[];
  topDiscard: CardType | null;
  wildJokerCard?: CardType | null;
  turnPhase: 'draw' | 'discard';
  currentPlayerName: string;
  isHumanTurn: boolean;
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  onDragDrawFromDeck?: (absoluteX: number) => void;
  onDragDrawFromDiscard?: (absoluteX: number) => void;
  style?: ViewStyle;
}

// Table insets - shrink table from sides, move down
const TABLE_INSET_LEFT = 100;   // More horizontal shrink
const TABLE_INSET_RIGHT = 100;
const TABLE_INSET_TOP = 100;    // Move table down to avoid top player overlap
const TABLE_INSET_BOTTOM = 8;

// Get player positions around an ellipse (outside the table)
const getPlayerPositions = (
  playerCount: number,
  humanIndex: number,
  tableWidth: number,
  tableHeight: number
) => {
  const positions: { x: number; y: number }[] = [];
  const centerX = tableWidth / 2;
  const centerY = tableHeight / 2 + 46; // Offset to match table position (moved down)

  // Semi-axes - position avatars outside table perimeter with padding
  const a = tableWidth / 2 - 45; // horizontal (further from table edge)
  const b = tableHeight / 2 - 10; // vertical (further from table edge)

  for (let i = 0; i < playerCount; i++) {
    // Calculate visual index (human at bottom = 0)
    const visualIndex = (i - humanIndex + playerCount) % playerCount;

    // Angle: start from bottom (PI/2 in screen coords where Y is down), go counter-clockwise
    const angleStep = (2 * Math.PI) / playerCount;
    const angle = Math.PI / 2 - visualIndex * angleStep;

    positions.push({
      x: centerX + a * Math.cos(angle),
      y: centerY + b * Math.sin(angle),
    });
  }

  return positions;
};

const TableView: React.FC<TableViewProps> = ({
  players,
  humanPlayerId,
  currentPlayerIndex,
  dealerIndex,
  scores,
  hands,
  drawPile,
  discardPile,
  topDiscard,
  wildJokerCard,
  turnPhase,
  currentPlayerName: _currentPlayerName,
  isHumanTurn,
  onDrawFromDeck,
  onDrawFromDiscard,
  onDragDrawFromDeck,
  onDragDrawFromDiscard,
  style,
}) => {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Calculate table dimensions - maximize usage
  const tableWidth = screenWidth - Spacing.sm * 2;
  const tableHeight = screenHeight * 0.55; // More vertical space

  const styles = useMemo(
    () => createStyles(colors, tableWidth, tableHeight),
    [colors, tableWidth, tableHeight]
  );

  // Find human player index
  const humanIndex = players.findIndex(p => p.id === humanPlayerId);

  // Calculate positions for all players
  const positions = useMemo(
    () => getPlayerPositions(players.length, humanIndex, tableWidth, tableHeight),
    [players.length, humanIndex, tableWidth, tableHeight]
  );

  return (
    <View style={[styles.container, style]}>
      {/* Oval table surface */}
      <View style={styles.tableSurface}>
        {/* Center piles with wild joker */}
        <TableCenter
          drawPile={drawPile}
          discardPile={discardPile}
          topDiscard={topDiscard}
          wildJokerCard={wildJokerCard}
          onDrawFromDeck={onDrawFromDeck}
          onDrawFromDiscard={onDrawFromDiscard}
          onDragDrawFromDeck={onDragDrawFromDeck}
          onDragDrawFromDiscard={onDragDrawFromDiscard}
          isDrawPhase={turnPhase === 'draw'}
          isHumanTurn={isHumanTurn}
        />
      </View>

      {/* Player seats positioned around the ellipse (skip human - shown in hand area) */}
      {players.map((player, index) => {
        const isHuman = player.id === humanPlayerId;

        // Skip human player - their avatar is in the hand area
        if (isHuman) return null;

        const position = positions[index];
        const isCurrentTurn = index === currentPlayerIndex;
        const isDealer = index === dealerIndex;
        const playerScore = scores[player.id] || 0;
        const cardCount = hands[player.id]?.length || 0;

        return (
          <PlayerSeat
            key={player.id}
            player={player}
            score={playerScore}
            isCurrentTurn={isCurrentTurn}
            isDealer={isDealer}
            isHuman={false}
            cardCount={cardCount}
            style={{
              ...styles.playerSeat,
              left: position.x - 35,
              top: position.y - 35,
            }}
          />
        );
      })}
    </View>
  );
};

const createStyles = (
  colors: ThemeColors,
  tableWidth: number,
  tableHeight: number
) =>
  StyleSheet.create({
    container: {
      width: tableWidth,
      height: tableHeight,
      alignSelf: 'center',
    },
    tableSurface: {
      position: 'absolute',
      left: TABLE_INSET_LEFT,
      right: TABLE_INSET_RIGHT,
      top: TABLE_INSET_TOP,
      bottom: TABLE_INSET_BOTTOM,
      borderRadius: (tableHeight - TABLE_INSET_TOP - TABLE_INSET_BOTTOM) / 2,
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerSeat: {
      position: 'absolute',
    },
  });

export default TableView;
