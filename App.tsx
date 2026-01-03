import React from 'react';
import { StatusBar, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGame } from './src/context/GameContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { PracticeGameProvider } from './src/context/PracticeGameContext';
import Icon from './src/components/Icon';
import { TapTargets, IconSize, Spacing, BorderRadius, Typography } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import GameSetupScreen from './src/screens/GameSetupScreen';
import GameScreen from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RulesScreen from './src/screens/RulesScreen';
import {
  PracticeSetupScreen,
  PracticeGameScreen,
  PracticeHistoryScreen,
} from './src/screens/practice';

const Stack = createNativeStackNavigator();

const HomeButton = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Home')}
      style={styles.homeButton}
      accessibilityLabel="Go to home screen"
      accessibilityRole="button"
    >
      <Icon name="house.fill" size={IconSize.medium} color={colors.labelLight} weight="medium" />
    </TouchableOpacity>
  );
};

const PlayButton = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { currentGame } = useGame();

  // Only show if there's an active game with no winner
  if (!currentGame || currentGame.winner) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={[styles.headerBadge, { backgroundColor: colors.gold + '20' }]}
      accessibilityLabel="Continue game"
      accessibilityRole="button"
    >
      <Icon name="play.fill" size={IconSize.small} color={colors.gold} weight="medium" />
      <Text style={[styles.headerBadgeText, { color: colors.gold }]}>Play</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeButton: {
    width: TapTargets.minimum,
    height: TapTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.large,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerBadgeText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
});

const AppNavigator = () => {
  const { colors, themeName } = useTheme();
  const isLightTheme = themeName === 'light';

  return (
    <>
      <StatusBar
        barStyle={isLightTheme ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.labelLight,
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
          options={{
            title: 'Setup Game',
            headerLeft: HomeButton,
          }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            title: 'Game',
            headerLeft: HomeButton,
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Scoreboard',
            headerLeft: HomeButton,
            headerRight: PlayButton,
          }}
        />
        <Stack.Screen
          name="Rules"
          component={RulesScreen}
          options={{
            title: 'Rules',
            headerLeft: HomeButton,
          }}
        />
        {/* Practice Mode Screens */}
        <Stack.Screen
          name="PracticeSetup"
          component={PracticeSetupScreen}
          options={{
            title: 'Practice Mode',
            headerLeft: HomeButton,
          }}
        />
        <Stack.Screen
          name="PracticeGame"
          component={PracticeGameScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PracticeHistory"
          component={PracticeHistoryScreen}
          options={{
            title: 'Results',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </>
  );
};

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <GameProvider>
              <PracticeGameProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </PracticeGameProvider>
            </GameProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
