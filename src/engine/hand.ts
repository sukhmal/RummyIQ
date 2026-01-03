/**
 * Hand analysis and management for the Rummy game engine
 */

import { Card, Suit, getRankIndex } from './types';

/**
 * Sort cards by suit, then by rank within each suit
 */
export const sortBySuit = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => {
    // Jokers go to the end
    if (a.jokerType === 'printed') return 1;
    if (b.jokerType === 'printed') return -1;
    if (a.jokerType === 'wild' && b.jokerType !== 'wild') return 1;
    if (b.jokerType === 'wild' && a.jokerType !== 'wild') return -1;

    // Sort by suit first
    const suitOrder: { [key in Suit]: number } = {
      spades: 0,
      hearts: 1,
      diamonds: 2,
      clubs: 3,
    };
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;

    // Then by rank
    return getRankIndex(a.rank) - getRankIndex(b.rank);
  });
};

/**
 * Sort cards by rank, grouping same ranks together
 */
export const sortByRank = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => {
    // Jokers go to the end
    if (a.jokerType === 'printed') return 1;
    if (b.jokerType === 'printed') return -1;
    if (a.jokerType === 'wild' && b.jokerType !== 'wild') return 1;
    if (b.jokerType === 'wild' && a.jokerType !== 'wild') return -1;

    // Sort by rank first
    const rankDiff = getRankIndex(a.rank) - getRankIndex(b.rank);
    if (rankDiff !== 0) return rankDiff;

    // Then by suit
    const suitOrder: { [key in Suit]: number } = {
      spades: 0,
      hearts: 1,
      diamonds: 2,
      clubs: 3,
    };
    return suitOrder[a.suit] - suitOrder[b.suit];
  });
};

/**
 * Group cards by suit
 */
export const groupBySuit = (cards: Card[]): { [key in Suit]: Card[] } => {
  const groups: { [key in Suit]: Card[] } = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: [],
  };

  for (const card of cards) {
    if (card.jokerType !== 'printed') {
      groups[card.suit].push(card);
    }
  }

  // Sort each group by rank
  for (const suit of Object.keys(groups) as Suit[]) {
    groups[suit].sort((a, b) => getRankIndex(a.rank) - getRankIndex(b.rank));
  }

  return groups;
};

/**
 * Group cards by rank
 */
export const groupByRank = (cards: Card[]): { [rank: string]: Card[] } => {
  const groups: { [rank: string]: Card[] } = {};

  for (const card of cards) {
    if (card.jokerType !== 'printed') {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    }
  }

  return groups;
};

/**
 * Get all jokers (printed and wild) from hand
 */
export const getJokers = (cards: Card[]): Card[] => {
  return cards.filter(card => card.jokerType !== null);
};

/**
 * Get non-joker cards
 */
export const getNonJokers = (cards: Card[]): Card[] => {
  return cards.filter(card => card.jokerType === null);
};

/**
 * Calculate total deadwood points
 */
export const calculateDeadwoodPoints = (cards: Card[]): number => {
  return cards.reduce((sum, card) => sum + card.value, 0);
};

/**
 * Find potential sequences in a suit
 * Returns all possible consecutive card runs
 */
export const findPotentialSequences = (cards: Card[]): Card[][] => {
  if (cards.length < 3) return [];

  // Sort by rank
  const sorted = [...cards].sort((a, b) => getRankIndex(a.rank) - getRankIndex(b.rank));
  const sequences: Card[][] = [];
  let currentSeq: Card[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevRank = getRankIndex(sorted[i - 1].rank);
    const currRank = getRankIndex(sorted[i].rank);

    if (currRank === prevRank + 1) {
      currentSeq.push(sorted[i]);
    } else if (currRank !== prevRank) {
      // Not consecutive and not duplicate
      if (currentSeq.length >= 3) {
        sequences.push([...currentSeq]);
      }
      currentSeq = [sorted[i]];
    }
    // Skip duplicates (same rank)
  }

  // Don't forget the last sequence
  if (currentSeq.length >= 3) {
    sequences.push(currentSeq);
  }

  // Also check for A-2-3 sequence if we have A at the end (A=14) and 2-3 at start
  const hasAce = sorted.some(c => c.rank === 'A');
  const hasTwo = sorted.some(c => c.rank === '2');
  const hasThree = sorted.some(c => c.rank === '3');

  if (hasAce && hasTwo && hasThree) {
    const ace = sorted.find(c => c.rank === 'A')!;
    const two = sorted.find(c => c.rank === '2')!;
    const three = sorted.find(c => c.rank === '3')!;
    sequences.push([ace, two, three]);
  }

  return sequences;
};

