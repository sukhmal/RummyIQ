import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { GameVariant, GameConfig, Player, PoolType } from '../types/game';

const PRESET_POOL_LIMITS = [101, 201, 250] as const;

const GameSetupScreen = ({ navigation }: any) => {
  const { createGame, resetGame } = useGame();
  const [gameName, setGameName] = useState<string>('');
  const [variant, setVariant] = useState<GameVariant>('pool');
  const [poolLimit, setPoolLimit] = useState<PoolType>(250);
  const [isCustomPoolLimit, setIsCustomPoolLimit] = useState(false);
  const [customPoolLimitText, setCustomPoolLimitText] = useState('');
  const [pointValue, setPointValue] = useState<number>(1);
  const [numberOfDeals, setNumberOfDeals] = useState<number>(2);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', score: 0 },
    { id: '2', name: '', score: 0 },
  ]);

  const addPlayer = () => {
    if (players.length < 11) {
      setPlayers([
        ...players,
        { id: Date.now().toString(), name: '', score: 0 },
      ]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.name.trim() !== '');

    if (validPlayers.length < 2) {
      Alert.alert('Error', 'Please add at least 2 players with names');
      return;
    }

    const config: GameConfig = {
      variant,
      ...(variant === 'pool' && { poolLimit }),
      ...(variant === 'points' && { pointValue }),
      ...(variant === 'deals' && { numberOfDeals }),
    };

    resetGame();
    createGame(config, validPlayers, gameName.trim() || undefined);
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Game Setup</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={gameName}
            onChangeText={setGameName}
            placeholder="e.g., Friday Night Rummy"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Variant</Text>
          <View style={styles.variantButtons}>
            <TouchableOpacity
              style={[
                styles.variantButton,
                variant === 'pool' && styles.variantButtonActive,
              ]}
              onPress={() => setVariant('pool')}>
              <Text
                style={[
                  styles.variantButtonText,
                  variant === 'pool' && styles.variantButtonTextActive,
                ]}>
                Pool
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.variantButton,
                variant === 'points' && styles.variantButtonActive,
              ]}
              onPress={() => setVariant('points')}>
              <Text
                style={[
                  styles.variantButtonText,
                  variant === 'points' && styles.variantButtonTextActive,
                ]}>
                Points
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.variantButton,
                variant === 'deals' && styles.variantButtonActive,
              ]}
              onPress={() => setVariant('deals')}>
              <Text
                style={[
                  styles.variantButtonText,
                  variant === 'deals' && styles.variantButtonTextActive,
                ]}>
                Deals
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {variant === 'pool' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pool Limit</Text>
            <View style={styles.variantButtons}>
              {PRESET_POOL_LIMITS.map(limit => (
                <TouchableOpacity
                  key={limit}
                  style={[
                    styles.variantButton,
                    !isCustomPoolLimit && poolLimit === limit && styles.variantButtonActive,
                  ]}
                  onPress={() => {
                    setPoolLimit(limit);
                    setIsCustomPoolLimit(false);
                    setCustomPoolLimitText('');
                  }}>
                  <Text
                    style={[
                      styles.variantButtonText,
                      !isCustomPoolLimit && poolLimit === limit && styles.variantButtonTextActive,
                    ]}>
                    {limit}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.variantButton,
                  isCustomPoolLimit && styles.variantButtonActive,
                ]}
                onPress={() => setIsCustomPoolLimit(true)}>
                <Text
                  style={[
                    styles.variantButtonText,
                    isCustomPoolLimit && styles.variantButtonTextActive,
                  ]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
            {isCustomPoolLimit && (
              <TextInput
                style={[styles.input, styles.customPoolInput]}
                value={customPoolLimitText}
                onChangeText={text => {
                  setCustomPoolLimitText(text);
                  const parsed = parseInt(text, 10);
                  if (parsed > 0) {
                    setPoolLimit(parsed);
                  }
                }}
                keyboardType="numeric"
                placeholder="Enter custom pool limit"
                placeholderTextColor="#666"
              />
            )}
          </View>
        )}

        {variant === 'points' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Point Value</Text>
            <TextInput
              style={styles.input}
              value={pointValue.toString()}
              onChangeText={text => setPointValue(parseInt(text) || 1)}
              keyboardType="numeric"
              placeholder="Enter point value"
              placeholderTextColor="#666"
            />
          </View>
        )}

        {variant === 'deals' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Deals</Text>
            <TextInput
              style={styles.input}
              value={numberOfDeals.toString()}
              onChangeText={text => setNumberOfDeals(parseInt(text) || 2)}
              keyboardType="numeric"
              placeholder="Enter number of deals"
              placeholderTextColor="#666"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players ({players.length}/11)</Text>
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerRow}>
              <TextInput
                style={styles.playerInput}
                value={player.name}
                onChangeText={text => updatePlayerName(player.id, text)}
                placeholder={`Player ${index + 1} name`}
                placeholderTextColor="#666"
              />
              {players.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePlayer(player.id)}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {players.length < 11 && (
            <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
              <Text style={styles.addButtonText}>+ Add Player</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eee',
    marginBottom: 12,
  },
  variantButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  variantButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  variantButtonActive: {
    backgroundColor: '#0f3460',
  },
  variantButtonText: {
    color: '#0f3460',
    fontSize: 16,
    fontWeight: '600',
  },
  variantButtonTextActive: {
    color: '#eee',
  },
  input: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    color: '#eee',
    fontSize: 16,
  },
  customPoolInput: {
    marginTop: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  playerInput: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    color: '#eee',
    fontSize: 16,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#0f3460',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#0f3460',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GameSetupScreen;
