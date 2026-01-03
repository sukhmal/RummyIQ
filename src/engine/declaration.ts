/**
 * Declaration validation for the Rummy game engine
 * Validates complete hand declarations according to Indian Rummy rules
 */

import { Card, Meld, HandAnalysis, CARDS_PER_PLAYER } from './types';
import {
  isValidSequence,
  createMeld,
  validateMeld,
} from './meld';
import { calculateDeadwoodPoints, isJoker } from './hand';

/**
 * Declaration requirements for Indian Rummy:
 * 1. All 13 cards must be melded (no deadwood) for valid declaration
 * 2. Must have at least 2 sequences
 * 3. At least one sequence must be pure (no jokers)
 * 4. Remaining cards can be in sets or sequences
 */

export interface DeclarationResult {
  isValid: boolean;
  hasPureSequence: boolean;
  hasMinimumSequences: boolean;
  allCardsMelded: boolean;
  melds: Meld[];
  deadwood: Card[];
  deadwoodPoints: number;
  errors: string[];
}

/**
 * Validate a player's declaration
 * Takes the cards arranged into groups by the player
 *
 * Indian Rummy Rules:
 * 1. Must have at least 1 pure sequence (no jokers)
 * 2. Must have at least 2 sequences total (pure + impure sequences)
 * 3. Sets are ONLY valid if the 2-sequence requirement is met
 * 4. If no pure sequence, max score is 80 (invalid declaration)
 * 5. If no second sequence, sets don't count and are treated as deadwood
 */
export const validateDeclaration = (
  melds: Meld[],
  deadwood: Card[] = []
): DeclarationResult => {
  const errors: string[] = [];

  // First pass: validate individual melds and separate sequences from sets
  const validSequences: Meld[] = [];
  const validSets: Meld[] = [];
  const invalidCards: Card[] = [];

  for (const meld of melds) {
    if (validateMeld(meld)) {
      if (meld.type === 'sequence' || meld.type === 'pure-sequence') {
        validSequences.push(meld);
      } else if (meld.type === 'set') {
        validSets.push(meld);
      }
    } else {
      // Invalid meld - add cards to deadwood
      invalidCards.push(...meld.cards);
      errors.push(`Invalid meld: ${meld.cards.map(c => c.id).join(', ')}`);
    }
  }

  // Count sequences
  const pureSequences = validSequences.filter(m => m.type === 'pure-sequence');
  const hasPureSequence = pureSequences.length >= 1;
  const hasMinimumSequences = validSequences.length >= 2;

  // IMPORTANT: Sets are only valid if the sequence requirement is met
  // If not enough sequences, sets become deadwood
  let finalMelds: Meld[] = [...validSequences];
  let setsAsDeadwood: Card[] = [];

  if (hasMinimumSequences) {
    // Sequence requirement met - sets are valid
    finalMelds = [...finalMelds, ...validSets];
  } else {
    // Sequence requirement NOT met - sets become deadwood
    for (const set of validSets) {
      setsAsDeadwood.push(...set.cards);
    }
    if (validSets.length > 0) {
      errors.push('Sets are not valid without 2 sequences - they count as deadwood');
    }
  }

  const allDeadwood = [...deadwood, ...invalidCards, ...setsAsDeadwood];
  const deadwoodPoints = calculateDeadwoodPoints(allDeadwood);
  const allCardsMelded = allDeadwood.length === 0;

  if (!hasPureSequence) {
    errors.push('Declaration must have at least one pure sequence (without jokers)');
  }

  if (!hasMinimumSequences) {
    errors.push('Declaration must have at least 2 sequences');
  }

  if (!allCardsMelded) {
    errors.push(`${allDeadwood.length} cards are not melded (${deadwoodPoints} points)`);
  }

  // Check total cards
  const totalCards = finalMelds.reduce((sum, m) => sum + m.cards.length, 0) + allDeadwood.length;
  if (totalCards !== CARDS_PER_PLAYER) {
    errors.push(`Expected ${CARDS_PER_PLAYER} cards, got ${totalCards}`);
  }

  return {
    isValid: hasPureSequence && hasMinimumSequences && allCardsMelded && errors.length === 0,
    hasPureSequence,
    hasMinimumSequences,
    allCardsMelded,
    melds: finalMelds,
    deadwood: allDeadwood,
    deadwoodPoints,
    errors,
  };
};

