import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, GameConfig, Player, Round, ScoreInput } from '../types/game';

interface GameContextType {
  currentGame: Game | null;
  gameHistory: Game[];
  createGame: (config: GameConfig, players: Player[], name?: string, dealerId?: string) => void;
  addRound: (scores: ScoreInput[]) => void;
  updateRound: (roundId: string, scores: ScoreInput[]) => void;
  resetGame: () => void;
  loadGame: () => Promise<void>;
  deleteGameFromHistory: (gameId: string) => void;
  clearHistory: () => void;
  isPlayerInCompulsoryPlay: (playerId: string) => boolean;
  canPlayersRejoin: () => boolean;
  rejoinPlayer: (playerId: string) => void;
  setDealer: (playerId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameHistory, setGameHistory] = useState<Game[]>([]);

  const createGame = (config: GameConfig, players: Player[], name?: string, dealerId?: string) => {
    // Dealer defaults to last player in the order
    const initialDealerId = dealerId || players[players.length - 1]?.id;
    const newGame: Game = {
      id: Date.now().toString(),
      name: name || undefined,
      config,
      players: players.map(p => ({ ...p, score: 0 })),
      rounds: [],
      currentDeal: 1,
      dealerId: initialDealerId,
      startedAt: new Date(),
    };
    setCurrentGame(newGame);
    saveGame(newGame);
  };

  // Get the next dealer based on open card rule:
  // - Open card goes to next ACTIVE player after dealer (in seating order)
  // - Only the player who received open card can become next dealer
  // - If that player is eliminated this round → dealer stays same
  // - If dealer is also eliminated → go backwards to previous dealer
  const getNextDealer = (
    game: Game,
    previousPlayers: Player[],
  ): string | undefined => {
    if (!game.dealerId) return undefined;

    const activePlayers = game.players.filter(p => !p.isEliminated);
    if (activePlayers.length === 0) return undefined;

    const allPlayers = game.players;
    const currentDealerIndex = allPlayers.findIndex(p => p.id === game.dealerId);
    if (currentDealerIndex === -1) return activePlayers[0].id;

    const currentDealer = allPlayers[currentDealerIndex];

    // Find who received the open card this round:
    // The next ACTIVE player after dealer in seating order (before eliminations)
    let openCardReceiverIndex = -1;
    for (let i = 1; i <= allPlayers.length; i++) {
      const idx = (currentDealerIndex + i) % allPlayers.length;
      const player = allPlayers[idx];
      // Check if this player was active at the START of the round
      const wasActive = previousPlayers.find(p => p.id === player.id && !p.isEliminated);
      if (wasActive) {
        openCardReceiverIndex = idx;
        break;
      }
    }

    if (openCardReceiverIndex === -1) return game.dealerId;

    const openCardReceiver = allPlayers[openCardReceiverIndex];

    // If current dealer is eliminated, go BACKWARDS to find previous dealer
    if (currentDealer.isEliminated) {
      for (let i = 1; i <= allPlayers.length; i++) {
        const idx = (currentDealerIndex - i + allPlayers.length) % allPlayers.length;
        if (!allPlayers[idx].isEliminated) {
          return allPlayers[idx].id;
        }
      }
      return activePlayers[0].id;
    }

    // If the open card receiver is now eliminated, dealer stays the same
    if (openCardReceiver.isEliminated) {
      return game.dealerId;
    }

    // Open card receiver is still active, they become next dealer
    return openCardReceiver.id;
  };

  const setDealer = useCallback((playerId: string) => {
    if (!currentGame) return;

    const player = currentGame.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return;

    const updatedGame: Game = {
      ...currentGame,
      dealerId: playerId,
    };

    setCurrentGame(updatedGame);
    saveGame(updatedGame);
  }, [currentGame]);

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

    // Create intermediate game state to calculate next dealer
    const intermediateGame: Game = {
      ...currentGame,
      players: updatedPlayers,
      rounds: [...currentGame.rounds, newRound],
      currentDeal: currentGame.currentDeal + 1,
      winner: gameWinner,
      completedAt: gameWinner ? new Date() : undefined,
    };

    // Rotate dealer for next round (unless game is over)
    // Pass previous players state to check who just got eliminated
    const nextDealerId = gameWinner
      ? currentGame.dealerId
      : getNextDealer(intermediateGame, currentGame.players);

    const updatedGame: Game = {
      ...intermediateGame,
      dealerId: nextDealerId,
    };

