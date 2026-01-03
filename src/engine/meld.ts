/**
 * Meld validation for the Rummy game engine
 * Validates sets and sequences according to Indian Rummy rules
 */

import { Card, Meld, MeldType, Suit, getRankIndex, RANKS } from './types';
import { isJoker } from './hand';

/**
 * Minimum cards required for a valid meld
 */
export const MIN_MELD_SIZE = 3;
export const MAX_SET_SIZE = 4;

/**
 * Check if cards form a valid set (same rank, different suits)
 * A set must have 3-4 cards of the same rank with different suits
 * Jokers can substitute for missing cards
 */
export const isValidSet = (cards: Card[]): boolean => {
  if (!cards || cards.length < MIN_MELD_SIZE || cards.length > MAX_SET_SIZE) {
    return false;
  }

  // Filter out invalid cards
  const validCards = cards.filter(c => c && c.id);
  if (validCards.length < MIN_MELD_SIZE) return false;

  const nonJokers = validCards.filter(c => !isJoker(c));
  const jokerCount = validCards.length - nonJokers.length;

  if (nonJokers.length === 0) {
    // All jokers is not a valid set
    return false;
  }

  // All non-jokers must have the same rank
  const rank = nonJokers[0].rank;
  if (!nonJokers.every(c => c.rank === rank)) {
    return false;
  }

  // All non-jokers must have different suits
  const suits = new Set(nonJokers.map(c => c.suit));
  if (suits.size !== nonJokers.length) {
    return false;
  }

  // With jokers filling in, total must be 3-4
  return nonJokers.length + jokerCount >= MIN_MELD_SIZE;
};

/**
 * Check if cards form a valid sequence (consecutive ranks, same suit)
 * A sequence must have 3+ cards of consecutive ranks in the same suit
 * Jokers can substitute for missing cards
 * A-2-3 is valid, Q-K-A is valid, K-A-2 is NOT valid
 */
export const isValidSequence = (cards: Card[]): boolean => {
  if (!cards || cards.length < MIN_MELD_SIZE) {
    return false;
  }

  // Filter out invalid cards
  const validCards = cards.filter(c => c && c.id);
  if (validCards.length < MIN_MELD_SIZE) return false;

  const nonJokers = validCards.filter(c => !isJoker(c));
  const jokerCount = validCards.length - nonJokers.length;

  if (nonJokers.length === 0) {
    // All jokers is not a valid sequence
    return false;
  }

  // All non-jokers must have the same suit
  const suit = nonJokers[0].suit;
  if (!nonJokers.every(c => c.suit === suit)) {
    return false;
  }

  // Check if this could be an A-2-3... sequence or Q-K-A sequence
  const hasAce = nonJokers.some(c => c.rank === 'A');
  const hasLowCards = nonJokers.some(c => {
    const idx = getRankIndex(c.rank);
    return idx >= 2 && idx <= 4; // 2, 3, 4
  });
  const hasHighCards = nonJokers.some(c => {
    const idx = getRankIndex(c.rank);
    return idx >= 10 && idx <= 13; // 10, J, Q, K
  });

  // Determine if Ace should be high or low
  // Ace is high (14) when we have high cards (10-K) and no low cards (2-4)
  // Ace is low (1) when we have low cards (2-4)
  const aceHigh = hasAce && hasHighCards && !hasLowCards;

  // Sort by rank with correct Ace interpretation
  const sorted = [...nonJokers].sort((a, b) =>
    getRankIndex(a.rank, aceHigh) - getRankIndex(b.rank, aceHigh)
  );

  // Try the sequence check
  const check = checkSequenceGaps(sorted, jokerCount, !aceHigh);
  if (check.isValid) {
    return true;
  }

  // If we have an ace, try the opposite interpretation
  if (hasAce) {
    const sortedAlt = [...nonJokers].sort((a, b) =>
      getRankIndex(a.rank, !aceHigh) - getRankIndex(b.rank, !aceHigh)
    );
    return checkSequenceGaps(sortedAlt, jokerCount, aceHigh).isValid;
  }

  return false;
};

