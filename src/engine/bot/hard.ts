/**
 * Hard Bot AI
 *
 * Advanced strategy:
 * - Tracks discards to know what's safe to discard
 * - Avoids discarding cards opponents might need
 * - Picks from discard pile strategically
 * - Optimal meld formation
 * - Smart dropping decisions
 */

import { Card, BotDecision, DrawSource, getRankIndex } from '../types';
import { BotContext, getThinkingTime } from './index';
import { autoArrangeHand, canDeclare } from '../declaration';
import { isJoker, evaluateHand } from '../hand';
import { checkIfHelpsFormMeld, scoreCardForDiscard } from './medium';

/**
 * Hard bot decision maker
 */
export const hardBotDecide = (context: BotContext): BotDecision => {
  const {
    hand,
    topDiscard,
    discardHistory,
    isFirstTurn,
    currentScore,
    poolLimit,
    turnPhase,
  } = context;
  const thinkingTime = getThinkingTime('hard');

  // Check if should drop
  if (turnPhase === 'draw' && shouldDropHard(hand, isFirstTurn, currentScore, poolLimit)) {
    return {
      action: 'drop',
      dropType: isFirstTurn ? 'first' : 'middle',
      thinkingTime,
    };
  }

  // Draw phase
  if (turnPhase === 'draw') {
    const source = decideDrawSourceHard(hand, topDiscard, discardHistory);
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
    const cardToDiscard = decideDiscardHard(hand, discardHistory);
    return {
      action: 'discard',
      card: cardToDiscard,
      thinkingTime,
    };
  }

  // Fallback
  const cardToDiscard = decideDiscardHard(hand, discardHistory);
  return {
    action: 'discard',
    card: cardToDiscard,
    thinkingTime,
  };
};

/**
 * Hard bot draw decision - strategic pick from discard
 */
const decideDrawSourceHard = (
  hand: Card[],
  topDiscard: Card | null,
  discardHistory: Card[]
): DrawSource => {
  if (!topDiscard) {
    return 'deck';
  }

  // Always pick up jokers
  if (isJoker(topDiscard)) {
    return 'discard';
  }

  // Calculate current hand value
  const currentEval = evaluateHand(hand);

  // Simulate picking up the discard
  const handWithDiscard = [...hand, topDiscard];
  const evalWithDiscard = evaluateHand(handWithDiscard);

  // If picking up significantly improves hand, do it
  if (evalWithDiscard < currentEval - 10) {
    return 'discard';
  }

  // Check if it directly completes a meld
  if (wouldCompleteMeld(hand, topDiscard)) {
    return 'discard';
  }

  // Check discard history to see if opponents want this card's neighbors
  // If opponents discarded cards of same rank, they probably don't need this rank
  const sameRankDiscards = discardHistory.filter(c => c.rank === topDiscard.rank);
  if (sameRankDiscards.length >= 2) {
    // Many of this rank have been discarded, less valuable
    return 'deck';
  }

  // If the card helps form a meld
  if (checkIfHelpsFormMeld(hand, topDiscard)) {
    // But check if it might give away information
    // If we've been discarding similar cards, don't suddenly pick one up
    const recentDiscards = discardHistory.slice(-5);
    const haveSimilar = recentDiscards.some(c =>
      c.suit === topDiscard.suit &&
      Math.abs(getRankIndex(c.rank) - getRankIndex(topDiscard.rank)) <= 2
    );
    if (!haveSimilar) {
      return 'discard';
    }
  }

  return 'deck';
};

/**
 * Check if a card would immediately complete a meld
 */
const wouldCompleteMeld = (hand: Card[], card: Card): boolean => {
  // Check for set completion
  const sameRank = hand.filter(c => c.rank === card.rank && !isJoker(c));
  const uniqueSuits = new Set([...sameRank.map(c => c.suit), card.suit]);
  if (sameRank.length >= 2 && uniqueSuits.size >= 3) {
    return true;
  }

  // Check for sequence completion
  const sameSuit = hand.filter(c => c.suit === card.suit && !isJoker(c));
  const cardRankIdx = getRankIndex(card.rank);

  // Check if card fills a gap in a sequence
  const prev1 = sameSuit.find(c => getRankIndex(c.rank) === cardRankIdx - 1);
  const prev2 = sameSuit.find(c => getRankIndex(c.rank) === cardRankIdx - 2);
  const next1 = sameSuit.find(c => getRankIndex(c.rank) === cardRankIdx + 1);
  const next2 = sameSuit.find(c => getRankIndex(c.rank) === cardRankIdx + 2);

  // X-card-Y or card-X-Y or X-Y-card patterns
  if ((prev1 && next1) || (prev1 && prev2) || (next1 && next2)) {
    return true;
  }

  return false;
};

