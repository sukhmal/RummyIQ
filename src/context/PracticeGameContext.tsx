/**
 * Practice Game Context
 *
 * Manages state for practice mode games with AI opponents.
 * Handles game lifecycle, player actions, and bot turns.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Card,
  PracticePlayer,
  PracticeGameState,
  PracticeGameConfig,
  RoundState,
  RoundResult,
  DrawSource,
  Meld,
  BotDifficulty,
  CARDS_PER_PLAYER,
} from '../engine/types';
import {
  createDecks,
  dealCards,
  drawFromPile,
  drawFromDiscard,
  discardCard as addToDiscardPile,
  refillDrawPile,
} from '../engine/deck';
import {
  addCardToHand,
  removeCardFromHand,
} from '../engine/hand';
import { validateDeclaration } from '../engine/declaration';
import {
  calculateRoundScores,
  updateCumulativeScores,
  isPlayerEliminated,
  shouldGameEnd,
  determineGameWinner,
} from '../engine/scoring';
import {
  getBotDecision,
  getBotName,
  getBotAvatar,
  BotContext,
} from '../engine/bot';

const STORAGE_KEY = 'practiceGame';

// Static card formatter for logging
const formatCardStatic = (card: Card): string => {
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  if (card.jokerType === 'printed') return '🃏';
  return `${card.rank}${suitSymbols[card.suit]}`;
};

interface PracticeGameContextType {
  // State
  gameState: PracticeGameState | null;
  isLoading: boolean;

  // Game lifecycle
  createGame: (
    humanPlayerName: string,
    botCount: number,
    botDifficulty: BotDifficulty,
    config: PracticeGameConfig
  ) => Promise<void>;
  startRound: () => Promise<void>;
  resetGame: () => Promise<void>;

  // Player actions
  drawCard: (source: DrawSource) => Promise<Card | null>;
  discardCard: (card: Card) => Promise<void>;
  declare: (melds: Meld[]) => Promise<boolean>;
  drop: () => Promise<void>;

  // Bot helpers
  isBotTurn: () => boolean;
  executeBotTurn: () => Promise<void>;

  // Queries
  getPlayerHand: (playerId: string) => Card[];
  getCurrentPlayer: () => PracticePlayer | null;
  getTopDiscard: () => Card | null;
  canDraw: () => boolean;
  canDiscard: () => boolean;
}

const PracticeGameContext = createContext<PracticeGameContextType | undefined>(undefined);

export const usePracticeGame = () => {
  const context = useContext(PracticeGameContext);
  if (!context) {
    throw new Error('usePracticeGame must be used within a PracticeGameProvider');
  }
  return context;
};

interface PracticeGameProviderProps {
  children: React.ReactNode;
}

export const PracticeGameProvider: React.FC<PracticeGameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<PracticeGameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const discardHistoryRef = useRef<Card[]>([]);
  const botTurnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved game on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setGameState(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load practice game:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGame();
  }, []);

  // Save game on state change
  useEffect(() => {
    if (!isLoading && gameState) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)).catch(error =>
        console.error('Failed to save practice game:', error)
      );
    }
  }, [gameState, isLoading]);

  // Cleanup bot timeout on unmount
  useEffect(() => {
    return () => {
      if (botTurnTimeoutRef.current) {
        clearTimeout(botTurnTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Create a new practice game
   */
  const createGame = useCallback(async (
    humanPlayerName: string,
    botCount: number,
    botDifficulty: BotDifficulty,
    config: PracticeGameConfig
  ) => {
    // Create human player
    const humanPlayer: PracticePlayer = {
      id: 'human',
      name: humanPlayerName,
      isBot: false,
    };

    // Create bot players
    const bots: PracticePlayer[] = [];
    for (let i = 0; i < botCount; i++) {
      bots.push({
        id: `bot-${i}`,
        name: getBotName(botDifficulty, i),
        isBot: true,
        difficulty: botDifficulty,
        avatar: getBotAvatar(botDifficulty, i),
      });
    }

    const players = [humanPlayer, ...bots];
    const playerIds = players.map(p => p.id);

    // Initialize scores
    const scores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      scores[id] = 0;
    });

    // Create deck and deal cards for first round
    const deck = createDecks(playerIds.length);
    const dealResult = dealCards(deck, playerIds, CARDS_PER_PLAYER);

    // First round setup
    const firstRound: RoundState = {
      roundNumber: 1,
      phase: 'playing',
      turnPhase: 'draw',
      currentPlayerIndex: 1, // First player after dealer (human is dealer first)
      dealerIndex: 0,
      hands: dealResult.hands,
      drawPile: dealResult.drawPile,
      discardPile: dealResult.discardPile,
      wildJokerCard: dealResult.wildJokerCard,
      droppedPlayers: [],
      humanHasDrawn: false,
    };

    const newGame: PracticeGameState = {
      id: `practice-${Date.now()}`,
      config,
      players,
      activePlayers: playerIds,
      currentRound: firstRound,
      roundResults: [],
      scores,
      gamePhase: 'playing',
      winner: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    discardHistoryRef.current = [...dealResult.discardPile];
    setGameState(newGame);

    // Log initial game setup
    console.log('\n' + '='.repeat(50));
    console.log('🎮 NEW GAME STARTED');
    console.log('='.repeat(50));
    console.log(`Variant: ${config.variant.toUpperCase()}`);
    console.log(`Players: ${players.length}`);
    console.log(`Dealer: ${players[0].name} (index 0)`);
    console.log(`First turn: ${players[1].name} (index 1)`);
    console.log(`Wild Joker: ${dealResult.wildJokerCard ? formatCardStatic(dealResult.wildJokerCard) : 'None'}`);
    console.log(`Draw pile: ${dealResult.drawPile.length} | Discard pile: ${dealResult.discardPile.length}`);
    console.log('\n📋 Initial Hands:');
    players.forEach((player, idx) => {
      const hand = dealResult.hands[player.id];
      const handStr = hand.map(formatCardStatic).join(' ');
      const marker = idx === 0 ? ' [DEALER]' : idx === 1 ? ' [FIRST TURN]' : '';
      console.log(`   ${player.name}${marker}: ${handStr}`);
    });
    console.log('='.repeat(50) + '\n');
  }, []);

  /**
   * Start a new round
   */
  const startRound = useCallback(async () => {
    if (!gameState) return;

    const activePlayerIds = gameState.activePlayers;
    const deck = createDecks(activePlayerIds.length);
    const dealResult = dealCards(deck, activePlayerIds, CARDS_PER_PLAYER);

    // Determine dealer (rotate based on round number)
    const dealerIndex = gameState.roundResults.length % activePlayerIds.length;
    // First player is to the left of dealer
    const firstPlayerIndex = (dealerIndex + 1) % activePlayerIds.length;

    const round: RoundState = {
      roundNumber: gameState.roundResults.length + 1,
      phase: 'playing',
      turnPhase: 'draw',
      currentPlayerIndex: firstPlayerIndex,
      dealerIndex,
      hands: dealResult.hands,
      drawPile: dealResult.drawPile,
      discardPile: dealResult.discardPile,
      wildJokerCard: dealResult.wildJokerCard,
      droppedPlayers: [],
      humanHasDrawn: false,
    };

    discardHistoryRef.current = [...dealResult.discardPile];

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: round,
        gamePhase: 'playing',
        updatedAt: Date.now(),
      };
    });
  }, [gameState]);

  /**
   * Reset/clear the current game
   */
  const resetGame = useCallback(async () => {
    setGameState(null);
    discardHistoryRef.current = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Draw a card from deck or discard pile
   */
  const drawCard = useCallback(async (source: DrawSource): Promise<Card | null> => {
    if (!gameState?.currentRound || gameState.currentRound.turnPhase !== 'draw') {
      return null;
    }

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];
    let drawnCard: Card | null = null;
    let newDrawPile = round.drawPile;
    let newDiscardPile = round.discardPile;

    if (source === 'deck') {
      // Check if need to refill draw pile
      if (round.drawPile.length === 0) {
        const refilled = refillDrawPile(round.drawPile, round.discardPile);
        newDrawPile = refilled.newDrawPile;
        newDiscardPile = refilled.newDiscardPile;
      }

      const result = drawFromPile(newDrawPile);
      drawnCard = result.card;
      newDrawPile = result.newPile;
    } else {
      const result = drawFromDiscard(round.discardPile);
      drawnCard = result.card;
      newDiscardPile = result.newPile;
    }

    if (!drawnCard) return null;

    // Add card to player's hand
    const newHand = addCardToHand(round.hands[currentPlayerId], drawnCard);

    // Track if human has drawn (for drop penalty calculation)
    const isHumanDraw = currentPlayerId === 'human';

    setGameState(prev => {
      if (!prev?.currentRound) return prev;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          hands: {
            ...prev.currentRound.hands,
            [currentPlayerId]: newHand,
          },
          drawPile: newDrawPile,
          discardPile: newDiscardPile,
          turnPhase: 'discard',
          humanHasDrawn: prev.currentRound.humanHasDrawn || isHumanDraw,
          lastAction: {
            playerId: currentPlayerId,
            action: 'draw',
            card: drawnCard!,
            source,
          },
        },
        updatedAt: Date.now(),
      };
    });

    return drawnCard;
  }, [gameState]);

  /**
   * Discard a card and end turn
   */
  const discardCard = useCallback(async (card: Card) => {
    if (!gameState?.currentRound || gameState.currentRound.turnPhase !== 'discard') {
      return;
    }

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];

    // Remove card from hand
    const newHand = removeCardFromHand(round.hands[currentPlayerId], card.id);

    // Add to discard pile
    const newDiscardPile = addToDiscardPile(round.discardPile, card);
    discardHistoryRef.current.push(card);

    // Move to next player (skip dropped players)
    let nextPlayerIndex = (round.currentPlayerIndex + 1) % gameState.activePlayers.length;
    const droppedPlayers = round.droppedPlayers || [];
    while (droppedPlayers.includes(gameState.activePlayers[nextPlayerIndex])) {
      nextPlayerIndex = (nextPlayerIndex + 1) % gameState.activePlayers.length;
    }

    setGameState(prev => {
      if (!prev?.currentRound) return prev;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          hands: {
            ...prev.currentRound.hands,
            [currentPlayerId]: newHand,
          },
          discardPile: newDiscardPile,
          currentPlayerIndex: nextPlayerIndex,
          turnPhase: 'draw',
          lastAction: {
            playerId: currentPlayerId,
            action: 'discard',
            card,
          },
        },
        updatedAt: Date.now(),
      };
    });
  }, [gameState]);

  /**
   * Declare (show) with melds
   */
  const declare = useCallback(async (melds: Meld[]): Promise<boolean> => {
    if (!gameState?.currentRound) return false;

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];

    // Validate declaration
    const validation = validateDeclaration(melds);

    // Calculate round scores
    const declarationType = validation.isValid ? 'valid' : 'invalid';
    const roundScores = calculateRoundScores(
      round.hands,
      currentPlayerId,
      declarationType,
      gameState.config.variant,
      gameState.config.firstDropPenalty,
      gameState.config.middleDropPenalty,
      gameState.config.invalidDeclarationPenalty
    );

    // Update cumulative scores
    const newScores = updateCumulativeScores(gameState.scores, roundScores);

    // Create round result with declared melds and final hands
    const result: RoundResult = {
      winnerId: currentPlayerId,
      winnerName: gameState.players.find(p => p.id === currentPlayerId)?.name || 'Unknown',
      declarationType,
      scores: roundScores,
      timestamp: Date.now(),
      declaredMelds: melds,
      finalHands: { ...round.hands },
    };

    // Check for eliminations (pool rummy)
    const poolLimit = gameState.config.poolLimit;
    const updatedActivePlayers = gameState.activePlayers.filter(
      id => !isPlayerEliminated(newScores[id] || 0, gameState.config.variant, poolLimit)
    );

    // Check if game should end
    const gameEnded = shouldGameEnd(
      gameState.players,
      newScores,
      gameState.roundResults.length + 1,
      gameState.config.variant,
      gameState.config.numberOfDeals,
      poolLimit
    );

    const winner = gameEnded
      ? determineGameWinner(gameState.players, newScores, gameState.config.variant, poolLimit)
      : null;

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound!,
          phase: 'ended',
        },
        roundResults: [...prev.roundResults, result],
        scores: newScores,
        activePlayers: updatedActivePlayers,
        gamePhase: gameEnded ? 'ended' : 'playing',
        winner,
        updatedAt: Date.now(),
      };
    });

    return validation.isValid;
  }, [gameState]);

  /**
   * Drop from the game
   */
  const drop = useCallback(async () => {
    if (!gameState?.currentRound) return;

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];
    const isFirstTurn = round.turnPhase === 'draw';
    const dropType = isFirstTurn ? 'first' : 'middle';

    // Calculate drop penalty for the dropping player only
    const dropPenalty = dropType === 'first'
      ? gameState.config.firstDropPenalty
      : gameState.config.middleDropPenalty;

    // Update dropper's score
    const newScores = {
      ...gameState.scores,
      [currentPlayerId]: (gameState.scores[currentPlayerId] || 0) + dropPenalty,
    };

    // Add player to dropped list for this round
    const newDroppedPlayers = [...(round.droppedPlayers || []), currentPlayerId];

    // Find players still in this round (active and not dropped)
    const playersStillInRound = gameState.activePlayers.filter(
      id => !newDroppedPlayers.includes(id)
    );

    // Check for eliminations (pool rummy)
    const poolLimit = gameState.config.poolLimit;
    const updatedActivePlayers = gameState.activePlayers.filter(
      id => !isPlayerEliminated(newScores[id] || 0, gameState.config.variant, poolLimit)
    );

    // If only one player remains in round, they win
    if (playersStillInRound.length === 1) {
      const winnerId = playersStillInRound[0];
      const winner = gameState.players.find(p => p.id === winnerId);

      // Calculate scores for remaining players (they get their deadwood points)
      const roundScores: { [playerId: string]: number } = {};
      for (const playerId of gameState.activePlayers) {
        if (newDroppedPlayers.includes(playerId)) {
          // Dropped players already have their penalty in newScores
          roundScores[playerId] = playerId === currentPlayerId ? dropPenalty :
            (dropType === 'first' ? gameState.config.firstDropPenalty : gameState.config.middleDropPenalty);
        } else {
          // Winner gets 0 points
          roundScores[playerId] = 0;
        }
      }

      const result: RoundResult = {
        winnerId,
        winnerName: winner?.name || 'Unknown',
        declarationType: `drop-${dropType}`,
        scores: roundScores,
        timestamp: Date.now(),
        finalHands: { ...round.hands },
      };

      // Check if game should end
      const gameEnded = shouldGameEnd(
        gameState.players,
        newScores,
        gameState.roundResults.length + 1,
        gameState.config.variant,
        gameState.config.numberOfDeals,
        poolLimit
      );

      const gameWinner = gameEnded
        ? determineGameWinner(gameState.players, newScores, gameState.config.variant, poolLimit)
        : null;

      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentRound: {
            ...prev.currentRound!,
            phase: 'ended',
            droppedPlayers: newDroppedPlayers,
            lastAction: {
              playerId: currentPlayerId,
              action: 'drop',
            },
          },
          roundResults: [...prev.roundResults, result],
          scores: newScores,
          activePlayers: updatedActivePlayers,
          gamePhase: gameEnded ? 'ended' : 'playing',
          winner: gameWinner,
          updatedAt: Date.now(),
        };
      });
      return;
    }

    // Find next player who hasn't dropped
    let nextPlayerIndex = (round.currentPlayerIndex + 1) % gameState.activePlayers.length;
    while (newDroppedPlayers.includes(gameState.activePlayers[nextPlayerIndex])) {
      nextPlayerIndex = (nextPlayerIndex + 1) % gameState.activePlayers.length;
    }

    // Continue round with remaining players
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound!,
          currentPlayerIndex: nextPlayerIndex,
          turnPhase: 'draw',
          droppedPlayers: newDroppedPlayers,
          lastAction: {
            playerId: currentPlayerId,
            action: 'drop',
          },
        },
        scores: newScores,
        activePlayers: updatedActivePlayers,
        updatedAt: Date.now(),
      };
    });
  }, [gameState]);

  /**
   * Check if it's a bot's turn
   */
  const isBotTurn = useCallback((): boolean => {
    if (!gameState?.currentRound) return false;

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];

    // Skip if this player has dropped
    if (round.droppedPlayers?.includes(currentPlayerId)) return false;

    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    const isBot = currentPlayer?.isBot ?? false;

    // Log when it becomes human's turn
    if (!isBot && round.turnPhase === 'draw') {
      const hand = round.hands[currentPlayerId];
      const handStr = hand?.map(formatCardStatic).join(' ') || 'N/A';
      const topDiscard = round.discardPile.length > 0
        ? round.discardPile[round.discardPile.length - 1]
        : null;
      console.log(`\n👤 [YOUR TURN] - Player ${round.currentPlayerIndex + 1}/${gameState.activePlayers.length}`);
      console.log(`   Hand (${hand?.length || 0}): ${handStr}`);
      console.log(`   Phase: ${round.turnPhase}`);
      if (topDiscard) {
        console.log(`   Top discard: ${formatCardStatic(topDiscard)}`);
      }
    }

    return isBot;
  }, [gameState]);

  /**
   * Execute a bot's turn
   */
  const executeBotTurn = useCallback(async () => {
    if (!gameState?.currentRound || !isBotTurn()) return;

    const round = gameState.currentRound;
    const currentPlayerId = gameState.activePlayers[round.currentPlayerIndex];
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    const dealer = gameState.players[round.dealerIndex];

    if (!currentPlayer?.isBot || !currentPlayer.difficulty) return;

    const hand = round.hands[currentPlayerId];
    const topDiscard = round.discardPile.length > 0
      ? round.discardPile[round.discardPile.length - 1]
      : null;

    // Determine if this is the bot's first turn
    const isFirstTurn = round.turnPhase === 'draw' &&
      !round.lastAction?.playerId;

    const botContext: BotContext = {
      hand,
      topDiscard,
      discardHistory: discardHistoryRef.current,
      isFirstTurn,
      currentScore: gameState.scores[currentPlayerId] || 0,
      poolLimit: gameState.config.poolLimit || null,
      turnPhase: round.turnPhase,
    };

    const decision = getBotDecision(currentPlayer.difficulty, botContext);

    // Debug logging for bot plays
    const handStr = hand.map(formatCardStatic).join(' ');
    console.log(`\n🤖 [${currentPlayer.name}] (${currentPlayer.difficulty}) - Player ${round.currentPlayerIndex + 1}/${gameState.activePlayers.length}`);
    console.log(`   Dealer: ${dealer?.name} | Round: ${round.roundNumber}`);
    console.log(`   Hand (${hand.length}): ${handStr}`);
    console.log(`   Phase: ${round.turnPhase} | Score: ${gameState.scores[currentPlayerId] || 0}`);
    if (topDiscard) {
      console.log(`   Top discard: ${formatCardStatic(topDiscard)} | Discard pile: ${round.discardPile.length} | Draw pile: ${round.drawPile.length}`);
    }

    // Wait for "thinking" time
    botTurnTimeoutRef.current = setTimeout(async () => {
      switch (decision.action) {
        case 'draw':
          console.log(`   ➡️ Action: DRAW from ${decision.source || 'deck'}`);
          await drawCard(decision.source || 'deck');
          break;
        case 'discard':
          if (decision.card) {
            console.log(`   ➡️ Action: DISCARD ${formatCardStatic(decision.card)}`);
            await discardCard(decision.card);
          }
          break;
        case 'declare':
          console.log(`   ➡️ Action: DECLARE with ${decision.melds?.length || 0} melds`);
          if (decision.melds) {
            await declare(decision.melds);
          }
          break;
        case 'drop':
          console.log(`   ➡️ Action: DROP`);
          await drop();
          break;
      }
    }, decision.thinkingTime);
  }, [gameState, isBotTurn, drawCard, discardCard, declare, drop]);

  /**
   * Get a player's hand
   */
  const getPlayerHand = useCallback((playerId: string): Card[] => {
    return gameState?.currentRound?.hands[playerId] || [];
  }, [gameState]);

  /**
   * Get current player
   */
  const getCurrentPlayer = useCallback((): PracticePlayer | null => {
    if (!gameState?.currentRound) return null;
    const currentPlayerId = gameState.activePlayers[gameState.currentRound.currentPlayerIndex];
    return gameState.players.find(p => p.id === currentPlayerId) || null;
  }, [gameState]);

  /**
   * Get top discard card
   */
  const getTopDiscard = useCallback((): Card | null => {
    if (!gameState?.currentRound?.discardPile.length) return null;
    return gameState.currentRound.discardPile[gameState.currentRound.discardPile.length - 1];
  }, [gameState]);

  /**
   * Check if current player can draw
   */
  const canDraw = useCallback((): boolean => {
    if (!gameState?.currentRound) return false;
    return gameState.currentRound.turnPhase === 'draw';
  }, [gameState]);

  /**
   * Check if current player can discard
   */
  const canDiscard = useCallback((): boolean => {
    if (!gameState?.currentRound) return false;
    return gameState.currentRound.turnPhase === 'discard';
  }, [gameState]);

  const value: PracticeGameContextType = {
    gameState,
    isLoading,
    createGame,
    startRound,
    resetGame,
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
  };

  return (
    <PracticeGameContext.Provider value={value}>
      {children}
    </PracticeGameContext.Provider>
  );
};

export default PracticeGameContext;
