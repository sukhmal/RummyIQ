/**
 * Scoring system for the Rummy game engine
 */

import {
  Card,
  PracticeGameState,
  PracticePlayer,
  RoundResult,
  PracticeVariant,
  DEFAULT_POOL_LIMIT,
} from './types';
import { calculateDeadwoodPoints } from './hand';
import { autoArrangeHand } from './declaration';

/**
 * Maximum points a player can get in a single round
 */
export const MAX_ROUND_POINTS = 80;

/**
 * Default penalties
 */
export const DEFAULT_FIRST_DROP = 25;
export const DEFAULT_MIDDLE_DROP = 50;
export const DEFAULT_INVALID_DECLARATION = 80;

/**
 * Calculate points for a player's hand at end of round
 * Winner gets 0 points, others get their deadwood points (capped at 80)
 *
 * Indian Rummy Rules:
 * - If no pure sequence: max 80 points (full count)
 * - If no second sequence: sets don't count, their cards are deadwood
 * - Otherwise: deadwood points capped at 80
 */
export const calculateHandPoints = (hand: Card[]): number => {
  const analysis = autoArrangeHand(hand);

  // If valid declaration, 0 points
  if (analysis.canDeclare) {
    return 0;
  }

  // If no pure sequence, full count (max 80)
  if (!analysis.hasPureSequence) {
    return MAX_ROUND_POINTS;
  }

  // If less than 2 sequences, sets don't count - calculate with all non-sequence cards
  if (analysis.sequenceCount < 2) {
    // All cards not in sequences are deadwood
    const sequenceCards = new Set<string>();
    for (const meld of analysis.melds) {
      if (meld.type === 'sequence' || meld.type === 'pure-sequence') {
        for (const card of meld.cards) {
          sequenceCards.add(card.id);
        }
      }
    }
    const deadwoodCards = hand.filter(c => !sequenceCards.has(c.id));
    const points = calculateDeadwoodPoints(deadwoodCards);
    return Math.min(points, MAX_ROUND_POINTS);
  }

  // Otherwise, calculate deadwood points
  const points = calculateDeadwoodPoints(analysis.deadwood);
  return Math.min(points, MAX_ROUND_POINTS);
};

/**
 * Calculate points for an invalid declaration
 * Full hand count, capped at 80 in pool rummy
 */
export const calculateInvalidDeclarationPoints = (
  hand: Card[],
  variant: PracticeVariant
): number => {
  if (variant === 'pool') {
    // Pool rummy: fixed 80 points for invalid declaration
    return MAX_ROUND_POINTS;
  }

  // Other variants: count full hand value
  const totalPoints = hand.reduce((sum, card) => sum + card.value, 0);
  return totalPoints;
};

/**
 * Calculate drop penalty points
 */
export const calculateDropPoints = (
  dropType: 'first' | 'middle',
  firstDropPenalty: number = DEFAULT_FIRST_DROP,
  middleDropPenalty: number = DEFAULT_MIDDLE_DROP
): number => {
  return dropType === 'first' ? firstDropPenalty : middleDropPenalty;
};

/**
 * Calculate round scores for all players
 */
export interface RoundScoreResult {
  scores: { [playerId: string]: number };
  winnerId: string;
  declarationType: 'valid' | 'invalid' | 'drop-first' | 'drop-middle';
}

export const calculateRoundScores = (
  hands: { [playerId: string]: Card[] },
  winnerId: string,
  declarationType: 'valid' | 'invalid' | 'drop-first' | 'drop-middle',
  variant: PracticeVariant,
  firstDropPenalty: number = DEFAULT_FIRST_DROP,
  middleDropPenalty: number = DEFAULT_MIDDLE_DROP,
  invalidDeclarationPenalty: number = DEFAULT_INVALID_DECLARATION
): { [playerId: string]: number } => {
  const scores: { [playerId: string]: number } = {};

  for (const playerId of Object.keys(hands)) {
    if (playerId === winnerId) {
      if (declarationType === 'valid') {
        scores[playerId] = 0;
      } else if (declarationType === 'invalid') {
        // Invalid declaration - player gets penalty
        scores[playerId] = variant === 'pool'
          ? invalidDeclarationPenalty
          : calculateDeadwoodPoints(hands[playerId]);
      } else if (declarationType === 'drop-first') {
        scores[playerId] = firstDropPenalty;
      } else {
        scores[playerId] = middleDropPenalty;
      }
    } else {
      // Other players get their deadwood points
      scores[playerId] = calculateHandPoints(hands[playerId]);
    }
  }

  return scores;
};

/**
 * Update cumulative scores and check for eliminations (pool rummy)
 */
export const updateCumulativeScores = (
  currentScores: { [playerId: string]: number },
  roundScores: { [playerId: string]: number }
): { [playerId: string]: number } => {
  const newScores: { [playerId: string]: number } = { ...currentScores };

  for (const playerId of Object.keys(roundScores)) {
    newScores[playerId] = (newScores[playerId] || 0) + roundScores[playerId];
  }

  return newScores;
};

/**
 * Check if a player is eliminated in pool rummy
 */