/**
 * Find potential sets (same rank, different suits)
 */
export const findPotentialSets = (cards: Card[]): Card[][] => {
  const byRank = groupByRank(cards);
  const sets: Card[][] = [];

  for (const rank of Object.keys(byRank)) {
    const rankCards = byRank[rank];
    // A set needs 3-4 cards of same rank, different suits
    if (rankCards.length >= 3) {
      // Filter to ensure different suits
      const uniqueSuits = new Set(rankCards.map(c => c.suit));
      if (uniqueSuits.size >= 3) {
        // Take cards with unique suits only
        const seenSuits = new Set<Suit>();
        const validSetCards = rankCards.filter(card => {
          if (seenSuits.has(card.suit)) return false;
          seenSuits.add(card.suit);
          return true;
        });
        if (validSetCards.length >= 3) {
          sets.push(validSetCards.slice(0, 4)); // Max 4 cards in a set
        }
      }
    }
  }

  return sets;
};

/**
 * Add a card to hand
 */
export const addCardToHand = (hand: Card[], card: Card): Card[] => {
  return [...hand, card];
};

/**
 * Remove a card from hand by ID
 */
export const removeCardFromHand = (hand: Card[], cardId: string): Card[] => {
  return hand.filter(card => card.id !== cardId);
};

/**
 * Check if hand contains a specific card
 */
export const handContainsCard = (hand: Card[], cardId: string): boolean => {
  return hand.some(card => card.id === cardId);
};

/**
 * Get hand size
 */
export const getHandSize = (hand: Card[]): number => {
  return hand.length;
};

/**
 * Check if card is a joker (printed or wild)
 */
export const isJoker = (card: Card): boolean => {
  return card.jokerType !== null;
};

/**
 * Find the best card to discard (highest value unmelded card)
 * This is a simple heuristic for bot decision making
 */
export const findBestDiscard = (
  hand: Card[],
  meldedCardIds: Set<string>
): Card | null => {
  const unmeldedCards = hand.filter(card => !meldedCardIds.has(card.id));

  if (unmeldedCards.length === 0) {
    // All cards are melded, discard any card
    return hand[hand.length - 1] || null;
  }

  // Sort by value descending, prefer discarding high-value cards
  const sorted = [...unmeldedCards].sort((a, b) => {
    // Never discard jokers if possible
    if (a.jokerType !== null && b.jokerType === null) return 1;
    if (b.jokerType !== null && a.jokerType === null) return -1;
    return b.value - a.value;
  });

  return sorted[0] || null;
};

/**
 * Evaluate hand quality (lower is better)
 * Returns a score based on potential melds and deadwood
 */
export const evaluateHand = (hand: Card[]): number => {
  const nonJokers = getNonJokers(hand);
  const jokers = getJokers(hand);
  const bySuit = groupBySuit(nonJokers);

  let potentialMeldCards = 0;

  // Count cards in potential sequences
  for (const suit of Object.keys(bySuit) as Suit[]) {
    const sequences = findPotentialSequences(bySuit[suit]);
    for (const seq of sequences) {
      potentialMeldCards += seq.length;
    }
  }

  // Count cards in potential sets
  const sets = findPotentialSets(nonJokers);
  for (const set of sets) {
    potentialMeldCards += set.length;
  }

  // Jokers are always valuable
  potentialMeldCards += jokers.length * 2;

  // Score is total deadwood minus potential meld value
  const totalPoints = calculateDeadwoodPoints(hand);
  return totalPoints - potentialMeldCards * 5;
};
