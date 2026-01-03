/**
 * Medium Bot AI
 *
 * Uses basic strategy:
 * - Considers picking from discard if it helps form melds
 * - Discards cards that don't contribute to melds
 * - Declares when hand is ready
 * - Drops strategically when hand is very bad
 */

import { Card, BotDecision, DrawSource, getRankIndex } from '../types';
import { BotContext, getThinkingTime } from './index';
import { autoArrangeHand, canDeclare } from '../declaration';
import { isJoker } from '../hand';

/**
 * Medium bot decision maker
 */
export const mediumBotDecide = (context: BotContext): BotDecision => {
  const { hand, topDiscard, isFirstTurn, currentScore, poolLimit, turnPhase } = context;
  const thinkingTime = getThinkingTime('medium');

  // Check if should drop
  if (turnPhase === 'draw' && shouldDropMedium(hand, isFirstTurn, currentScore, poolLimit)) {
    return {
      action: 'drop',
      dropType: isFirstTurn ? 'first' : 'middle',
      thinkingTime,
    };
  }

  // Draw phase
  if (turnPhase === 'draw') {
    const source = decideDrawSourceMedium(hand, topDiscard);
    return {
      action: 'draw',
      source,
      card: source === 'discard' && topDiscard ? topDiscard : undefined,
      thinkingTime,
    };
  }

  // Discard phase - check if we can declare by discarding a specific card
  if (turnPhase === 'discard') {
    // Check each card - if discarding it leaves a winning hand, declare!
    for (const cardToDiscard of hand) {
      const remainingHand = hand.filter(c => c.id !== cardToDiscard.id);
      if (canDeclare(remainingHand)) {
        const analysis = autoArrangeHand(remainingHand);
        return {
          action: 'declare',
          melds: analysis.melds,
          thinkingTime,
        };
      }
    }

    // No winning discard found, just discard normally
    const cardToDiscard = decideDiscardMedium(hand);
    return {
      action: 'discard',
      card: cardToDiscard,
      thinkingTime,
    };
  }

  // Fallback
  const cardToDiscard = decideDiscardMedium(hand);
  return {
    action: 'discard',
    card: cardToDiscard,
    thinkingTime,
  };
};

/**
 * Medium bot draw decision - considers if discard helps form melds
 */
const decideDrawSourceMedium = (hand: Card[], topDiscard: Card | null): DrawSource => {
  if (!topDiscard) {
    return 'deck';
  }

  // Always pick up jokers
  if (isJoker(topDiscard)) {
    return 'discard';
  }

  // Check if discard card would help form a meld
  const wouldHelpMeld = checkIfHelpsFormMeld(hand, topDiscard);

  if (wouldHelpMeld) {
    return 'discard';
  }

  // Default to deck
  return 'deck';
};

/**
 * Check if a card would help form a meld with existing hand
 */
const checkIfHelpsFormMeld = (hand: Card[], card: Card): boolean => {
  // Check for set potential (same rank)
  const sameRank = hand.filter(c => c.rank === card.rank && !isJoker(c));
  if (sameRank.length >= 2) {
    // Would complete or nearly complete a set
    const uniqueSuits = new Set([...sameRank.map(c => c.suit), card.suit]);
    if (uniqueSuits.size >= 3) {
      return true;
    }
  }

  // Check for sequence potential (same suit, adjacent ranks)
  const sameSuit = hand.filter(c => c.suit === card.suit && !isJoker(c));
  const cardRankIdx = getRankIndex(card.rank);

  // Look for adjacent cards
  const hasAdjacent = sameSuit.some(c => {
    const rankIdx = getRankIndex(c.rank);
    return Math.abs(rankIdx - cardRankIdx) <= 2;
  });

  if (hasAdjacent) {
    // Count cards within range that could form sequence
    const inRange = sameSuit.filter(c => {
      const rankIdx = getRankIndex(c.rank);
      return Math.abs(rankIdx - cardRankIdx) <= 2;
    });
    if (inRange.length >= 2) {
      return true;
    }
  }

  return false;
};

/**
 * Medium bot discard decision - avoid discarding cards that help melds
 */
const decideDiscardMedium = (hand: Card[]): Card => {
  const analysis = autoArrangeHand(hand);

  // Get cards that are part of melds
  const meldedCardIds = new Set<string>();
  for (const meld of analysis.melds) {
    for (const card of meld.cards) {
      meldedCardIds.add(card.id);
    }
  }

  // Candidates are unmelded cards
  const candidates = hand.filter(c => !meldedCardIds.has(c.id));

  if (candidates.length === 0) {
    // All cards melded, this shouldn't happen if we can't declare
    // Pick lowest value card
    return [...hand].sort((a, b) => a.value - b.value)[0];
  }

  // Score each candidate - lower is better to discard
  const scored = candidates.map(card => ({
    card,
    score: scoreCardForDiscard(card, hand, meldedCardIds),
  }));

  // Sort by score ascending (lower = discard first)
  scored.sort((a, b) => a.score - b.score);

  // Pick the best candidate to discard (lowest score)
  return scored[0].card;
};

/**
 * Score a card for discard potential
 * Lower score = better to discard
 */
const scoreCardForDiscard = (card: Card, hand: Card[], meldedIds: Set<string>): number => {
  let score = 0;

  // Jokers are never good to discard
  if (isJoker(card)) {
    return 1000;
  }

  // High value cards should be discarded sooner
  score -= card.value;

  // Check if card is close to forming a meld with other unmelded cards
  const otherUnmelded = hand.filter(c => c.id !== card.id && !meldedIds.has(c.id));

  // Same rank cards (potential set)
  const sameRankCount = otherUnmelded.filter(c => c.rank === card.rank).length;
  score += sameRankCount * 10;

  // Adjacent same-suit cards (potential sequence)
  const cardRankIdx = getRankIndex(card.rank);
  const adjacentCount = otherUnmelded.filter(c => {
    if (c.suit !== card.suit) return false;
    const rankIdx = getRankIndex(c.rank);
    return Math.abs(rankIdx - cardRankIdx) <= 1;
  }).length;
  score += adjacentCount * 15;

  return score;
};

/**
 * Medium bot drop decision
 */
const shouldDropMedium = (
  hand: Card[],
  isFirstTurn: boolean,
  currentScore: number,
  poolLimit: number | null
): boolean => {
  const analysis = autoArrangeHand(hand);

  // Consider dropping if hand is very bad
  if (analysis.deadwoodPoints < 50) {
    return false; // Hand is decent, don't drop
  }

  if (isFirstTurn) {
    // First turn drop - 25 points
    // Drop if deadwood is significantly higher
    if (analysis.deadwoodPoints > 60 && analysis.melds.length === 0) {
      // In pool rummy, consider score position
      if (poolLimit) {
        const spaceRemaining = poolLimit - currentScore;
        // Don't drop if we're close to elimination
        if (spaceRemaining < 50) {
          return false;
        }
      }
      return Math.random() < 0.3; // 30% chance to drop
    }
  } else {
    // Middle drop - 50 points
    // Only drop if hand is really bad
    if (analysis.deadwoodPoints > 70 && analysis.melds.length <= 1) {
      if (poolLimit) {
        const spaceRemaining = poolLimit - currentScore;
        if (spaceRemaining < 80) {
          return false;
        }
      }
      return Math.random() < 0.15; // 15% chance to drop
    }
  }

  return false;
};

// Export helper function used by hard bot
export { checkIfHelpsFormMeld, scoreCardForDiscard };