/**
 * Auto-arrange cards into optimal melds
 * Returns the best possible arrangement of the hand
 */
export const autoArrangeHand = (cards: Card[]): HandAnalysis => {
  // Handle empty or invalid input
  if (!cards || cards.length === 0) {
    return {
      melds: [],
      deadwood: [],
      deadwoodPoints: 0,
      hasPureSequence: false,
      sequenceCount: 0,
      canDeclare: false,
    };
  }

  // This is a complex optimization problem
  // We use a greedy approach with backtracking

  // Filter out any undefined cards
  const validCards = cards.filter(c => c && c.id);
  const jokers = validCards.filter(c => isJoker(c));
  const nonJokers = validCards.filter(c => !isJoker(c));

  // Find all possible pure sequences first (they're required)
  const pureSequences = findAllPureSequences(nonJokers);

  // Try different combinations
  let bestResult: HandAnalysis = {
    melds: [],
    deadwood: [...validCards],
    deadwoodPoints: calculateDeadwoodPoints(validCards),
    hasPureSequence: false,
    sequenceCount: 0,
    canDeclare: false,
  };

  // Try each pure sequence as the starting point
  for (const pureSeq of pureSequences) {
    const remaining = excludeCards(nonJokers, pureSeq);
    const result = findBestArrangement(remaining, jokers, [createMeld(pureSeq)!]);

    if (result.deadwoodPoints < bestResult.deadwoodPoints) {
      bestResult = result;
    }

    if (result.canDeclare) {
      return result; // Found valid declaration, return immediately
    }
  }

  // If no pure sequences, still try to make the best arrangement
  if (pureSequences.length === 0) {
    bestResult = findBestArrangement(nonJokers, jokers, []);
  }

  return bestResult;
};

/**
 * Find all possible pure sequences in the cards
 */
const findAllPureSequences = (cards: Card[]): Card[][] => {
  if (!cards || cards.length === 0) return [];

  const bySuit: { [suit: string]: Card[] } = {};

  for (const card of cards) {
    if (!card || !card.suit) continue;
    if (!bySuit[card.suit]) {
      bySuit[card.suit] = [];
    }
    bySuit[card.suit].push(card);
  }

  const sequences: Card[][] = [];

  for (const suit of Object.keys(bySuit)) {
    const suitCards = bySuit[suit].sort((a, b) => {
      const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const aIdx = a?.rank ? rankOrder.indexOf(a.rank) : -1;
      const bIdx = b?.rank ? rankOrder.indexOf(b.rank) : -1;
      return aIdx - bIdx;
    });

    // Find all consecutive runs of 3+
    findConsecutiveRuns(suitCards, sequences);
  }

  return sequences;
};

/**
 * Find consecutive runs in sorted cards
 */
const findConsecutiveRuns = (sorted: Card[], result: Card[][]): void => {
  if (!sorted || sorted.length < 3) return;

  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Filter out any null/undefined cards
  const validSorted = sorted.filter(c => c && c.rank);
  if (validSorted.length < 3) return;

  let currentRun: Card[] = [validSorted[0]];

  for (let i = 1; i < validSorted.length; i++) {
    const prevIdx = rankOrder.indexOf(validSorted[i - 1].rank);
    const currIdx = rankOrder.indexOf(validSorted[i].rank);

    if (currIdx === prevIdx + 1) {
      currentRun.push(validSorted[i]);
    } else {
      if (currentRun.length >= 3) {
        // Add all valid subsequences of length 3+
        addAllSubsequences(currentRun, result);
      }
      currentRun = [validSorted[i]];
    }
  }

  if (currentRun.length >= 3) {
    addAllSubsequences(currentRun, result);
  }

  // Check for A-2-3 sequence
  const ace = validSorted.find(c => c.rank === 'A');
  const two = validSorted.find(c => c.rank === '2');
  const three = validSorted.find(c => c.rank === '3');
  if (ace && two && three) {
    result.push([ace, two, three]);
  }
};