/**
 * Helper to check gaps in a sequence
 * @param sorted - Cards sorted by rank
 * @param availableJokers - Number of jokers available to fill gaps
 * @param aceLow - If true, Ace is treated as 1; if false, Ace is treated as 14
 */
const checkSequenceGaps = (
  sorted: Card[],
  availableJokers: number,
  aceLow: boolean
): { isValid: boolean; jokersUsed: number } => {
  let jokersUsed = 0;

  for (let i = 1; i < sorted.length; i++) {
    // Use getRankIndex with aceHigh = !aceLow
    const prevRank = getRankIndex(sorted[i - 1].rank, !aceLow);
    const currRank = getRankIndex(sorted[i].rank, !aceLow);

    const gap = currRank - prevRank - 1;

    if (gap < 0) {
      // Cards are not in order or duplicate ranks
      return { isValid: false, jokersUsed: 0 };
    }

    if (gap > 0) {
      jokersUsed += gap;
      if (jokersUsed > availableJokers) {
        return { isValid: false, jokersUsed: 0 };
      }
    }
  }

  return { isValid: true, jokersUsed };
};

/**
 * Check if a sequence is pure (no jokers substituting for other cards)
 * A sequence with wild-ranked cards is still pure if they're used in their natural position
 * (same suit as sequence, filling their actual rank slot)
 */
export const isPureSequence = (cards: Card[]): boolean => {
  if (!isValidSequence(cards)) {
    return false;
  }

  // Printed jokers always make it impure - they're substituting
  if (cards.some(c => c.jokerType === 'printed')) {
    return false;
  }

  // If no wild jokers, it's pure
  const hasWildJoker = cards.some(c => c.jokerType === 'wild');
  if (!hasWildJoker) {
    return true;
  }

  // For wild jokers: check if they're used in their natural position
  // This means: all cards have same suit AND ranks are consecutive (no gaps)

  // Check all cards have same suit
  const suits = new Set(cards.map(c => c.suit));
  if (suits.size !== 1) {
    // Wild jokers have different suits - they're substituting
    return false;
  }

  // Determine Ace position
  const hasAce = cards.some(c => c.rank === 'A');
  const hasLowCards = cards.some(c => {
    const idx = getRankIndex(c.rank);
    return idx >= 2 && idx <= 4;
  });
  const hasHighCards = cards.some(c => {
    const idx = getRankIndex(c.rank);
    return idx >= 10 && idx <= 13;
  });
  const aceHigh = hasAce && hasHighCards && !hasLowCards;

  // Sort ALL cards by rank and check for consecutive ranks
  const sorted = [...cards].sort((a, b) =>
    getRankIndex(a.rank, aceHigh) - getRankIndex(b.rank, aceHigh)
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevRank = getRankIndex(sorted[i - 1].rank, aceHigh);
    const currRank = getRankIndex(sorted[i].rank, aceHigh);
    if (currRank - prevRank !== 1) {
      // Gap exists - wild jokers are filling gaps, not natural positions
      return false;
    }
  }

  // All cards same suit, consecutive ranks - wild jokers are in natural positions
  return true;
};

/**
 * Determine the type of a meld
 */
export const getMeldType = (cards: Card[]): MeldType | null => {
  if (isPureSequence(cards)) {
    return 'pure-sequence';
  }
  if (isValidSequence(cards)) {
    return 'sequence';
  }
  if (isValidSet(cards)) {
    return 'set';
  }
  return null;
};

/**
 * Create a Meld object from cards
 */
export const createMeld = (cards: Card[]): Meld | null => {
  const type = getMeldType(cards);
  if (!type) {
    return null;
  }

  return {
    type,
    cards: [...cards],
    isPure: type === 'pure-sequence',
  };
};

/**
 * Validate a meld object
 */
export const validateMeld = (meld: Meld): boolean => {
  const actualType = getMeldType(meld.cards);
  return actualType !== null && actualType === meld.type;
};

/**
 * Check if adding a card to a meld keeps it valid
 */
