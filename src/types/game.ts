export type GameVariant = 'pool' | 'points' | 'deals';

export type PoolType = number;

export interface Player {
  id: string;
  name: string;
  score: number;
  isEliminated?: boolean;
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
