/**
 * Bot AI Controller
 *
 * Manages bot decision making with different difficulty levels
 */

import { Card, BotDecision, BotDifficulty, DrawSource } from '../types';
import { easyBotDecide } from './easy';
import { mediumBotDecide } from './medium';
import { hardBotDecide } from './hard';

/**
 * Bot strategy interface - all difficulty levels implement this
 */
export interface BotStrategy {
  /**
   * Decide whether to draw from deck or discard pile
   */
  decideDrawSource(
    hand: Card[],
    topDiscard: Card | null,
    discardHistory: Card[]
  ): DrawSource;

  /**
   * Decide which card to discard after drawing
   */
  decideDiscard(
    hand: Card[],
    drawnCard: Card,
    drawnFrom: DrawSource,
    discardHistory: Card[]
  ): Card;

  /**
   * Decide whether to declare (show)
   */
  shouldDeclare(hand: Card[]): boolean;

  /**
   * Decide whether to drop
   */
  shouldDrop(
    hand: Card[],
    isFirstTurn: boolean,
    currentScore: number,
    poolLimit: number | null
  ): boolean;
}

/**
 * Context for bot decision making
 */
export interface BotContext {
  hand: Card[];
  topDiscard: Card | null;
  discardHistory: Card[];
  drawnCard?: Card;
  drawnFrom?: DrawSource;
  isFirstTurn: boolean;
  currentScore: number;
  poolLimit: number | null;
  turnPhase: 'draw' | 'discard';
}

/**
 * Get bot decision based on difficulty and game state
 */
export const getBotDecision = (
  difficulty: BotDifficulty,
  context: BotContext
): BotDecision => {
  switch (difficulty) {
    case 'easy':
      return easyBotDecide(context);
    case 'medium':
      return mediumBotDecide(context);
    case 'hard':
      return hardBotDecide(context);
    default:
      return easyBotDecide(context);
  }
};

/**
 * Calculate thinking time based on difficulty
 * Adds natural delay to make bot feel more human
 */
export const getThinkingTime = (difficulty: BotDifficulty): number => {
  const baseTime = 500; // 0.5 second minimum

  switch (difficulty) {
    case 'easy':
      return baseTime + Math.random() * 500; // 0.5-1s
    case 'medium':
      return baseTime + Math.random() * 1000; // 0.5-1.5s
    case 'hard':
      return baseTime + Math.random() * 1500; // 0.5-2s
    default:
      return baseTime;
  }
};

/**
 * Get bot name based on difficulty and index
 */
export const getBotName = (difficulty: BotDifficulty, index: number): string => {
  const easyNames = ['Beginner Bot', 'Novice Bot', 'Learner Bot', 'Starter Bot'];
  const mediumNames = ['Regular Bot', 'Average Bot', 'Standard Bot', 'Normal Bot'];
  const hardNames = ['Expert Bot', 'Master Bot', 'Pro Bot', 'Champion Bot'];

  let names: string[];
  switch (difficulty) {
    case 'easy':
      names = easyNames;
      break;
    case 'medium':
      names = mediumNames;
      break;
    case 'hard':
      names = hardNames;
      break;
    default:
      names = mediumNames;
  }

  return names[index % names.length];
};

/**
 * Get bot avatar identifier
 */
export const getBotAvatar = (difficulty: BotDifficulty, index: number): string => {
  return `bot-${difficulty}-${index}`;
};
