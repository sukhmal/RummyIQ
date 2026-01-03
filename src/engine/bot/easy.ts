/**
 * Easy Bot AI
 *
 * Makes mostly random valid moves with some basic logic:
 * - Usually draws from deck
 * - Discards highest value unmelded card
 * - Declares only when hand is clearly ready
 * - Rarely drops
 */

import { Card, BotDecision, DrawSource } from '../types';
import { BotContext, getThinkingTime } from './index';
import { autoArrangeHand, canDeclare } from '../declaration';
import { isJoker } from '../hand';

/**
 * Easy bot decision maker
 */
export const easyBotDecide = (context: BotContext): BotDecision => {
  const { hand, topDiscard, isFirstTurn, turnPhase } = context;
  const thinkingTime = getThinkingTime('easy');

  // Check if should drop (very rarely for easy bot)
  if (turnPhase === 'draw' && shouldDropEasy(hand, isFirstTurn)) {
    return {
      action: 'drop',
      dropType: isFirstTurn ? 'first' : 'middle',
      thinkingTime,
    };
  }

  // Draw phase
  if (turnPhase === 'draw') {
    const source = decideDrawSourceEasy(topDiscard);
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
    const cardToDiscard = decideDiscardEasy(hand);
    return {
      action: 'discard',
      card: cardToDiscard,
      thinkingTime,
    };
  }

  // Fallback
  const cardToDiscard = decideDiscardEasy(hand);
  return {
    action: 'discard',
    card: cardToDiscard,
    thinkingTime,
  };
};

/**
 * Easy bot draw decision - mostly random, slightly favors deck
 */
const decideDrawSourceEasy = (topDiscard: Card | null): DrawSource => {
  // No discard available, must draw from deck
  if (!topDiscard) {
    return 'deck';
  }

  // Easy bot draws from deck 80% of the time
  if (Math.random() < 0.8) {
    return 'deck';
  }

  // Sometimes pick up discard if it's valuable (joker or face card)
  if (isJoker(topDiscard) || topDiscard.value >= 10) {
    return 'discard';
  }

  return 'deck';
};

/**
 * Easy bot discard decision - discard highest value non-joker
 */
const decideDiscardEasy = (hand: Card[]): Card => {
  // Sort by value descending
  const sortedByValue = [...hand].sort((a, b) => {
    // Never discard jokers
    if (isJoker(a) && !isJoker(b)) return 1;
    if (!isJoker(a) && isJoker(b)) return -1;
    return b.value - a.value;
  });

  // Add some randomness - sometimes pick from top 3 instead of always highest
  const topN = Math.min(3, sortedByValue.length);
  const randomIndex = Math.floor(Math.random() * topN);

  return sortedByValue[randomIndex];
};

/**
 * Easy bot drop decision - very rarely drops
 */
const shouldDropEasy = (hand: Card[], isFirstTurn: boolean): boolean => {
  // Only consider dropping on first turn, and very rarely
  if (!isFirstTurn) {
    return false;
  }

  // Easy bot only drops 5% of the time on first turn with bad hand
  if (Math.random() > 0.05) {
    return false;
  }

  // Check if hand is really bad (high deadwood, no potential melds)
  const analysis = autoArrangeHand(hand);
  return analysis.deadwoodPoints > 70 && analysis.melds.length === 0;
};