/**
 * Hard bot discard decision - avoid giving opponents what they need
 */
const decideDiscardHard = (hand: Card[], discardHistory: Card[]): Card => {
  const analysis = autoArrangeHand(hand);

  // Get cards that are part of melds
  const meldedCardIds = new Set<string>();
  for (const meld of analysis.melds) {
    for (const card of meld.cards) {
      meldedCardIds.add(card.id);
    }
  }

  // Candidates are unmelded cards
  const candidates = hand.filter(c => !meldedCardIds.has(c.id) && !isJoker(c));

  if (candidates.length === 0) {
    // All non-joker cards melded, pick lowest value melded card
    const nonJokers = hand.filter(c => !isJoker(c));
    if (nonJokers.length > 0) {
      return [...nonJokers].sort((a, b) => a.value - b.value)[0];
    }
    // Only jokers left (shouldn't happen)
    return hand[0];
  }

  // Score each candidate with advanced scoring
  const scored = candidates.map(card => ({
    card,
    score: scoreCardForDiscardHard(card, hand, discardHistory, meldedCardIds),
  }));

  // Sort by score ascending (lower = discard first)
  scored.sort((a, b) => a.score - b.score);

  return scored[0].card;
};

/**
 * Advanced scoring for discard
 * Lower score = safer to discard
 */
const scoreCardForDiscardHard = (
  card: Card,
  hand: Card[],
  discardHistory: Card[],
  meldedIds: Set<string>
): number => {
  // Start with basic score
  let score = scoreCardForDiscard(card, hand, meldedIds);

  // Analyze discard history to determine what opponents might need

  // Count how many of this rank have been discarded
  const sameRankDiscards = discardHistory.filter(c => c.rank === card.rank);
  // If many have been discarded, this is safer to discard
  score -= sameRankDiscards.length * 5;

  // Check for adjacent cards in discard history (same suit)
  const adjacentDiscards = discardHistory.filter(c => {
    if (c.suit !== card.suit) return false;
    const cardIdx = getRankIndex(card.rank);
    const discardIdx = getRankIndex(c.rank);
    return Math.abs(cardIdx - discardIdx) <= 2;
  });

  // If opponents discarded nearby cards, they probably don't need this one
  score -= adjacentDiscards.length * 3;

  // Prefer discarding cards that have been "abandoned" by opponents
  // (where many cards of that suit have been discarded)
  const sameSuitDiscards = discardHistory.filter(c => c.suit === card.suit);
  if (sameSuitDiscards.length >= 5) {
    // This suit is heavily discarded, safer to discard more
    score -= 10;
  }

  // High cards are still riskier to hold
  score -= card.value * 0.5;

  return score;
};

/**
 * Hard bot drop decision - strategic dropping
 */
const shouldDropHard = (
  hand: Card[],
  isFirstTurn: boolean,
  currentScore: number,
  poolLimit: number | null
): boolean => {
  const analysis = autoArrangeHand(hand);

  // Never drop if we have good melds
  if (analysis.melds.length >= 2 && analysis.deadwoodPoints < 40) {
    return false;
  }

  // Calculate expected value of playing vs dropping
  const expectedHandPoints = analysis.deadwoodPoints;

  if (isFirstTurn) {
    // First drop costs 25 points
    // In pool rummy, be more strategic
    if (poolLimit) {
      const spaceRemaining = poolLimit - currentScore;

      // Very close to elimination - don't drop, try to win
      if (spaceRemaining < 30) {
        return false;
      }

      // Comfortable position - drop if hand is bad
      if (spaceRemaining > 100 && expectedHandPoints > 65 && analysis.melds.length === 0) {
        return true;
      }
    }

    // Non-pool games - more conservative dropping
    if (expectedHandPoints > 70 && analysis.melds.length === 0) {
      return Math.random() < 0.4; // 40% chance
    }
  } else {
    const dropCost = 50;

    // Only middle drop with really bad hand
    if (poolLimit) {
      const spaceRemaining = poolLimit - currentScore;

      // Never drop if it would eliminate us
      if (spaceRemaining <= dropCost) {
        return false;
      }

      // Only drop if expected loss is significantly higher
      if (spaceRemaining > 80 && expectedHandPoints > 75 && analysis.melds.length <= 1) {
        return Math.random() < 0.25; // 25% chance
      }
    }
  }

  return false;
};