    setCurrentGame(updatedGame);
    saveGame(updatedGame);
  };

  const updateRound = (roundId: string, scores: ScoreInput[]) => {
    if (!currentGame) return;

    // Find the round index
    const roundIndex = currentGame.rounds.findIndex(r => r.id === roundId);
    if (roundIndex === -1) return;

    // Calculate new scores for the round
    const roundScores: { [playerId: string]: number } = {};
    let winner: string | undefined;

    scores.forEach(scoreInput => {
      const calculatedScore = calculateScore(scoreInput, currentGame.config);
      roundScores[scoreInput.playerId] = calculatedScore;

      if (scoreInput.isDeclared && !scoreInput.hasInvalidDeclaration) {
        winner = scoreInput.playerId;
      }
    });

    // Update the round
    const updatedRounds = [...currentGame.rounds];
    updatedRounds[roundIndex] = {
      ...updatedRounds[roundIndex],
      scores: roundScores,
      winner,
    };

    // Recalculate all player scores from scratch
    const recalculatedPlayers = currentGame.players.map(player => ({
      ...player,
      score: 0,
      isEliminated: false,
    }));

    // Replay all rounds to get accurate totals
    let gameWinner: string | undefined;
    updatedRounds.forEach((round, idx) => {
      recalculatedPlayers.forEach(player => {
        const roundScore = round.scores[player.id] || 0;
        player.score += roundScore;

        // Check elimination for pool games
        if (currentGame.config.variant === 'pool' && currentGame.config.poolLimit) {
          if (player.score > currentGame.config.poolLimit) {
            player.isEliminated = true;
          }
        }
      });

      // Check for game winner after each round
      const activePlayers = recalculatedPlayers.filter(p => !p.isEliminated);

      if (currentGame.config.variant === 'pool' && activePlayers.length === 1) {
        gameWinner = activePlayers[0].id;
      } else if (
        currentGame.config.variant === 'deals' &&
        currentGame.config.numberOfDeals &&
        idx + 1 >= currentGame.config.numberOfDeals
      ) {
        const lowestScore = Math.min(...recalculatedPlayers.map(p => p.score));
        gameWinner = recalculatedPlayers.find(p => p.score === lowestScore)?.id;
      }
    });

    const updatedGame: Game = {
      ...currentGame,
      players: recalculatedPlayers,
      rounds: updatedRounds,
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

  const loadGame = useCallback(async () => {
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
  }, []);

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

  // Check if a player is in compulsory play state
  // A player is in compulsory play when (poolLimit - currentScore) < dropPenalty
  const isPlayerInCompulsoryPlay = useCallback((playerId: string): boolean => {
    if (!currentGame) return false;
    if (currentGame.config.variant !== 'pool') return false;
    if (!currentGame.config.poolLimit) return false;

    const player = currentGame.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return false;

    const dropPenalty = currentGame.config.dropPenalty || 25;
    const spaceLeft = currentGame.config.poolLimit - player.score;

    return spaceLeft < dropPenalty;
  }, [currentGame]);

  // Check if eliminated players can rejoin
  // Players can rejoin only when no active player is in compulsory play
  const canPlayersRejoin = useCallback((): boolean => {
    if (!currentGame) return false;
    if (currentGame.config.variant !== 'pool') return false;
    if (currentGame.winner) return false; // Game is already over

    // Check if there are any eliminated players
    const eliminatedPlayers = currentGame.players.filter(p => p.isEliminated);
    if (eliminatedPlayers.length === 0) return false;

    // Check if any active player is in compulsory play
    const activePlayers = currentGame.players.filter(p => !p.isEliminated);
    const anyInCompulsoryPlay = activePlayers.some(p => isPlayerInCompulsoryPlay(p.id));

    return !anyInCompulsoryPlay;
  }, [currentGame, isPlayerInCompulsoryPlay]);

  // Rejoin an eliminated player
  // Player joins at highest active player's score + 1
  const rejoinPlayer = useCallback((playerId: string) => {
    if (!currentGame) return;
    if (!canPlayersRejoin()) return;

    const player = currentGame.players.find(p => p.id === playerId);
    if (!player || !player.isEliminated) return;

    // Calculate the new score: highest active player's score + 1
    const activePlayers = currentGame.players.filter(p => !p.isEliminated);
    const highestScore = Math.max(...activePlayers.map(p => p.score));
    const rejoinScore = highestScore + 1;

    const updatedPlayers = currentGame.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          score: rejoinScore,
          isEliminated: false,
          rejoinCount: (p.rejoinCount || 0) + 1,
        };
      }
      return p;
    });

    const updatedGame: Game = {
      ...currentGame,
      players: updatedPlayers,
    };

    setCurrentGame(updatedGame);
    saveGame(updatedGame);
  }, [currentGame, canPlayersRejoin]);

  return (
    <GameContext.Provider
      value={{
        currentGame,
        gameHistory,
        createGame,
        addRound,
        updateRound,
        resetGame,
        loadGame,
        deleteGameFromHistory,
        clearHistory,
        isPlayerInCompulsoryPlay,
        canPlayersRejoin,
        rejoinPlayer,
        setDealer,
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
