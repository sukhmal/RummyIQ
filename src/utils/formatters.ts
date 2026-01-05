/**
 * Shared Formatting Utilities
 *
 * Common formatting functions used across Scorer and Practice modes.
 */

import { Game, GameVariant } from '../types/game';

/**
 * Format a date for display (e.g., "Jan 15")
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get a display label for the game type
 * @param variant - The game variant
 * @param poolLimit - Pool limit for pool games
 * @param numberOfDeals - Number of deals for deals games
 * @param currentDeal - Current deal number (optional, for "Deal X/Y" format)
 */
export const getGameTypeLabel = (
  variant: GameVariant,
  poolLimit?: number,
  numberOfDeals?: number,
  currentDeal?: number
): string => {
  if (variant === 'pool') {
    return `Pool ${poolLimit || 101}`;
  } else if (variant === 'deals') {
    if (currentDeal !== undefined) {
      return `Deal ${currentDeal}/${numberOfDeals || 2}`;
    }
    return `${numberOfDeals || 2} Deals`;
  }
  return 'Points';
};

/**
 * Get a summary of a completed game
 */
export const getGameSummary = (game: Game): {
  winner: string;
  variant: string;
  players: number;
  rounds: number;
} => {
  const winnerPlayer = game.players.find(p => p.id === game.winner);
  const variant = game.config.variant === 'pool'
    ? `Pool ${game.config.poolLimit}`
    : game.config.variant === 'deals'
    ? `Deals ${game.config.numberOfDeals}`
    : 'Points';
  return {
    winner: winnerPlayer?.name || 'Unknown',
    variant,
    players: game.players.length,
    rounds: game.rounds.length,
  };
};