/**
 * Add all valid subsequences of a run
 */
const addAllSubsequences = (run: Card[], result: Card[][]): void => {
  // Add the full run
  result.push([...run]);

  // Add smaller valid subsequences
  if (run.length > 3) {
    for (let start = 0; start <= run.length - 3; start++) {
      for (let end = start + 3; end <= run.length; end++) {
        if (end - start !== run.length) {
          // Don't add duplicates
          result.push(run.slice(start, end));
        }
      }
    }
  }
};

/**
 * Remove used cards from array
 */
const excludeCards = (cards: Card[], used: Card[]): Card[] => {
  const usedIds = new Set(used.map(c => c.id));
  return cards.filter(c => !usedIds.has(c.id));
};

/**
 * Find best arrangement of remaining cards
 * Prioritizes having 2+ sequences over having longer sequences
 */
const findBestArrangement = (
  remainingNonJokers: Card[],
  jokers: Card[],
  existingMelds: Meld[]
): HandAnalysis => {
  // Count existing sequences
  const existingSequenceCount = existingMelds.filter(
    m => m.type === 'sequence' || m.type === 'pure-sequence'
  ).length;

  let melds = [...existingMelds];
  let remaining = [...remainingNonJokers];
  let unusedJokers = [...jokers];

  // Find all pure sequences in remaining cards
  const sequences = findAllPureSequences(remaining);

  // If we need more sequences to reach 2, prefer shorter sequences (to leave cards for more)
  // Otherwise, prefer longer sequences (to minimize deadwood)
  const needMoreSequences = existingSequenceCount < 2;
  if (needMoreSequences) {
    // Sort by length ascending - prefer shorter sequences to maximize count
    sequences.sort((a, b) => a.length - b.length);
  } else {
    // Sort by length descending - prefer longer sequences
    sequences.sort((a, b) => b.length - a.length);
  }

  // If we need 2 sequences and have a long sequence (6+ cards), try splitting it
  if (needMoreSequences) {
    const longSequences = sequences.filter(s => s.length >= 6);
    for (const longSeq of longSequences) {
      // Try to split into two valid sequences
      if (longSeq.length >= 6) {
        const firstHalf = longSeq.slice(0, 3);
        const secondHalf = longSeq.slice(3);
        if (secondHalf.length >= 3) {
          // Check if both halves are still available
          if (longSeq.every(c => remaining.some(r => r.id === c.id))) {
            const meld1 = createMeld(firstHalf);
            const meld2 = createMeld(secondHalf);
            if (meld1 && meld2) {
              melds.push(meld1);
              melds.push(meld2);
              remaining = excludeCards(remaining, longSeq);
            }
          }
        }
      }
    }
  }

  // Add remaining sequences
  for (const seq of sequences) {
    // Check if these cards are still available
    if (seq.every(c => remaining.some(r => r.id === c.id))) {
      const meld = createMeld(seq);
      if (meld) {
        melds.push(meld);
        remaining = excludeCards(remaining, seq);
      }
    }
  }

  // Count current sequences (including existing melds)
  const currentSequenceCount = melds.filter(
    m => m.type === 'sequence' || m.type === 'pure-sequence'
  ).length;

  // Find sets - but only add them if we have 2+ sequences
  // Otherwise, sets don't count towards a valid declaration
  const sets = findSets(remaining);
  if (currentSequenceCount >= 2) {
    // Sequence requirement met - sets are valid
    for (const set of sets) {
      const meld = createMeld(set);
      if (meld) {
        melds.push(meld);
        remaining = excludeCards(remaining, set);
      }
    }
  }
  // If not enough sequences, sets stay as deadwood (remaining cards)

  // Try to apply jokers to complete near-melds
  // Pass whether we need more sequences - if so, prioritize sequence completion
  const needSequences = melds.filter(m => m.type === 'sequence' || m.type === 'pure-sequence').length < 2;
  const { newMelds, leftover, usedJokers } = applyJokersToComplete(remaining, unusedJokers, needSequences);
  melds = [...melds, ...newMelds];
  remaining = leftover;
  unusedJokers = excludeCards(unusedJokers, usedJokers);

  // Remaining cards + unused jokers are deadwood
  const deadwood = [...remaining, ...unusedJokers];
  const deadwoodPoints = calculateDeadwoodPoints(deadwood);

  const pureSequences = melds.filter(m => m.type === 'pure-sequence');
  const allSequences = melds.filter(m => m.type === 'sequence' || m.type === 'pure-sequence');

  return {
    melds,
    deadwood,
    deadwoodPoints,
    hasPureSequence: pureSequences.length > 0,
    sequenceCount: allSequences.length,
    canDeclare: pureSequences.length >= 1 && allSequences.length >= 2 && deadwood.length === 0,
  };
};

