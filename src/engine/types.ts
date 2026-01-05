/**
 * Core types for the Rummy game engine
 */

import {
  GameVariant,
  BaseGameConfig,
  BasePlayer,
} from '../types/shared';

// Re-export shared types
export type { GameVariant };
export type PracticeVariant = GameVariant; // Alias for backward compatibility

// Card suits
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

// Card ranks (A can be low or high in sequences)
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// Joker types
export type JokerType = 'printed' | 'wild' | null;

/**
 * Represents a single playing card
 */
export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  jokerType: JokerType;
  value: number; // Point value (A=10, 2-10=face value, J/Q/K=10, Joker=0)
}

/**
 * Types of valid melds in Indian Rummy
 */
export type MeldType = 'set' | 'sequence' | 'pure-sequence';

/**
 * A meld is a valid group of cards (set or sequence)
 */
export interface Meld {
  type: MeldType;
  cards: Card[];
  isPure: boolean; // True if no jokers used
}

/**
 * Result of analyzing a hand for potential melds
 */
export interface HandAnalysis {
  melds: Meld[];
  deadwood: Card[]; // Cards not in any meld
  deadwoodPoints: number;
  hasPureSequence: boolean;
  sequenceCount: number;
  canDeclare: boolean; // True if valid declaration possible
}

/**
 * Bot difficulty levels
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * A player in the practice game
 */
export interface PracticePlayer extends BasePlayer {
  isBot: boolean;
  difficulty?: BotDifficulty;
  avatar?: string;
}

/**
 * Result of a completed round
 */
export interface RoundResult {
  winnerId: string;
  winnerName: string;
  declarationType: 'valid' | 'invalid' | 'drop-first' | 'drop-middle';
  scores: { [playerId: string]: number };
  timestamp: number;
  declaredMelds?: Meld[]; // Melds as declared by the winner (if declaration)
  finalHands?: { [playerId: string]: Card[] }; // All players' hands at round end
}

/**
 * Configuration for a practice game
 */
export interface PracticeGameConfig extends BaseGameConfig {
  firstDropPenalty: number;
  middleDropPenalty: number;
  invalidDeclarationPenalty: number;
}

/**
 * Current phase of a round
 */
export type RoundPhase = 'dealing' | 'playing' | 'declaring' | 'ended';

/**
 * Turn phase within a player's turn
 */
export type TurnPhase = 'draw' | 'discard';

/**
 * Draw source options
 */
export type DrawSource = 'deck' | 'discard';

/**
 * State of a single round
 */
export interface RoundState {
  roundNumber: number;
  phase: RoundPhase;
  turnPhase: TurnPhase;
  currentPlayerIndex: number;
  dealerIndex: number;
  hands: { [playerId: string]: Card[] };
  drawPile: Card[];
  discardPile: Card[];
  wildJokerCard: Card | null; // The card that determines wild jokers
  droppedPlayers: string[]; // IDs of players who dropped this round
  humanHasDrawn: boolean; // Has human drawn at least once (for drop penalty: 25 before, 50 after)
  lastAction?: {
    playerId: string;
    action: 'draw' | 'discard' | 'declare' | 'drop';
    card?: Card;
    source?: DrawSource;
  };
}

/**
 * Complete state of a practice game
 */
export interface PracticeGameState {
  id: string;
  config: PracticeGameConfig;
  players: PracticePlayer[];
  activePlayers: string[]; // IDs of players still in game (not eliminated)
  currentRound: RoundState | null;
  roundResults: RoundResult[];
  scores: { [playerId: string]: number }; // Cumulative scores
  gamePhase: 'setup' | 'playing' | 'ended';
  winner: PracticePlayer | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Action types for game state updates
 */
export type GameAction =
  | { type: 'START_ROUND' }
  | { type: 'DRAW_CARD'; playerId: string; source: DrawSource }
  | { type: 'DISCARD_CARD'; playerId: string; card: Card }
  | { type: 'DECLARE'; playerId: string; melds: Meld[]; deadwood: Card[] }
  | { type: 'DROP'; playerId: string; dropType: 'first' | 'middle' }
  | { type: 'END_ROUND'; result: RoundResult }
  | { type: 'END_GAME'; winnerId: string };

/**
 * Bot decision result
 */
export interface BotDecision {
  action: 'draw' | 'discard' | 'declare' | 'drop';
  card?: Card; // Card to discard or draw from discard
  source?: DrawSource;
  melds?: Meld[];
  dropType?: 'first' | 'middle';
  thinkingTime: number; // Milliseconds to wait before executing
}

/**
 * Constants for the game
 */
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const CARDS_PER_PLAYER = 13;
export const PRINTED_JOKERS_PER_DECK = 2;

/**
 * Get point value for a card
 */
export const getCardValue = (card: Card): number => {
  if (card.jokerType === 'printed') return 0;
  if (card.rank === 'A' || card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return parseInt(card.rank, 10);
};

/**
 * Get rank index for sorting (A can be 1 or 14)
 */
export const getRankIndex = (rank: Rank, aceHigh = false): number => {
  if (rank === 'A') return aceHigh ? 14 : 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
};

/**
 * Default pool limit for practice mode
 */
export const DEFAULT_POOL_LIMIT = 201;
