/**
 * PracticeGameScreen
 *
 * Main game screen for practice mode.
 * Shows player hands, piles, and game actions.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from '../../context/ThemeContext';
import { usePracticeGame } from '../../context/PracticeGameContext';
import { Card as CardType, DrawSource, Meld, PracticePlayer } from '../../engine/types';
import { smartSortWithGroups, CardWithGroup } from '../../engine/cardSorting';
import { autoArrangeHand } from '../../engine/declaration';
import { ThemeColors, Typography, Spacing, BorderRadius } from '../../theme';
import Icon from '../../components/Icon';
import { DraggableHand, ActionBar, DeclarationModal, TableView, DrawAnimation, BotDeclarationModal } from '../../components/practice';

// Type for bot declaration info in the queue
interface BotDeclarationInfo {
  player: PracticePlayer;
  hand: CardType[];
  melds: Meld[];
  deadwood: CardType[];
  isValid: boolean;
}

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

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [orderedCards, setOrderedCards] = useState<CardWithGroup[]>([]); // Custom card ordering with meld groups

  // Bot declaration modal state - queue of all bot hands to show
  const [botDeclarationQueue, setBotDeclarationQueue] = useState<BotDeclarationInfo[]>([]);
  const [currentBotDeclaration, setCurrentBotDeclaration] = useState<BotDeclarationInfo | null>(null);
  const lastRoundEndRef = useRef<number | null>(null);

  // Card animation state (for both draw and discard)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [cardAnimation, setCardAnimation] = useState<{
    isVisible: boolean;
    card: CardType | null;
    animationType: 'draw' | 'discard';
    source: DrawSource;
    playerIndex: number;
  }>({ isVisible: false, card: null, animationType: 'draw', source: 'deck', playerIndex: 0 });
  const lastActionRef = useRef<string | null>(null);

  // Lock to landscape orientation
  useEffect(() => {
    Orientation.lockToLandscape();
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  const currentPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer?.id === 'human';
  const rawHand = getPlayerHand('human');
  const topDiscard = getTopDiscard();

  // Reset card order when starting a new round (hand is dealt fresh)
  useEffect(() => {
    if (gameState?.currentRound?.roundNumber) {
      setOrderedCards([]);
      setSelectedCardIds([]);
    }
  }, [gameState?.currentRound?.roundNumber]);

  // Detect bot draw and discard actions and trigger animation
  useEffect(() => {
    const lastAction = gameState?.currentRound?.lastAction;
    if (!lastAction) return;

    // Create a unique key for this action
    const actionKey = `${lastAction.playerId}-${lastAction.action}-${lastAction.card?.id || ''}`;

    // Only trigger for actions by non-human players that we haven't seen
    if (
      lastAction.playerId !== 'human' &&
      lastAction.card &&
      lastActionRef.current !== actionKey
    ) {
      lastActionRef.current = actionKey;

      // Find the player index for positioning
      const playerIndex = gameState?.activePlayers.findIndex(
        id => id === lastAction.playerId
      ) ?? 0;

      if (lastAction.action === 'draw') {
        setCardAnimation({
          isVisible: true,
          card: lastAction.card,
          animationType: 'draw',
          source: lastAction.source || 'deck',
          playerIndex,
        });
      } else if (lastAction.action === 'discard') {
        setCardAnimation({
          isVisible: true,
          card: lastAction.card,
          animationType: 'discard',
          source: 'discard', // Always goes to discard pile
          playerIndex,
        });
      }
    }
  }, [gameState?.currentRound?.lastAction, gameState?.activePlayers]);

  // Calculate positions for card animation (draw or discard)
  const getCardAnimationPositions = useCallback(() => {
    if (!gameState) return { source: { x: 0, y: 0 }, target: { x: 0, y: 0 } };

    const tableHeight = screenHeight * 0.55;
    const tableWidth = screenWidth - Spacing.sm * 2;
    const centerX = tableWidth / 2;
    const centerY = tableHeight / 2 + 46;

    // Pile positions (center of table)
    const deckX = centerX - 50;
    const discardX = centerX + 50;
    const pileY = centerY;

    // Player position
    const playerCount = gameState.activePlayers.length;
    const humanIndex = gameState.activePlayers.findIndex(id => id === 'human');
    const visualIndex = (cardAnimation.playerIndex - humanIndex + playerCount) % playerCount;

    const a = tableWidth / 2 - 45;
    const b = tableHeight / 2 - 10;
    const angleStep = (2 * Math.PI) / playerCount;
    const angle = Math.PI / 2 - visualIndex * angleStep;

    const playerX = centerX + a * Math.cos(angle) - 30;
    const playerY = centerY + b * Math.sin(angle) - 30;

    if (cardAnimation.animationType === 'draw') {
      // Draw: from pile to player
      const sourceX = cardAnimation.source === 'deck' ? deckX : discardX;
      return {
        source: { x: sourceX, y: pileY },
        target: { x: playerX, y: playerY },
      };
    } else {
      // Discard: from player to discard pile
      return {
        source: { x: playerX, y: playerY },
        target: { x: discardX, y: pileY },
      };
    }
  }, [gameState, screenWidth, screenHeight, cardAnimation.source, cardAnimation.playerIndex, cardAnimation.animationType]);

  const animationPositions = getCardAnimationPositions();

  // Apply custom card ordering if set, otherwise use raw hand
  const myHand = useMemo((): CardWithGroup[] => {
    if (orderedCards.length === 0) {
      return rawHand.map(c => ({ ...c, groupIndex: -1 }));
    }

    // Build a map of rawHand cards by ID for quick lookup
    const rawHandMap = new Map<string, CardType>();
    rawHand.forEach(card => {
      rawHandMap.set(card.id, card);
    });

    // Reorder cards based on orderedCards, using only cards that exist in rawHand
    const result: CardWithGroup[] = [];
    const usedIds = new Set<string>();

    orderedCards.forEach(ordered => {
      // Skip if already used (prevents duplicates)
      if (usedIds.has(ordered.id)) return;

      const card = rawHandMap.get(ordered.id);
      if (card) {
        result.push({ ...card, groupIndex: ordered.groupIndex });
        usedIds.add(ordered.id);
      }
    });

    // Add any new cards (drawn) at the end - no group
    rawHand.forEach(card => {
      if (!usedIds.has(card.id)) {
        result.push({ ...card, groupIndex: -1 });
        usedIds.add(card.id);
      }
    });

    // Safety check: if something went wrong, return rawHand
    if (result.length !== rawHand.length) {
      console.warn(`Card order mismatch: expected ${rawHand.length}, got ${result.length}`);
      return rawHand.map(c => ({ ...c, groupIndex: -1 }));
    }

    return result;
  }, [rawHand, orderedCards]);

  // Handle smart sort
  const handleSmartSort = useCallback(() => {
    const sorted = smartSortWithGroups(rawHand);
    setOrderedCards(sorted);
    setSelectedCardIds([]);
  }, [rawHand]);

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

  // Handle round end - show all bot hands
  useEffect(() => {
    if (gameState?.currentRound?.phase === 'ended' && gameState?.gamePhase === 'playing') {
      const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
      const roundNumber = gameState.currentRound.roundNumber;

      // Prevent duplicate handling
      if (lastRoundEndRef.current === roundNumber) return;
      lastRoundEndRef.current = roundNumber;

      // Skip showing hands if someone dropped (no meaningful hands to show)
      if (lastResult.declarationType === 'drop-first' || lastResult.declarationType === 'drop-middle') {
        Alert.alert(
          'Round Complete',
          `${lastResult.winnerName} dropped`,
          [{ text: 'Next Round' }]
        );
        return;
      }

      // Collect all bot hands to show
      const botDeclarations: BotDeclarationInfo[] = [];

      gameState.players.forEach(player => {
        if (player.id === 'human') return; // Skip human

        const botHand = gameState.currentRound?.hands[player.id] || [];
        if (botHand.length > 0) {
          const arranged = autoArrangeHand(botHand);
          const isWinner = player.id === lastResult.winnerId;
          botDeclarations.push({
            player,
            hand: botHand,
            melds: arranged.melds,
            deadwood: arranged.deadwood,
            isValid: isWinner && lastResult.declarationType === 'valid',
          });
        }
      });

      // Sort so winner is shown first (if bot won)
      botDeclarations.sort((a, b) => {
        if (a.player.id === lastResult.winnerId) return -1;
        if (b.player.id === lastResult.winnerId) return 1;
        return 0;
      });

      if (botDeclarations.length > 0) {
        // Queue up all bot hands and show the first one
        setBotDeclarationQueue(botDeclarations.slice(1));
        setCurrentBotDeclaration(botDeclarations[0]);
      } else {
        Alert.alert(
          'Round Complete',
          `${lastResult.winnerName} ${lastResult.declarationType === 'valid' ? 'declared' : 'invalid declaration'}`,
          [{ text: 'Next Round' }]
        );
      }
    }
  }, [gameState?.currentRound?.phase, gameState?.gamePhase, gameState?.roundResults, gameState?.currentRound?.roundNumber, gameState?.currentRound?.hands, gameState?.players]);

  const handleCardPress = useCallback((card: CardType, _index: number) => {
    // Toggle card selection (works anytime for grouping, restricted for discard)
    setSelectedCardIds(prev =>
      prev.includes(card.id)
        ? prev.filter(id => id !== card.id)
        : [...prev, card.id]
    );
  }, []);

  // Group selected cards into a new meld
  const handleGroupCards = useCallback(() => {
    if (selectedCardIds.length < 2) return;

    // Find the next available group index
    const existingGroups = new Set(orderedCards.map(c => c.groupIndex).filter(g => g >= 0));
    const newGroupIndex = existingGroups.size > 0 ? Math.max(...existingGroups) + 1 : 0;

    // Update ordered cards: selected cards get new group, move them together
    const selectedSet = new Set(selectedCardIds);
    const selectedCards = myHand.filter(c => selectedSet.has(c.id));
    const otherCards = myHand.filter(c => !selectedSet.has(c.id));

    // Place grouped cards at the position of the first selected card
    const firstSelectedIndex = myHand.findIndex(c => selectedSet.has(c.id));
    const newOrder: CardWithGroup[] = [];

    let insertedGroup = false;
    otherCards.forEach((card) => {
      // Find original position
      const originalIdx = myHand.findIndex(c => c.id === card.id);
      if (!insertedGroup && originalIdx > firstSelectedIndex) {
        // Insert the new group here
        selectedCards.forEach(sc => {
          newOrder.push({ ...sc, groupIndex: newGroupIndex });
        });
        insertedGroup = true;
      }
      newOrder.push(card);
    });

    // If group wasn't inserted (selected cards were at the end), add now
    if (!insertedGroup) {
      selectedCards.forEach(sc => {
        newOrder.push({ ...sc, groupIndex: newGroupIndex });
      });
    }

    setOrderedCards(newOrder);
    setSelectedCardIds([]);
  }, [selectedCardIds, orderedCards, myHand]);

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
        if (canDiscard() && selectedCardIds.length === 1) {
          const card = myHand.find(c => c.id === selectedCardIds[0]);
          if (card) {
            await discardCard(card);
            setSelectedCardIds([]);
          }
        }
        break;
      case 'declare':
        setShowDeclarationModal(true);
        break;
      case 'drop':
        // Drop penalty: 25 points if human hasn't drawn yet, 50 points otherwise
        const dropPenalty = gameState?.currentRound?.humanHasDrawn ? 50 : 25;
        Alert.alert(
          'Drop',
          `Are you sure you want to drop? You will receive ${dropPenalty} points.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Drop', style: 'destructive', onPress: () => drop() },
          ]
        );
        break;
      case 'group':
        handleGroupCards();
        break;
      case 'sort':
        handleSmartSort();
        setSelectedCardIds([]);
        break;
    }
  }, [canDraw, canDiscard, drawCard, discardCard, drop, selectedCardIds, myHand, topDiscard, handleSmartSort, handleGroupCards, gameState?.currentRound?.humanHasDrawn]);

  const handleDeclare = useCallback(async (melds: any[]) => {
    setShowDeclarationModal(false);
    await declare(melds);
  }, [declare]);

  // Handle drag-to-discard
  const handleCardDiscard = useCallback(async (card: CardType) => {
    if (canDiscard()) {
      await discardCard(card);
      setSelectedCardIds([]);
    }
  }, [canDiscard, discardCard]);

  // Handle drag-to-draw with positioning
  // Calculates insertion index based on where the card is dropped
  const handleDragDraw = useCallback(async (source: DrawSource, absoluteX: number) => {
    if (!canDraw()) return;

    // Draw the card first
    const drawnCard = await drawCard(source);
    if (!drawnCard) return;

    // Calculate insertion index based on X position
    // Card dimensions: medium = 60 width, overlap = -30
    const cardWidth = 60;
    const cardOverlap = -30;
    const meldGap = 8;

    // Get current cards (before the new card is added to state)
    const currentCards = orderedCards.length > 0 ? orderedCards : myHand.filter(c => c.id !== drawnCard.id);

    if (currentCards.length === 0) {
      // First card, no positioning needed
      return;
    }

    // Calculate approximate card positions
    // Content width calculation
    let contentWidth = cardWidth; // First card
    for (let i = 1; i < currentCards.length; i++) {
      const currentGroup = currentCards[i]?.groupIndex ?? -1;
      const prevGroup = currentCards[i - 1]?.groupIndex ?? -1;
      const hasMeldGap = (
        (currentGroup >= 0 && prevGroup >= 0 && currentGroup !== prevGroup) ||
        (currentGroup >= 0 && prevGroup < 0) ||
        (currentGroup < 0 && prevGroup >= 0)
      );
      if (hasMeldGap) {
        contentWidth += cardWidth + meldGap;
      } else {
        contentWidth += cardWidth + cardOverlap;
      }
    }

    const paddingForCenter = Math.max(8, (screenWidth - contentWidth) / 2);

    // Find insertion index based on X position
    let currentX = paddingForCenter;
    let insertionIndex = currentCards.length; // Default: end

    for (let i = 0; i < currentCards.length; i++) {
      const cardCenterX = currentX + cardWidth / 2;

      if (absoluteX < cardCenterX) {
        insertionIndex = i;
        break;
      }

      // Move to next card position
      const currentGroup = currentCards[i]?.groupIndex ?? -1;
      const nextGroup = currentCards[i + 1]?.groupIndex ?? -1;
      const hasMeldGap = i < currentCards.length - 1 && (
        (currentGroup >= 0 && nextGroup >= 0 && currentGroup !== nextGroup) ||
        (currentGroup >= 0 && (nextGroup === undefined || nextGroup < 0)) ||
        ((currentGroup === undefined || currentGroup < 0) && nextGroup >= 0)
      );

      currentX += cardWidth + (hasMeldGap ? meldGap : cardOverlap);
    }

    // Determine group index for the new card
    const leftNeighbor = insertionIndex > 0 ? currentCards[insertionIndex - 1] : null;
    const rightNeighbor = insertionIndex < currentCards.length ? currentCards[insertionIndex] : null;

    let newGroupIndex = -1;
    if (leftNeighbor?.groupIndex !== undefined && leftNeighbor.groupIndex >= 0 &&
        rightNeighbor?.groupIndex !== undefined && rightNeighbor.groupIndex >= 0 &&
        leftNeighbor.groupIndex === rightNeighbor.groupIndex) {
      newGroupIndex = leftNeighbor.groupIndex;
    } else if (leftNeighbor?.groupIndex !== undefined && leftNeighbor.groupIndex >= 0 &&
               (rightNeighbor?.groupIndex === undefined || rightNeighbor.groupIndex !== leftNeighbor.groupIndex)) {
      newGroupIndex = leftNeighbor.groupIndex;
    } else if (rightNeighbor?.groupIndex !== undefined && rightNeighbor.groupIndex >= 0 &&
               (leftNeighbor?.groupIndex === undefined || leftNeighbor.groupIndex !== rightNeighbor.groupIndex)) {
      newGroupIndex = rightNeighbor.groupIndex;
    }

    // Create new card with group index
    const newCard: CardWithGroup = { ...drawnCard, groupIndex: newGroupIndex };

    // Insert at the calculated position
    const newOrderedCards = [...currentCards];
    newOrderedCards.splice(insertionIndex, 0, newCard);
    setOrderedCards(newOrderedCards);
    setSelectedCardIds([]);
  }, [canDraw, drawCard, orderedCards, myHand, screenWidth]);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Virtual Table with Players - Full Screen */}
      <View style={styles.tableContainer}>
        <TableView
          players={gameState.players}
          humanPlayerId="human"
          currentPlayerIndex={round.currentPlayerIndex}
          dealerIndex={round.dealerIndex}
          scores={gameState.scores}
          hands={round.hands}
          drawPile={round.drawPile}
          discardPile={round.discardPile}
          topDiscard={topDiscard}
          wildJokerCard={round.wildJokerCard}
          turnPhase={round.turnPhase}
          currentPlayerName={currentPlayer?.name || ''}
          isHumanTurn={isMyTurn}
          onDrawFromDeck={() => handleAction('draw-deck')}
          onDrawFromDiscard={() => handleAction('draw-discard')}
          onDragDrawFromDeck={(absoluteX) => handleDragDraw('deck', absoluteX)}
          onDragDrawFromDiscard={(absoluteX) => handleDragDraw('discard', absoluteX)}
        />

        {/* Card animation for bot actions (draw and discard) */}
        <DrawAnimation
          card={cardAnimation.card}
          source={cardAnimation.source}
          animationType={cardAnimation.animationType}
          sourcePosition={animationPositions.source}
          targetPosition={animationPositions.target}
          isVisible={cardAnimation.isVisible}
          onComplete={() => setCardAnimation(prev => ({ ...prev, isVisible: false }))}
        />
      </View>

      {/* Player's Hand with Avatar Badge */}
      <View style={styles.handContainer}>
        {/* Compact player badge - top left */}
        <View style={styles.playerBadge}>
          <View style={[styles.avatarSmall, isMyTurn && styles.avatarActive]}>
            <Icon name="person.fill" size={14} color={colors.label} weight="medium" />
          </View>
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeName}>You</Text>
            <Text style={styles.badgeScore}>{gameState.scores.human || 0}</Text>
          </View>
        </View>

        <DraggableHand
          cards={myHand}
          selectedCardIds={selectedCardIds}
          onCardPress={handleCardPress}
          onCardsReordered={(newCards) => {
            // Keep existing group indices, only moved card loses its group
            // Ensure all cards have groupIndex (default to -1 if undefined)
            const cardsWithGroup = newCards.map(c => ({
              ...c,
              groupIndex: c.groupIndex ?? -1,
            }));
            setOrderedCards(cardsWithGroup);
          }}
          onCardDiscard={handleCardDiscard}
          canDiscard={isMyTurn && canDiscard()}
          selectionMode="multiple"
          isDisabled={false}
          cardSize="medium"
        />
      </View>

      {/* Action Bar */}
      <ActionBar
        turnPhase={isMyTurn ? round.turnPhase : 'draw'}
        canDeclare={canDiscard() && myHand.length === 14}
        canDrop={true}
        hasDiscardCard={!!topDiscard}
        selectedCardCount={selectedCardIds.length}
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

      {/* Bot Declaration Modal - shows all bot hands after round ends */}
      <BotDeclarationModal
        visible={currentBotDeclaration !== null}
        player={currentBotDeclaration?.player || null}
        hand={currentBotDeclaration?.hand || []}
        melds={currentBotDeclaration?.melds || []}
        deadwood={currentBotDeclaration?.deadwood || []}
        isValid={currentBotDeclaration?.isValid || false}
        onClose={() => {
          if (botDeclarationQueue.length > 0) {
            // Show next bot's hand
            setCurrentBotDeclaration(botDeclarationQueue[0]);
            setBotDeclarationQueue(prev => prev.slice(1));
          } else {
            // All done, close modal
            setCurrentBotDeclaration(null);
          }
        }}
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
    tableContainer: {
      flex: 1,
    },
    handContainer: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    playerBadge: {
      position: 'absolute',
      top: Spacing.xs,
      left: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: BorderRadius.medium,
      padding: Spacing.xs,
      paddingRight: Spacing.sm,
      zIndex: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    avatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.separator,
    },
    avatarActive: {
      borderColor: colors.warning,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
    },
    badgeInfo: {
      marginLeft: Spacing.xs,
    },
    badgeName: {
      ...Typography.caption2,
      color: colors.label,
      fontWeight: '600',
    },
    badgeScore: {
      ...Typography.caption2,
      color: colors.secondaryLabel,
    },
  });

export default PracticeGameScreen;
