# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RummyIQ is a React Native mobile app for tracking scores in Indian Rummy games. It supports three game variants: Pool Rummy (101/201/250 point elimination), Points Rummy, and Deals Rummy.

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
- Score Tracking: Home → GameSetup → Game → History
- Practice Mode: Home → PracticeSetup → PracticeGame → PracticeHistory
- Screens in `src/screens/`: HomeScreen, GameSetupScreen, GameScreen, HistoryScreen
- Practice screens in `src/screens/practice/`: PracticeSetupScreen, PracticeGameScreen, PracticeHistoryScreen

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

## Practice Mode Architecture

**State Management** (`src/context/PracticeGameContext.tsx`): Manages practice game state including players, rounds, hands, deck, discard pile, and bot AI execution. Key functions:
- `createGame()`: Initialize game with human + bots
- `drawCard(source)`: Draw from deck or discard pile
- `discardCard(card)`: Discard selected card
- `declare(melds)`: Validate and process declaration
- `drop()`: Early/middle drop with appropriate penalty
- `executeBotTurn()`: Run AI decision logic for bot players

**Game Engine** (`src/engine/`):
- `types.ts`: Core types (Card, Meld, PracticePlayer, RoundState, PracticeGameState)
- `deck.ts`: Deck creation, shuffling (2 decks + printed jokers)
- `meld.ts`: Meld validation (isValidSet, isValidSequence, isPureSequence, getMeldType)
- `scoring.ts`: Hand analysis, deadwood calculation, declaration validation
- `cardSorting.ts`: Smart sort algorithm that groups cards into potential melds
- `botAI.ts`: Bot decision making (draw source selection, discard choice, declare/drop logic)

**Practice Components** (`src/components/practice/`):
- `Card.tsx`: Individual card display with suit symbols and selection state
- `DraggableHand.tsx`: Player's hand with drag-to-reorder, meld gaps, and meld type badges
- `TableView.tsx`: Oval table with player seats positioned around perimeter
- `TableCenter.tsx`: Draw pile, discard pile, and wild joker display
- `PlayerSeat.tsx`: Bot avatar with name, score, card count, and turn indicator
- `ActionBar.tsx`: Game actions (Draw, Discard, Declare, Drop, Group, Sort)
- `DeclarationModal.tsx`: Full-screen modal for arranging melds and declaring

**Indian Rummy Rules Implemented**:
- 13 cards per player, 14th card drawn then discarded each turn
- Valid declaration requires: 2+ sequences (at least 1 pure), remaining cards in valid melds
- Pure sequence: 3+ consecutive cards of same suit without jokers (wild cards in natural position allowed)
- Sequence: 3+ consecutive cards of same suit (jokers allowed)
- Set: 3-4 cards of same rank, different suits (jokers allowed)
- Wild joker: All cards matching the rank of the cut card
- Drop penalties: 25 points (before first draw), 50 points (after drawing)
- Invalid declaration: 80 points penalty

## Theming System

**Theme Context** (`src/context/ThemeContext.tsx`): Provides dynamic theming with 5 color themes (Ocean Blue [default], Midnight, Light, Forest Green, Royal Purple). Theme selection is persisted via AsyncStorage.

**Theme Definitions** (`src/theme/index.ts`):
- `ThemeColors`: Interface defining all color tokens (background, accent, labels, chart colors, etc.)
- `themes`: Record of all 5 themes
- `Typography`: iOS Dynamic Type scale constants
- `Spacing`: 4-point grid system (xs=4, sm=8, md=16, lg=24, xl=32)
- `IconSize`: Standardized icon sizes (small=16, medium=20, large=24, xlarge=40, xxlarge=60)

**Icons**: Uses SF Symbols via `react-native-sfsymbols` with `src/components/Icon.tsx` wrapper. All icons follow Apple HIG with 44pt minimum tap targets.

**Usage Pattern**: Components use `useTheme()` hook and `createStyles(colors)` function for dynamic styling:
```typescript
const { colors } = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);
```

## Pre-commit Hooks

Uses Husky + lint-staged to validate code before commits:
- **ESLint**: Catches missing imports, unused variables, and code issues
- **TypeScript**: Type-checks staged files to catch type errors

Hooks run automatically on `git commit`. To skip (not recommended): `git commit --no-verify`

## Platform Configuration

- iOS: CocoaPods, Swift (AppDelegate.swift), min iOS via react_native_pods.rb
- Android: Gradle, minSdk 24, targetSdk 36, Hermes enabled, New Architecture enabled
- Node.js: >= 20 required
