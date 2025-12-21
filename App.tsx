import React from 'react';
import { StatusBar, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './src/context/GameContext';

import HomeScreen from './src/screens/HomeScreen';
import GameSetupScreen from './src/screens/GameSetupScreen';
import GameScreen from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

const HomeButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.homeButton}>
    <Text style={styles.homeButtonText}>⌂</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  homeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  homeButtonText: {
    color: '#eee',
    fontSize: 24,
  },
});

function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#eee',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GameSetup"
            component={GameSetupScreen}
            options={({ navigation }) => ({
              title: 'Setup Game',
              headerLeft: () => (
                <HomeButton onPress={() => navigation.navigate('Home')} />
              ),
            })}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={({ navigation }) => ({
              title: 'Game',
              headerLeft: () => (
                <HomeButton onPress={() => navigation.navigate('Home')} />
              ),
            })}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={({ navigation }) => ({
              title: 'Scoreboard',
              headerLeft: () => (
                <HomeButton onPress={() => navigation.navigate('Home')} />
              ),
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}

export default App;