export const isPlayerEliminated = (
  score: number,
  variant: PracticeVariant,
  poolLimit?: number
): boolean => {
  if (variant !== 'pool') return false;
  const limit = poolLimit || DEFAULT_POOL_LIMIT;
  return score > limit;
};

/**
 * Get active players (not eliminated) for pool rummy
 */
export const getActivePlayers = (
  players: PracticePlayer[],
  scores: { [playerId: string]: number },
  variant: PracticeVariant,
  poolLimit?: number
): PracticePlayer[] => {
  if (variant !== 'pool') {
    return players;
  }

  return players.filter(p => !isPlayerEliminated(scores[p.id] || 0, variant, poolLimit));
};

/**
 * Check if game should end
 */
export const shouldGameEnd = (
  players: PracticePlayer[],
  scores: { [playerId: string]: number },
  roundResults: RoundResult[],
  variant: PracticeVariant,
  numberOfDeals?: number,
  poolLimit?: number
): boolean => {
  if (variant === 'pool') {
    // Pool rummy: game ends when only 1 player remains
    const activePlayers = getActivePlayers(players, scores, variant, poolLimit);
    return activePlayers.length <= 1;
  }

  if (variant === 'deals' && numberOfDeals) {
    // Deals rummy: game ends after fixed number of deals
    return roundResults.length >= numberOfDeals;
  }

  if (variant === 'points') {
    // Points rummy: game ends after 1 round
    return roundResults.length >= 1;
  }

  return false;
};

/**
 * Determine the winner of the game
 */
export const determineGameWinner = (
  players: PracticePlayer[],
  scores: { [playerId: string]: number },
  variant: PracticeVariant,
  poolLimit?: number
): PracticePlayer | null => {
  if (variant === 'pool') {
    // Pool rummy: last remaining player wins
    const activePlayers = getActivePlayers(players, scores, variant, poolLimit);
    return activePlayers.length === 1 ? activePlayers[0] : null;
  }

  if (variant === 'deals' || variant === 'points') {
    // Lowest score wins
    let winner: PracticePlayer | null = null;
    let lowestScore = Infinity;

    for (const player of players) {
      const score = scores[player.id] || 0;
      if (score < lowestScore) {
        lowestScore = score;
        winner = player;
      }
    }

    return winner;
  }

  return null;
};

/**
 * Calculate winnings for points rummy
 */
export const calculatePointsRummyWinnings = (
  winnerId: string,
  scores: { [playerId: string]: number },
  pointValue: number
): number => {
  let totalPoints = 0;

  for (const playerId of Object.keys(scores)) {
    if (playerId !== winnerId) {
      totalPoints += scores[playerId];
    }
  }

  return totalPoints * pointValue;
};

/**
 * Get score display string
 */
export const formatScore = (score: number): string => {
  return score.toString();
};

/**
 * Get player rank based on scores
 */
export const getPlayerRanks = (
  players: PracticePlayer[],
  scores: { [playerId: string]: number },
  variant: PracticeVariant,
  poolLimit?: number
): { playerId: string; rank: number; score: number }[] => {
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores[a.id] || 0;
    const scoreB = scores[b.id] || 0;

    if (variant === 'pool') {
      // In pool, lower is better (not eliminated)
      const eliminatedA = isPlayerEliminated(scoreA, variant, poolLimit);
      const eliminatedB = isPlayerEliminated(scoreB, variant, poolLimit);

      if (eliminatedA && !eliminatedB) return 1;
      if (!eliminatedA && eliminatedB) return -1;
    }

    // Lower score is better
    return scoreA - scoreB;
  });

  return sortedPlayers.map((player, index) => ({
    playerId: player.id,
    rank: index + 1,
    score: scores[player.id] || 0,
  }));
};

/**
 * Check if player can rejoin (pool rummy)
 */
export const canRejoin = (
  playerId: string,
  gameState: PracticeGameState
): boolean => {
  if (gameState.config.variant !== 'pool') {
    return false;
  }

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  const poolLimit = gameState.config.poolLimit || DEFAULT_POOL_LIMIT;

  // Check if player is eliminated
  if (!isPlayerEliminated(gameState.scores[playerId] || 0, gameState.config.variant, poolLimit)) {
    return false; // Not eliminated, can't rejoin
  }

  // Check if any active player is in compulsory play
  const firstDropPenalty = gameState.config.firstDropPenalty;

  const activePlayers = getActivePlayers(
    gameState.players,
    gameState.scores,
    gameState.config.variant,
    poolLimit
  );

  const someoneInCompulsory = activePlayers.some(p => {
    const score = gameState.scores[p.id] || 0;
    const remainingSpace = poolLimit - score;
    return remainingSpace < firstDropPenalty;
  });

  return !someoneInCompulsory;
};

/**
 * Calculate rejoin score
 */
export const calculateRejoinScore = (
  gameState: PracticeGameState
): number => {
  const poolLimit = gameState.config.poolLimit || DEFAULT_POOL_LIMIT;

  const activePlayers = getActivePlayers(
    gameState.players,
    gameState.scores,
    gameState.config.variant,
    poolLimit
  );

  if (activePlayers.length === 0) {
    return 0;
  }

  // Find highest score among active players
  const highestScore = Math.max(
    ...activePlayers.map(p => gameState.scores[p.id] || 0)
  );

  return highestScore + 1;
};
