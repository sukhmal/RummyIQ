import React from 'react';
import { Platform, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { Colors } from '../theme';

type SymbolWeight =
  | 'ultralight'
  | 'light'
  | 'thin'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}

// Fallback mapping for Android or when SF Symbols unavailable
const FALLBACK_MAP: Record<string, string> = {
  'house.fill': 'H',
  'xmark.circle.fill': 'X',
  'plus.circle.fill': '+',
  'party.popper.fill': '!',
  'trophy.fill': 'T',
  'checkmark.circle.fill': 'C',
  'exclamationmark.triangle.fill': '!',
  'chart.line.uptrend.xyaxis': 'G',
  'clock.arrow.circlepath': 'R',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = Colors.label,
  weight = 'regular',
  style,
}) => {
  if (Platform.OS === 'ios') {
    return (
      <SFSymbol
        name={name}
        weight={weight}
        scale="medium"
        color={color}
        size={size}
        resizeMode="center"
        multicolor={false}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  // Android fallback - use text characters
  return (
    <Text style={[styles.fallback, { fontSize: size, color }, style]}>
      {FALLBACK_MAP[name] || '?'}
    </Text>
  );
};

const styles = StyleSheet.create({
  fallback: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Icon;