export const canAddToMeld = (meld: Meld, card: Card): boolean => {
  const newCards = [...meld.cards, card];

  if (meld.type === 'set') {
    return isValidSet(newCards) && newCards.length <= MAX_SET_SIZE;
  }

  // For sequences, card must extend at either end
  return isValidSequence(newCards);
};

/**
 * Find all possible ways to extend a meld with available cards
 */
export const findMeldExtensions = (meld: Meld, availableCards: Card[]): Card[] => {
  return availableCards.filter(card => canAddToMeld(meld, card));
};

/**
 * Split a long sequence into valid smaller sequences
 * For example: A-2-3-4-5-6 can be split into A-2-3 and 4-5-6
 */
export const splitSequence = (cards: Card[]): Meld[] => {
  if (!isValidSequence(cards)) {
    return [];
  }

  const melds: Meld[] = [];

  // If sequence is 3-5 cards, keep as one meld
  if (cards.length <= 5) {
    const meld = createMeld(cards);
    if (meld) melds.push(meld);
    return melds;
  }

  // For longer sequences, split into chunks of 3-4
  let remaining = [...cards];
  while (remaining.length >= 3) {
    const chunkSize = remaining.length >= 6 ? 3 : remaining.length;
    const chunk = remaining.slice(0, chunkSize);
    const meld = createMeld(chunk);
    if (meld) melds.push(meld);
    remaining = remaining.slice(chunkSize);
  }

  return melds;
};

/**
 * Find the best set combinations from cards of the same rank
 */
export const findBestSets = (cards: Card[]): Meld[] => {
  const byRank: { [rank: string]: Card[] } = {};

  for (const card of cards) {
    if (!isJoker(card)) {
      if (!byRank[card.rank]) {
        byRank[card.rank] = [];
      }
      byRank[card.rank].push(card);
    }
  }

  const melds: Meld[] = [];

  for (const rank of Object.keys(byRank)) {
    const rankCards = byRank[rank];

    // Filter to unique suits
    const seenSuits = new Set<Suit>();
    const uniqueSuitCards = rankCards.filter(card => {
      if (seenSuits.has(card.suit)) return false;
      seenSuits.add(card.suit);
      return true;
    });

    if (uniqueSuitCards.length >= 3) {
      const meld = createMeld(uniqueSuitCards.slice(0, 4));
      if (meld) melds.push(meld);
    }
  }

  return melds;
};

/**
 * Find the best sequence combinations for cards of the same suit
 */
export const findBestSequences = (cards: Card[]): Meld[] => {
  const bySuit: { [suit in Suit]: Card[] } = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: [],
  };

  for (const card of cards) {
    if (!isJoker(card)) {
      bySuit[card.suit].push(card);
    }
  }

  const melds: Meld[] = [];

  for (const suit of Object.keys(bySuit) as Suit[]) {
    const suitCards = bySuit[suit];
    if (suitCards.length < 3) continue;

    // Sort by rank
    const sorted = suitCards.sort((a, b) => getRankIndex(a.rank) - getRankIndex(b.rank));

    // Find consecutive runs
    let currentRun: Card[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prevRank = getRankIndex(sorted[i - 1].rank);
      const currRank = getRankIndex(sorted[i].rank);

      if (currRank === prevRank + 1) {
        currentRun.push(sorted[i]);
      } else if (currRank !== prevRank) {
        // End of run
        if (currentRun.length >= 3) {
          const meld = createMeld(currentRun);
          if (meld) melds.push(meld);
        }
        currentRun = [sorted[i]];
      }
    }

    // Check last run
    if (currentRun.length >= 3) {
      const meld = createMeld(currentRun);
      if (meld) melds.push(meld);
    }

    // Check for A-2-3 sequence
    const ace = sorted.find(c => c.rank === 'A');
    const two = sorted.find(c => c.rank === '2');
    const three = sorted.find(c => c.rank === '3');
    if (ace && two && three) {
      const meld = createMeld([ace, two, three]);
      if (meld) melds.push(meld);
    }
  }

  return melds;
};

/**
 * Get the rank order string for display
 */
export const getRankOrder = (): string => {
  return RANKS.join('-');
};
