import { GameVariant, BaseGameConfig, BasePlayer } from './shared';

// Re-export shared types for backward compatibility
export type { GameVariant };

export type PoolType = number;

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD' | 'CNY';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export interface Player extends BasePlayer {
  score: number;
  isEliminated?: boolean;
  rejoinCount?: number;
}

export interface Round {
  id: string;
  timestamp: Date;
  scores: { [playerId: string]: number };
  winner?: string;
}

export interface GameConfig extends BaseGameConfig {
  poolLimit?: PoolType;
  joinTableAmount?: number;
}

export interface SplitPotShare {
  playerId: string;
  amount: number;
}

export interface SplitPotInfo {
  totalPot: number;
  shares: SplitPotShare[];
}

export interface Game {
  id: string;
  name?: string;
  config: GameConfig;
  players: Player[];
  rounds: Round[];
  currentDeal: number;
  dealerId?: string;
  startedAt: Date;
  completedAt?: Date;
  winner?: string;
  splitPot?: SplitPotInfo;
}

export interface ScoreInput {
  playerId: string;
  points: number;
  isDeclared: boolean;
  hasInvalidDeclaration?: boolean;
}
