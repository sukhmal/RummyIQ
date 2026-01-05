# RummyIQ

*Where Skill Wins*

A mobile scoring app for Indian Rummy that supports all major variants: Pool Rummy, Points Rummy, and Deals Rummy.

## Features

### Score Tracking Mode
- **Multiple Game Variants**:
  - Pool Rummy (101/201/250 points or custom limit)
  - Points Rummy
  - Deals Rummy
- **Player Management**: Add 2-11 players per game
- **Score Tracking**: Easy round-by-round score entry with winner selection
- **Invalid Declaration Handling**: Automatic 80-point penalty
- **Player Rejoin**: Eliminated players can rejoin in Pool games when no active player is in compulsory play
- **Buy-in Tracking**: Configure join table amount and drop penalty for Pool games
- **Multi-Currency Support**: Choose from 8 global currencies (USD, EUR, GBP, INR, JPY, AUD, CAD, CNY)
- **Game History**: View complete scoreboard, score progression charts, and round-by-round breakdown

### Practice Mode (Play Against AI Bots)
- **Interactive Gameplay**: Play actual rummy games against 1-5 AI opponents
- **Virtual Table**: Landscape view with players positioned around an oval table
- **Drag-to-Reorder Cards**: Rearrange your hand by dragging cards
- **Smart Sort**: Automatically group cards into potential melds (pure sequences, sequences, sets)
- **Meld Grouping**: Select cards and group them into melds with visual gaps between groups
- **Meld Indicators**: Visual badges show meld types (Pure, Seq, Set, Invalid)
- **Draw/Discard Actions**: Draw from deck or discard pile, discard selected card
- **Declaration Flow**: Declare with modal showing card arrangement and validation
- **Drop Option**: Early drop (25 points) or middle drop (50 points)
- **Bot AI**: Bots make strategic decisions with realistic timing
- **Wild Joker Support**: Random card determines wild jokers each round

### General Features
- **Auto-Save**: Game state persists between sessions
- **Multiple Themes**: Choose from 5 beautiful themes:
  - Ocean Blue (default)
  - Midnight
  - Light
  - Forest Green
  - Royal Purple
- **Apple HIG Compliant**: Native iOS controls and SF Symbols throughout

## Architecture

### Shared Components

The app uses shared components between Scorer and Practice modes to reduce duplication:

**Location**: `src/components/shared/`

| Component | Purpose |
|-----------|---------|
| `VariantSelector` | Game type selection (pool/points/deals) |
| `PoolLimitSelector` | Pool limit configuration with presets |
| `NumberSelector` | Segmented number picker |
| `NumberInputField` | Labeled numeric input with icon/prefix/suffix |
| `WinnerBanner` | Victory display banner |
| `GameInfoBadges` | Game metadata badges (variant, rounds, etc.) |
| `Leaderboard` | Player rankings with scores and wins |

**Shared Types**: `src/types/shared.ts` defines common interfaces (`GameVariant`, `BaseGameConfig`, `BasePlayer`) used by both modes.

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
