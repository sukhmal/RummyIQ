/**
 * Rummy Game Engine
 *
 * A complete game engine for Indian Rummy, including:
 * - Card and deck management
 * - Hand analysis and meld validation
 * - Declaration rules
 * - Scoring system
 * - Bot AI (in ./bot/)
 */

// Types
export * from './types';

// Deck operations
export {
  createDeck,
  createDecks,
  shuffle,
  dealCards,
  drawFromPile,
  drawFromDiscard,
  discardCard,
  refillDrawPile,
  getCardDisplay,
} from './deck';
export type { DealResult } from './deck';

// Hand operations
export {
  sortBySuit,
  sortByRank,
  groupBySuit,
  groupByRank,
  getJokers,
  getNonJokers,
  calculateDeadwoodPoints,
  findPotentialSequences,
  findPotentialSets,
  addCardToHand,
  removeCardFromHand,
  handContainsCard,
  getHandSize,
  isJoker,
  findBestDiscard,
  evaluateHand,
} from './hand';

// Meld operations
export {
  MIN_MELD_SIZE,
  MAX_SET_SIZE,
  isValidSet,
  isValidSequence,
  isPureSequence,
  getMeldType,
  createMeld,
  validateMeld,
  canAddToMeld,
  findMeldExtensions,
  splitSequence,
  findBestSets,
  findBestSequences,
  getRankOrder,
} from './meld';

// Declaration
export {
  validateDeclaration,
  autoArrangeHand,
  canDeclare,
  getDeclarationHint,
} from './declaration';
export type { DeclarationResult } from './declaration';

// Scoring
export {
  MAX_ROUND_POINTS,
  DEFAULT_FIRST_DROP,
  DEFAULT_MIDDLE_DROP,
  DEFAULT_INVALID_DECLARATION,
  calculateHandPoints,
  calculateInvalidDeclarationPoints,
  calculateDropPoints,
  calculateRoundScores,
  updateCumulativeScores,
  isPlayerEliminated,
  getActivePlayers,
  shouldGameEnd,
  determineGameWinner,
  calculatePointsRummyWinnings,
  formatScore,
  getPlayerRanks,
  canRejoin,
  calculateRejoinScore,
} from './scoring';
export type { RoundScoreResult } from './scoring';
