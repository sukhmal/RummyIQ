/**
 * Shared types used by both Scorer Mode and Practice Mode
 */

/**
 * Game variant types supported across all modes
 */
export type GameVariant = 'pool' | 'points' | 'deals';

/**
 * Base configuration shared by both scorer and practice modes
 */
export interface BaseGameConfig {
  variant: GameVariant;
  poolLimit?: number;
  numberOfDeals?: number;
  pointValue?: number;
  firstDropPenalty?: number;
  middleDropPenalty?: number;
}

/**
 * Base player interface shared by both modes
 */
export interface BasePlayer {
  id: string;
  name: string;
}

/**
 * Scoring constants
 */
export const DEFAULT_POOL_LIMIT = 101;
export const DEFAULT_FIRST_DROP = 25;
export const DEFAULT_MIDDLE_DROP = 50;
export const MAX_ROUND_POINTS = 80;
