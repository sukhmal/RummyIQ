/**
 * PracticeGameScreen
 *
 * Main game screen for practice mode.
 * Shows player hands, piles, and game actions.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { Card as CardType } from '../../engine/types';
import { ThemeColors, Typography, Spacing, BorderRadius } from '../../theme';
import { Hand, Pile, OpponentHand, ActionBar, DeclarationModal } from '../../components/practice';
import Icon from '../../components/Icon';

const PracticeGameScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const {
    gameState,
    drawCard,
    discardCard,
    declare,
    drop,
    isBotTurn,
    executeBotTurn,
    getPlayerHand,
    getCurrentPlayer,
    getTopDiscard,
    canDraw,
    canDiscard,
  } = usePracticeGame();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  const currentPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer?.id === 'human';
  const myHand = getPlayerHand('human');
  const topDiscard = getTopDiscard();

  // Execute bot turn when it's a bot's turn
  useEffect(() => {
    if (isBotTurn() && gameState?.currentRound?.phase === 'playing') {
      executeBotTurn();
    }
  }, [isBotTurn, executeBotTurn, gameState?.currentRound?.currentPlayerIndex, gameState?.currentRound?.turnPhase, gameState?.currentRound?.phase]);

  // Handle game end
  useEffect(() => {
    if (gameState?.gamePhase === 'ended') {
      navigation.replace('PracticeHistory');
    }
  }, [gameState?.gamePhase, navigation]);

  // Handle round end
  useEffect(() => {
    if (gameState?.currentRound?.phase === 'ended' && gameState?.gamePhase === 'playing') {
      // Show round result and start new round
      const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
      Alert.alert(
        'Round Complete',
        `${lastResult.winnerName} ${lastResult.declarationType === 'valid' ? 'declared' : 'dropped/invalid'}`,
        [
          {
            text: 'Next Round',
            onPress: () => {
              // Start next round would be called here
            },
          },
        ]
      );
    }
  }, [gameState?.currentRound?.phase, gameState?.gamePhase, gameState?.roundResults]);

  const handleCardPress = useCallback((card: CardType) => {
    if (!isMyTurn || !canDiscard()) return;
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  }, [isMyTurn, canDiscard, selectedCardId]);

  const handleAction = useCallback(async (action: string) => {
    switch (action) {
      case 'draw-deck':
        if (canDraw()) {
          await drawCard('deck');
        }
        break;
      case 'draw-discard':
        if (canDraw() && topDiscard) {
          await drawCard('discard');
        }
        break;
      case 'discard':
        if (canDiscard() && selectedCardId) {
          const card = myHand.find(c => c.id === selectedCardId);
          if (card) {
            await discardCard(card);
            setSelectedCardId(null);
          }
        }
        break;
      case 'declare':
        setShowDeclarationModal(true);
        break;
      case 'drop':
        Alert.alert(
          'Drop',
          `Are you sure you want to drop? You will receive ${canDraw() ? '25' : '50'} points.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Drop', style: 'destructive', onPress: () => drop() },
          ]
        );
        break;
    }
  }, [canDraw, canDiscard, drawCard, discardCard, drop, selectedCardId, myHand, topDiscard]);

  const handleDeclare = useCallback(async (melds: any[]) => {
    setShowDeclarationModal(false);
    await declare(melds);
  }, [declare]);

  if (!gameState?.currentRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const round = gameState.currentRound;
  const opponents = gameState.players.filter(p => p.id !== 'human');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Game Info Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Round</Text>
          <Text style={styles.infoValue}>{round.roundNumber}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Your Score</Text>
          <Text style={styles.infoValue}>{gameState.scores.human || 0}</Text>
        </View>
        {round.wildJokerCard && (
          <View style={styles.wildJokerBadge}>
            <Text style={styles.wildJokerLabel}>Wild: {round.wildJokerCard.rank}</Text>
          </View>
        )}
      </View>

      {/* Opponents */}
      <View style={styles.opponentsContainer}>
        {opponents.map((player) => (
          <OpponentHand
            key={player.id}
            player={player}
            cardCount={round.hands[player.id]?.length || 0}
            isCurrentTurn={currentPlayer?.id === player.id}
            isDealer={gameState.activePlayers[round.dealerIndex] === player.id}
            score={gameState.scores[player.id] || 0}
            style={styles.opponentHand}
          />
        ))}
      </View>

      {/* Game Area - Piles */}
      <View style={styles.gameArea}>
        <View style={styles.pilesContainer}>
          <Pile
            type="draw"
            cards={round.drawPile}
            label="Deck"
            onPress={isMyTurn && canDraw() ? () => handleAction('draw-deck') : undefined}
            isDisabled={!isMyTurn || !canDraw()}
          />
          <View style={styles.pilesSpacer} />
          <Pile
            type="discard"
            cards={round.discardPile}
            topCard={topDiscard}
            label="Discard"
            onPress={isMyTurn && canDraw() && topDiscard ? () => handleAction('draw-discard') : undefined}
            isDisabled={!isMyTurn || !canDraw() || !topDiscard}
          />
        </View>

        {/* Turn indicator */}
        <View style={styles.turnIndicator}>
          <Icon
            name={isMyTurn ? 'hand.point.up.fill' : 'hourglass'}
            size={16}
            color={isMyTurn ? colors.success : colors.secondaryLabel}
          />
          <Text style={[styles.turnText, isMyTurn && { color: colors.success }]}>
            {isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
          </Text>
        </View>
      </View>

      {/* Player's Hand */}
      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>
          Your Hand ({myHand.length} cards)
        </Text>
        <Hand
          cards={myHand}
          selectedCardIds={selectedCardId ? [selectedCardId] : []}
          onCardPress={handleCardPress}
          selectionMode="single"
          isDisabled={!isMyTurn || !canDiscard()}
          cardSize="medium"
        />
      </View>

      {/* Action Bar */}
      <ActionBar
        turnPhase={round.turnPhase}
        canDeclare={canDiscard() && myHand.length === 14}
        canDrop={true}
        hasDiscardCard={!!topDiscard}
        selectedCardCount={selectedCardId ? 1 : 0}
        onAction={handleAction}
        isDisabled={!isMyTurn}
      />

      {/* Declaration Modal */}
      <DeclarationModal
        visible={showDeclarationModal}
        cards={myHand}
        onDeclare={handleDeclare}
        onCancel={() => setShowDeclarationModal(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...Typography.body,
      color: colors.secondaryLabel,
    },
    infoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    infoItem: {
      alignItems: 'center',
    },
    infoLabel: {
      ...Typography.caption2,
      color: colors.tertiaryLabel,
    },
    infoValue: {
      ...Typography.headline,
      color: colors.label,
    },
    wildJokerBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.small,
    },
    wildJokerLabel: {
      ...Typography.footnote,
      color: colors.warning,
      fontWeight: '600',
    },
    opponentsContainer: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
    },
    opponentHand: {
      marginBottom: Spacing.xs,
    },
    gameArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pilesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pilesSpacer: {
      width: Spacing.xl,
    },
    turnIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
      gap: Spacing.xs,
    },
    turnText: {
      ...Typography.subheadline,
      color: colors.secondaryLabel,
    },
    handContainer: {
      backgroundColor: colors.cardBackground,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    handLabel: {
      ...Typography.caption1,
      color: colors.secondaryLabel,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
    },
  });

export default PracticeGameScreen;
