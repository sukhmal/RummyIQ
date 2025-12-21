# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RummyScorer is a React Native mobile app for tracking scores in Indian Rummy games. It supports three game variants: Pool Rummy (101/201/250 point elimination), Points Rummy, and Deals Rummy.

## Build Commands

```bash
# Install dependencies
npm install
bundle install                    # Ruby dependencies (one-time)
bundle exec pod install           # iOS CocoaPods (from ios/ directory)

# Development
npm start                         # Start Metro bundler
npm run ios                       # Build and run iOS app
npm run android                   # Build and run Android app

# Testing and linting
npm test                          # Run Jest tests
npm run lint                      # Run ESLint
```

## Architecture

**Tech Stack**: React Native 0.83.1, React 19, TypeScript, React Navigation (Native Stack)

**State Management**: React Context API (`src/context/GameContext.tsx`) with AsyncStorage persistence. The `GameProvider` manages all game state including current game, players, rounds, and scoring.

**Navigation Flow**:
- Home → GameSetup → Game → History
- 4 screens in `src/screens/`: HomeScreen, GameSetupScreen, GameScreen, HistoryScreen

**Key Types** (`src/types/game.ts`):
- `GameVariant`: 'pool' | 'points' | 'deals'
- `Game`: Complete game state (players, rounds, config, winner)
- `Player`: name, score, isEliminated
- `Round`: scores per player, round winner, timestamp

**Scoring Logic** (in GameContext):
- Invalid declaration: 80 points (pool) or entered value (other variants)
- Declared winner: 0 points
- Pool Rummy: Players eliminated at poolLimit, last remaining wins
- Deals Rummy: After numberOfDeals, lowest scorer wins

**Data Persistence**: AsyncStorage with key 'currentGame', auto-saved on every state change

## Platform Configuration

- iOS: CocoaPods, Swift (AppDelegate.swift), min iOS via react_native_pods.rb
- Android: Gradle, minSdk 24, targetSdk 36, Hermes enabled, New Architecture enabled
- Node.js: >= 20 required
