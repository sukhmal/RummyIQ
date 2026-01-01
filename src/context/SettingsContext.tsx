import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameVariant, PoolType, CurrencyCode, CURRENCIES } from '../types/game';

export interface GameDefaults {
  gameType: GameVariant;
  poolLimit: PoolType;
  numberOfDeals: number;
  playerCount: number;
  rememberLastGame: boolean;
  dropPenalty: number;
  joinTableAmount: number;
  currency: CurrencyCode;
}

export interface LastGameSettings {
  gameType: GameVariant;
  poolLimit: PoolType;
  numberOfDeals: number;
  playerCount: number;
  playerNames: string[];
  dropPenalty?: number;
  joinTableAmount?: number;
}

interface SettingsContextType {
  defaults: GameDefaults;
  lastGameSettings: LastGameSettings | null;
  updateDefaults: (updates: Partial<GameDefaults>) => void;
  saveLastGameSettings: (settings: LastGameSettings) => void;
  getEffectiveDefaults: () => GameDefaults & { playerNames?: string[] };
}

const DEFAULT_SETTINGS: GameDefaults = {
  gameType: 'pool',
  poolLimit: 250,
  numberOfDeals: 2,
  playerCount: 2,
  rememberLastGame: false,
  dropPenalty: 25,
  joinTableAmount: 0,
  currency: 'USD',
};

export const getCurrencySymbol = (code: CurrencyCode): string => {
  return CURRENCIES.find(c => c.code === code)?.symbol || '$';
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'game_defaults';
const LAST_GAME_STORAGE_KEY = 'last_game_settings';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [defaults, setDefaults] = useState<GameDefaults>(DEFAULT_SETTINGS);
  const [lastGameSettings, setLastGameSettings] = useState<LastGameSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedDefaults, savedLastGame] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(LAST_GAME_STORAGE_KEY),
        ]);

        if (savedDefaults) {
          const parsed = JSON.parse(savedDefaults);
          setDefaults({ ...DEFAULT_SETTINGS, ...parsed });
        }

        if (savedLastGame) {
          setLastGameSettings(JSON.parse(savedLastGame));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const updateDefaults = useCallback(async (updates: Partial<GameDefaults>) => {
    const newDefaults = { ...defaults, ...updates };
    setDefaults(newDefaults);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newDefaults));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [defaults]);

  const saveLastGameSettings = useCallback(async (settings: LastGameSettings) => {
    setLastGameSettings(settings);
    try {
      await AsyncStorage.setItem(LAST_GAME_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving last game settings:', error);
    }
  }, []);

  const getEffectiveDefaults = useCallback(() => {
    if (defaults.rememberLastGame && lastGameSettings) {
      return {
        gameType: lastGameSettings.gameType,
        poolLimit: lastGameSettings.poolLimit,
        numberOfDeals: lastGameSettings.numberOfDeals,
        playerCount: lastGameSettings.playerCount,
        playerNames: lastGameSettings.playerNames,
        rememberLastGame: defaults.rememberLastGame,
        dropPenalty: lastGameSettings.dropPenalty ?? defaults.dropPenalty,
        joinTableAmount: lastGameSettings.joinTableAmount ?? defaults.joinTableAmount,
        currency: defaults.currency,
      };
    }
    return { ...defaults };
  }, [defaults, lastGameSettings]);

  return (
    <SettingsContext.Provider value={{
      defaults,
      lastGameSettings,
      updateDefaults,
      saveLastGameSettings,
      getEffectiveDefaults,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
