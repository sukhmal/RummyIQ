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

**Shared Types** (`src/types/shared.ts`):
- `GameVariant`: 'pool' | 'points' | 'deals' - single source of truth for both modes
- `BaseGameConfig`: Common configuration interface (variant, poolLimit, numberOfDeals, etc.)
- `BasePlayer`: Common player interface (id, name)
- Constants: `DEFAULT_POOL_LIMIT`, `DEFAULT_FIRST_DROP`, `DEFAULT_MIDDLE_DROP`, `MAX_ROUND_POINTS`

**Scorer Types** (`src/types/game.ts`):
- `Game`: Complete game state (players, rounds, config, winner)
- `Player`: Extends `BasePlayer` with score, isEliminated, rejoinCount
- `GameConfig`: Extends `BaseGameConfig` with joinTableAmount
- `Round`: scores per player, round winner, timestamp

**Practice Types** (`src/engine/types.ts`):
- `PracticePlayer`: Extends `BasePlayer` with isBot, difficulty, avatar
- `PracticeGameConfig`: Extends `BaseGameConfig` with invalidDeclarationPenalty

**Scoring Logic** (unified in `src/engine/scoring.ts`):
- `calculateSimpleScore()`: Score calculation for scorer mode (manual entry)
- `isPlayerEliminated()`: Check if player exceeds pool limit
- `isInCompulsoryPlay()`: Check if player can't afford to drop
- `shouldGameEnd()`: Generic game end detection for all variants
- `determineGameWinner()`: Generic winner determination
- All functions use generics (`<P extends BasePlayer>`) to work with both Player and PracticePlayer types

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

**Shared Components** (`src/components/shared/`):
Reusable components used by both Scorer and Practice modes:
- `VariantSelector`: Game type selection (pool/points/deals) - supports segmented and radio styles
- `PoolLimitSelector`: Pool limit configuration with 101/201/250 presets and optional custom input
- `NumberSelector`: Segmented number picker for bot count, number of deals, etc.
- `NumberInputField`: Labeled numeric input with optional icon, prefix, and suffix
- `WinnerBanner`: Trophy banner showing game winner
- `GameInfoBadges`: Row of badges showing game variant, rounds, players
- `Leaderboard`: Player rankings with scores, wins, and rank badges (gold/silver/bronze)
- `PrimaryButton`: Reusable button with icon, disabled state, and variant/color options

**Shared Utilities** (`src/utils/`):
Common formatting functions used across both modes:
- `formatDate()`: Format date for display (e.g., "Jan 15")
- `getGameTypeLabel()`: Get display label for game type (e.g., "Pool 101", "2 Deals")
- `getGameSummary()`: Get summary of a completed game (winner, variant, players, rounds)

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