/**
 * Find sets in cards
 */
const findSets = (cards: Card[]): Card[][] => {
  if (!cards || cards.length === 0) return [];

  const byRank: { [rank: string]: Card[] } = {};

  for (const card of cards) {
    if (!card || !card.rank) continue;
    if (!byRank[card.rank]) {
      byRank[card.rank] = [];
    }
    byRank[card.rank].push(card);
  }

  const sets: Card[][] = [];

  for (const rank of Object.keys(byRank)) {
    const rankCards = byRank[rank];
    // Ensure different suits
    const seenSuits = new Set<string>();
    const uniqueSuitCards = rankCards.filter(c => {
      if (seenSuits.has(c.suit)) return false;
      seenSuits.add(c.suit);
      return true;
    });

    if (uniqueSuitCards.length >= 3) {
      sets.push(uniqueSuitCards.slice(0, 4));
    }
  }

  return sets;
};

/**
 * Apply jokers to complete near-melds
 * @param prioritizeSequences - If true, try to make sequences before sets (needed when < 2 sequences)
 */
const applyJokersToComplete = (
  cards: Card[],
  jokers: Card[],
  prioritizeSequences: boolean = false
): { newMelds: Meld[]; leftover: Card[]; usedJokers: Card[] } => {
  if (!cards) cards = [];
  if (!jokers) jokers = [];

  const newMelds: Meld[] = [];
  let leftover = [...cards].filter(c => c && c.id);
  let usedJokers: Card[] = [];
  let availableJokers = [...jokers].filter(c => c && c.id);

  // Helper to try completing sequences with jokers
  const tryCompleteSequences = (): void => {
    const bySuit: { [suit: string]: Card[] } = {};
    for (const card of leftover) {
      if (!card || !card.suit) continue;
      if (!bySuit[card.suit]) {
        bySuit[card.suit] = [];
      }
      bySuit[card.suit].push(card);
    }

    for (const suit of Object.keys(bySuit)) {
      const suitCards = bySuit[suit].sort((a, b) => {
        const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
      });

      // Look for consecutive pairs (gap of 1) that need 1 joker to complete
      for (let i = 0; i < suitCards.length - 1 && availableJokers.length > 0; i++) {
        // Check if these cards are still in leftover
        if (!leftover.some(c => c.id === suitCards[i].id) ||
            !leftover.some(c => c.id === suitCards[i + 1].id)) {
          continue;
        }

        const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const idx1 = rankOrder.indexOf(suitCards[i].rank);
        const idx2 = rankOrder.indexOf(suitCards[i + 1].rank);
        const gap = idx2 - idx1;

        if (gap === 1 && availableJokers.length >= 1) {
          // Consecutive cards - add joker at end or beginning
          const jokerToUse = availableJokers[0];
          // Try adding at end
          const meldAtEnd = createMeld([suitCards[i], suitCards[i + 1], jokerToUse]);
          if (meldAtEnd && isValidSequence([suitCards[i], suitCards[i + 1], jokerToUse])) {
            newMelds.push(meldAtEnd);
            leftover = excludeCards(leftover, [suitCards[i], suitCards[i + 1]]);
            usedJokers.push(jokerToUse);
            availableJokers = availableJokers.slice(1);
            continue;
          }
          // Try adding at beginning
          const meldAtStart = createMeld([jokerToUse, suitCards[i], suitCards[i + 1]]);
          if (meldAtStart && isValidSequence([jokerToUse, suitCards[i], suitCards[i + 1]])) {
            newMelds.push(meldAtStart);
            leftover = excludeCards(leftover, [suitCards[i], suitCards[i + 1]]);
            usedJokers.push(jokerToUse);
            availableJokers = availableJokers.slice(1);
            continue;
          }
        } else if (gap === 2 && availableJokers.length >= 1) {
          // Gap of 1 card - need 1 joker in the middle
          const jokerToUse = availableJokers[0];
          const meld = createMeld([suitCards[i], jokerToUse, suitCards[i + 1]]);
          if (meld && isValidSequence([suitCards[i], jokerToUse, suitCards[i + 1]])) {
            newMelds.push(meld);
            leftover = excludeCards(leftover, [suitCards[i], suitCards[i + 1]]);
            usedJokers.push(jokerToUse);
            availableJokers = availableJokers.slice(1);
          }
        }
      }
    }
  };

  // Helper to try completing sets with jokers
  const tryCompleteSets = (): void => {
    const byRank: { [rank: string]: Card[] } = {};
    for (const card of leftover) {
      if (!card || !card.rank) continue;
      if (!byRank[card.rank]) {
        byRank[card.rank] = [];
      }
      byRank[card.rank].push(card);
    }

    for (const rank of Object.keys(byRank)) {
      const rankCards = byRank[rank];
      const seenSuits = new Set<string>();
      const uniqueSuitCards = rankCards.filter(c => {
        if (!leftover.some(l => l.id === c.id)) return false; // Card already used
        if (seenSuits.has(c.suit)) return false;
        seenSuits.add(c.suit);
        return true;
      });

      if (uniqueSuitCards.length === 2 && availableJokers.length >= 1) {
        // Can make a set with 1 joker
        const jokerToUse = availableJokers[0];
        const meld = createMeld([...uniqueSuitCards, jokerToUse]);
        if (meld) {
          newMelds.push(meld);
          leftover = excludeCards(leftover, uniqueSuitCards);
          usedJokers.push(jokerToUse);
          availableJokers = availableJokers.slice(1);
        }
      }
    }
  };

  // Apply in order based on priority
  if (prioritizeSequences) {
    // When we need more sequences, ONLY try sequences - don't waste jokers on sets
    // Sets don't count without 2 sequences anyway
    tryCompleteSequences();
    // Don't try sets - they won't count and waste jokers
  } else {
    // We have 2+ sequences, so sets are valid
    tryCompleteSets();
    tryCompleteSequences();
  }

  return { newMelds, leftover, usedJokers };
};

/**
 * Check if a declaration would be valid before submitting
 */
export const canDeclare = (cards: Card[]): boolean => {
  if (cards.length !== CARDS_PER_PLAYER) {
    return false;
  }

  const analysis = autoArrangeHand(cards);
  return analysis.canDeclare;
};

/**
 * Get a hint about what's needed for a valid declaration
 */
export const getDeclarationHint = (cards: Card[]): string[] => {
  if (!cards || cards.length === 0) return [];

  try {
    const analysis = autoArrangeHand(cards);
    const hints: string[] = [];

    if (!analysis.hasPureSequence) {
      hints.push('You need at least one pure sequence (no jokers)');
    }

    if (analysis.sequenceCount < 2) {
      hints.push(`You need at least 2 sequences (you have ${analysis.sequenceCount})`);
    }

    if (analysis.deadwood.length > 0) {
      hints.push(`You have ${analysis.deadwood.length} unmelded cards worth ${analysis.deadwoodPoints} points`);
    }

    return hints;
  } catch (error) {
    console.error('Error in getDeclarationHint:', error);
    return [];
  }
};
