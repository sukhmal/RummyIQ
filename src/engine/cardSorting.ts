/**
 * Card Sorting Utilities
 *
 * Smart sorting algorithms for organizing cards by potential melds.
 */

import { Card, Suit, getRankIndex, SUITS } from './types';

/**
 * Sort cards by suit, then by rank within each suit
 */
export const sortBySuit = (cards: Card[]): Card[] => {
  const suitOrder: Record<Suit, number> = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
  };

  return [...cards].sort((a, b) => {
    // Jokers go to the end
    if (a.jokerType === 'printed') return 1;
    if (b.jokerType === 'printed') return -1;

    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;

    return getRankIndex(a.rank) - getRankIndex(b.rank);
  });
};

/**
 * Sort cards by rank, grouping same ranks together (for sets)
 */
export const sortByRank = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => {
    // Jokers go to the end
    if (a.jokerType === 'printed') return 1;
    if (b.jokerType === 'printed') return -1;

    const rankDiff = getRankIndex(a.rank) - getRankIndex(b.rank);
    if (rankDiff !== 0) return rankDiff;

    const suitOrder: Record<Suit, number> = {
      hearts: 0,
      diamonds: 1,
      clubs: 2,
      spades: 3,
    };
    return suitOrder[a.suit] - suitOrder[b.suit];
  });
};

/**
 * Find potential sequences in a set of cards
 */
const findPotentialSequences = (cards: Card[]): Card[][] => {
  const sequences: Card[][] = [];
  const cardsBySuit: Record<Suit, Card[]> = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  };

  // Group cards by suit
  cards.forEach(card => {
    if (card.jokerType !== 'printed') {
      cardsBySuit[card.suit].push(card);
    }
  });

  // Find sequences in each suit
  SUITS.forEach(suit => {
    const suitCards = cardsBySuit[suit].sort(
      (a, b) => getRankIndex(a.rank) - getRankIndex(b.rank)
    );

    if (suitCards.length >= 2) {
      let currentSeq: Card[] = [suitCards[0]];

      for (let i = 1; i < suitCards.length; i++) {
        const prevRank = getRankIndex(suitCards[i - 1].rank);
        const currRank = getRankIndex(suitCards[i].rank);

        if (currRank === prevRank + 1) {
          currentSeq.push(suitCards[i]);
        } else {
          if (currentSeq.length >= 2) {
            sequences.push(currentSeq);
          }
          currentSeq = [suitCards[i]];
        }
      }

      if (currentSeq.length >= 2) {
        sequences.push(currentSeq);
      }
    }
  });

  return sequences;
};

/**
 * Find potential sets in a collection of cards
 */
const findPotentialSets = (cards: Card[]): Card[][] => {
  const sets: Card[][] = [];
  const cardsByRank: Record<string, Card[]> = {};

  // Group cards by rank
  cards.forEach(card => {
    if (card.jokerType !== 'printed') {
      if (!cardsByRank[card.rank]) {
        cardsByRank[card.rank] = [];
      }
      cardsByRank[card.rank].push(card);
    }
  });

  // Find sets (2+ cards of same rank)
  Object.values(cardsByRank).forEach(rankCards => {
    if (rankCards.length >= 2) {
      sets.push(rankCards);
    }
  });

  return sets;
};

/**
 * Card with meld group information for visual grouping
 */
export interface CardWithGroup extends Card {
  groupIndex: number;
}

/**
 * Smart sort: group cards by potential melds (sequences and sets)
 * Priority: sequences first, then sets, then remaining cards by suit
 * Returns cards with groupIndex for visual meld separation
 */
export const smartSort = (cards: Card[]): Card[] => {
  return smartSortWithGroups(cards).map(({ groupIndex: _g, ...card }) => card as Card);
};

/**
 * Smart sort with meld group indices for visual gaps
 */
export const smartSortWithGroups = (cards: Card[]): CardWithGroup[] => {
  const result: CardWithGroup[] = [];
  const used = new Set<string>();
  let currentGroupIndex = 0;

  // Find potential sequences (prioritize longer ones)
  const sequences = findPotentialSequences(cards).sort((a, b) => b.length - a.length);

  // Add sequences to result
  sequences.forEach(seq => {
    const addedAny = seq.some(card => !used.has(card.id));
    if (addedAny) {
      seq.forEach(card => {
        if (!used.has(card.id)) {
          result.push({ ...card, groupIndex: currentGroupIndex });
          used.add(card.id);
        }
      });
      currentGroupIndex++;
    }
  });

  // Find potential sets from remaining cards
  const remainingCards = cards.filter(c => !used.has(c.id));
  const sets = findPotentialSets(remainingCards).sort((a, b) => b.length - a.length);

  // Add sets to result
  sets.forEach(set => {
    const addedAny = set.some(card => !used.has(card.id));
    if (addedAny) {
      set.forEach(card => {
        if (!used.has(card.id)) {
          result.push({ ...card, groupIndex: currentGroupIndex });
          used.add(card.id);
        }
      });
      currentGroupIndex++;
    }
  });

  // Add remaining cards sorted by suit (excluding jokers) - all in one group (deadwood)
  const finalRemaining = cards.filter(c => !used.has(c.id) && c.jokerType !== 'printed');
  const sortedRemaining = sortBySuit(finalRemaining);
  if (sortedRemaining.length > 0) {
    sortedRemaining.forEach(card => {
      result.push({ ...card, groupIndex: currentGroupIndex });
      used.add(card.id);
    });
    currentGroupIndex++;
  }

  // Add jokers at the end (own group)
  const jokers = cards.filter(c => c.jokerType === 'printed');
  jokers.forEach(joker => {
    if (!used.has(joker.id)) {
      result.push({ ...joker, groupIndex: currentGroupIndex });
      used.add(joker.id);
    }
  });

  return result;
};

/**
 * Move a card from one position to another
 */
export const moveCard = (
  cards: Card[],
  fromIndex: number,
  toIndex: number
): Card[] => {
  const result = [...cards];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};
