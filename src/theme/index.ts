// Theme constants following Apple Human Interface Guidelines
// Multiple theme support with consistent structure

export type ThemeName = 'midnight' | 'light' | 'ocean' | 'forest' | 'royal';

export interface ThemeColors {
  // App-specific colors
  background: string;
  cardBackground: string;
  accent: string;

  // Semantic label colors
  label: string;
  labelLight: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  placeholder: string;

  // Separator
  separator: string;

  // System colors
  destructive: string;
  success: string;
  warning: string;
  tint: string;

  // State colors for game
  winnerBackground: string;
  winnerText: string;
  invalidBackground: string;
  invalidText: string;

  // Custom accent
  gold: string;

  // Chart colors
  chartColors: string[];
}

// Midnight Theme (Original Dark Theme)
const midnightColors: ThemeColors = {
  background: '#0f0f1a',
  cardBackground: '#1a1a2e',
  accent: '#5e81ac',

  label: '#FFFFFF',
  labelLight: '#eeeeee',
  secondaryLabel: 'rgba(235, 235, 245, 0.7)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.4)',
  placeholder: '#888888',

  separator: 'rgba(94, 129, 172, 0.4)',

  destructive: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
  tint: '#5e9eff',

  winnerBackground: '#1b5e20',
  winnerText: '#a5d6a7',
  invalidBackground: '#b71c1c',
  invalidText: '#ffcdd2',

  gold: '#FFD700',

  chartColors: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#FF5722', '#3F51B5'],
};

// Light Theme
const lightColors: ThemeColors = {
  background: '#F2F2F7',
  cardBackground: '#FFFFFF',
  accent: '#007AFF',

  label: '#000000',
  labelLight: '#1C1C1E',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  placeholder: '#8E8E93',

  separator: 'rgba(60, 60, 67, 0.29)',

  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
  tint: '#007AFF',

  winnerBackground: '#d4edda',
  winnerText: '#155724',
  invalidBackground: '#f8d7da',
  invalidText: '#721c24',

  gold: '#FFB800',

  chartColors: ['#34C759', '#007AFF', '#FF9500', '#FF2D55', '#AF52DE', '#5AC8FA', '#FFCC00', '#A2845E', '#8E8E93', '#FF3B30', '#5856D6'],
};

// Ocean Blue Theme
const oceanColors: ThemeColors = {
  background: '#0a1628',
  cardBackground: '#0d2137',
  accent: '#00b4d8',

  label: '#FFFFFF',
  labelLight: '#e0f7fa',
  secondaryLabel: 'rgba(224, 247, 250, 0.6)',
  tertiaryLabel: 'rgba(224, 247, 250, 0.3)',
  placeholder: '#4a6fa5',

  separator: 'rgba(0, 180, 216, 0.3)',

  destructive: '#ff6b6b',
  success: '#00cec9',
  warning: '#ffeaa7',
  tint: '#00b4d8',

  winnerBackground: '#004d40',
  winnerText: '#80cbc4',
  invalidBackground: '#4a1c1c',
  invalidText: '#ffcdd2',

  gold: '#ffd166',

  chartColors: ['#00cec9', '#0984e3', '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#ffeaa7', '#55a3a3', '#636e72', '#d63031', '#6c5ce7'],
};

// Forest Green Theme
const forestColors: ThemeColors = {
  background: '#1a2e1a',
  cardBackground: '#243524',
  accent: '#4a7c4a',

  label: '#FFFFFF',
  labelLight: '#e8f5e9',
  secondaryLabel: 'rgba(232, 245, 233, 0.6)',
  tertiaryLabel: 'rgba(232, 245, 233, 0.3)',
  placeholder: '#6b8e6b',

  separator: 'rgba(74, 124, 74, 0.4)',

  destructive: '#ef5350',
  success: '#66bb6a',
  warning: '#ffca28',
  tint: '#81c784',

  winnerBackground: '#2e5a2e',
  winnerText: '#a5d6a7',
  invalidBackground: '#5a2e2e',
  invalidText: '#ffcdd2',

  gold: '#ffd54f',

  chartColors: ['#66bb6a', '#42a5f5', '#ffa726', '#ec407a', '#ab47bc', '#26c6da', '#ffee58', '#8d6e63', '#78909c', '#ef5350', '#7e57c2'],
};

// Royal Purple Theme
const royalColors: ThemeColors = {
  background: '#1a1a2e',
  cardBackground: '#2d1b4e',
  accent: '#7c4dff',

  label: '#FFFFFF',
  labelLight: '#ede7f6',
  secondaryLabel: 'rgba(237, 231, 246, 0.6)',
  tertiaryLabel: 'rgba(237, 231, 246, 0.3)',
  placeholder: '#7e57c2',

  separator: 'rgba(124, 77, 255, 0.3)',

  destructive: '#ff5252',
  success: '#69f0ae',
  warning: '#ffd740',
  tint: '#7c4dff',

  winnerBackground: '#1b5e20',
  winnerText: '#b9f6ca',
  invalidBackground: '#4a1c1c',
  invalidText: '#ff8a80',

  gold: '#ffd700',

  chartColors: ['#69f0ae', '#448aff', '#ff6e40', '#ff4081', '#e040fb', '#40c4ff', '#ffff00', '#a1887f', '#90a4ae', '#ff5252', '#7c4dff'],
};

// Theme map
export const themes: Record<ThemeName, ThemeColors> = {
  midnight: midnightColors,
  light: lightColors,
  ocean: oceanColors,
  forest: forestColors,
  royal: royalColors,
};

// Theme display names
export const themeNames: Record<ThemeName, string> = {
  midnight: 'Midnight',
  light: 'Light',
  ocean: 'Ocean Blue',
  forest: 'Forest Green',
  royal: 'Royal Purple',
};

// Default export for backward compatibility
export const Colors = midnightColors;

export const Typography = {
  // iOS Dynamic Type scale
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

export const Spacing = {
  // 4-point grid system
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  pill: 9999,
};

export const TapTargets = {
  // Apple HIG minimum 44pt tap target
  minimum: 44,
  comfortable: 48,
};

export const IconSize = {
  // Standardized icon sizes for consistency
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 40,
  xxlarge: 60,
};
