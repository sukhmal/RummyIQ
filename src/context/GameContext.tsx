import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, GameConfig, Player, Round, ScoreInput } from '../types/game';

interface GameContextType {
  currentGame: Game | null;
  gameHistory: Game[];
  createGame: (config: GameConfig, players: Player[], name?: string) => void;
  addRound: (scores: ScoreInput[]) => void;
  resetGame: () => void;
  loadGame: () => Promise<void>;
  deleteGameFromHistory: (gameId: string) => void;
  clearHistory: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameHistory, setGameHistory] = useState<Game[]>([]);

  const createGame = (config: GameConfig, players: Player[], name?: string) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: name || undefined,
      config,
      players: players.map(p => ({ ...p, score: 0 })),
      rounds: [],
      currentDeal: 1,
      startedAt: new Date(),
    };
    setCurrentGame(newGame);
    saveGame(newGame);
  };

  const calculateScore = (input: ScoreInput, config: GameConfig): number => {
    if (input.hasInvalidDeclaration) {
      return config.variant === 'pool' ? 80 : input.points;
    }
    if (input.isDeclared) {
      return 0;
    }
    return input.points;
  };

  const addRound = (scores: ScoreInput[]) => {
    if (!currentGame) return;

    const roundScores: { [playerId: string]: number } = {};
    let winner: string | undefined;

    scores.forEach(scoreInput => {
      const calculatedScore = calculateScore(scoreInput, currentGame.config);
      roundScores[scoreInput.playerId] = calculatedScore;

      if (scoreInput.isDeclared && !scoreInput.hasInvalidDeclaration) {
        winner = scoreInput.playerId;
      }
    });

    const newRound: Round = {
      id: Date.now().toString(),
      timestamp: new Date(),
      scores: roundScores,
      winner,
    };

    const updatedPlayers = currentGame.players.map(player => {
      const roundScore = roundScores[player.id] || 0;
      const newScore = player.score + roundScore;

      let isEliminated = player.isEliminated || false;
      if (currentGame.config.variant === 'pool' && currentGame.config.poolLimit) {
        // Player survives at exactly the limit, eliminated when exceeding it
        isEliminated = newScore > currentGame.config.poolLimit;
      }

      return {
        ...player,
        score: newScore,
        isEliminated,
      };
    });

    let gameWinner: string | undefined;
    const activePlayers = updatedPlayers.filter(p => !p.isEliminated);

    if (currentGame.config.variant === 'pool' && activePlayers.length === 1) {
      gameWinner = activePlayers[0].id;
    } else if (
      currentGame.config.variant === 'deals' &&
      currentGame.config.numberOfDeals &&
      currentGame.currentDeal >= currentGame.config.numberOfDeals
    ) {
      const lowestScore = Math.min(...updatedPlayers.map(p => p.score));
      gameWinner = updatedPlayers.find(p => p.score === lowestScore)?.id;
    }

    const updatedGame: Game = {
      ...currentGame,
      players: updatedPlayers,
      rounds: [...currentGame.rounds, newRound],
      currentDeal: currentGame.currentDeal + 1,
      winner: gameWinner,
      completedAt: gameWinner ? new Date() : undefined,
    };

    setCurrentGame(updatedGame);
    saveGame(updatedGame);
  };

  const resetGame = () => {
    setCurrentGame(null);
    AsyncStorage.removeItem('currentGame');
  };

  const saveGame = async (game: Game) => {
    try {
      await AsyncStorage.setItem('currentGame', JSON.stringify(game));

      // If game is completed, add to history
      if (game.winner) {
        const history = await AsyncStorage.getItem('gameHistory');
        const existingHistory: Game[] = history ? JSON.parse(history) : [];

        // Check if game already exists in history
        const gameIndex = existingHistory.findIndex(g => g.id === game.id);
        if (gameIndex >= 0) {
          existingHistory[gameIndex] = game;
        } else {
          existingHistory.unshift(game); // Add to beginning
        }

        await AsyncStorage.setItem('gameHistory', JSON.stringify(existingHistory));
        setGameHistory(existingHistory);
      }
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const loadGame = async () => {
    try {
      const savedGame = await AsyncStorage.getItem('currentGame');
      if (savedGame) {
        const game = JSON.parse(savedGame);
        setCurrentGame(game);
      }

      // Load history
      const history = await AsyncStorage.getItem('gameHistory');
      if (history) {
        setGameHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
  };

  const deleteGameFromHistory = async (gameId: string) => {
    try {
      const updatedHistory = gameHistory.filter(g => g.id !== gameId);
      await AsyncStorage.setItem('gameHistory', JSON.stringify(updatedHistory));
      setGameHistory(updatedHistory);
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('gameHistory');
      setGameHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentGame,
        gameHistory,
        createGame,
        addRound,
        resetGame,
        loadGame,
        deleteGameFromHistory,
        clearHistory,
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
