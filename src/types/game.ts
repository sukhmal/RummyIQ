export type GameVariant = 'pool' | 'points' | 'deals';

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

export interface Player {
  id: string;
  name: string;
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

export interface GameConfig {
  variant: GameVariant;
  poolLimit?: PoolType;
  pointValue?: number;
  numberOfDeals?: number;
  dropPenalty?: number;
  joinTableAmount?: number;
}

export interface Game {
  id: string;
  name?: string;
  config: GameConfig;
  players: Player[];
  rounds: Round[];
  currentDeal: number;
  startedAt: Date;
  completedAt?: Date;
  winner?: string;
}

export interface ScoreInput {
  playerId: string;
  points: number;
  isDeclared: boolean;
  hasInvalidDeclaration?: boolean;
}
