/**
 * VariantSelector
 *
 * Shared component for selecting game variant (pool/points/deals).
 * Supports both segmented control and radio button styles.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../context/ThemeContext';
import { GameVariant } from '../../types/shared';
import { ThemeColors, Typography, Spacing, BorderRadius, IconSize } from '../../theme';
import Icon from '../Icon';

const VARIANT_METADATA: Record<GameVariant, {
  label: string;
  description: string;
  icon: string;
}> = {
  pool: {
    label: 'Pool',
    description: 'Players are eliminated when they exceed the pool limit. Eliminated players can rejoin when no one is in compulsory play. Last player standing wins.',
    icon: 'person.3.fill',
  },
  points: {
    label: 'Points',
    description: 'Cash game - winner collects from losers based on their hand value × point value.',
    icon: 'star.fill',
  },
  deals: {
    label: 'Deals',
    description: 'Fixed number of deals. Player with lowest total score wins.',
    icon: 'square.stack.fill',
  },
};

const VARIANTS: GameVariant[] = ['pool', 'points', 'deals'];

export interface VariantSelectorProps {
  value: GameVariant;
  onChange: (variant: GameVariant) => void;
  style?: 'segmented' | 'radio';
  showDescription?: boolean;
  disabled?: boolean;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  value,
  onChange,
  style = 'segmented',
  showDescription = true,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (style === 'radio') {
    return (
      <View style={styles.radioContainer}>
        {VARIANTS.map((variant) => {
          const meta = VARIANT_METADATA[variant];
          const isSelected = value === variant;
          return (
            <TouchableOpacity
              key={variant}
              style={[
                styles.radioOption,
                isSelected && styles.radioOptionSelected,
              ]}
              onPress={() => !disabled && onChange(variant)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.radioOuter}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioInfo}>
                <Text
                  style={[
                    styles.radioLabel,
                    isSelected && styles.radioLabelSelected,
                  ]}
                >
                  {meta.label}
                </Text>
                <Text style={styles.radioDescription}>
                  {variant === 'pool' ? 'Eliminated at point limit' :
                   variant === 'points' ? 'Single round, lowest wins' :
                   'Fixed number of deals'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Segmented control style
  const selectedIndex = VARIANTS.indexOf(value);
  const meta = VARIANT_METADATA[value];

  return (
    <View style={styles.segmentedCard}>
      <SegmentedControl
        values={VARIANTS.map(v => VARIANT_METADATA[v].label)}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          onChange(VARIANTS[index]);
        }}
        enabled={!disabled}
        style={styles.segmentedControl}
        fontStyle={styles.segmentedFont}
        activeFontStyle={styles.segmentedActiveFont}
        tintColor={colors.tint}
        backgroundColor={colors.cardBackground}
      />
      {showDescription && (
        <View style={styles.descriptionContainer}>
          <Icon
            name={meta.icon}
            size={IconSize.medium}
            color={colors.tint}
            weight="medium"
          />
          <Text style={styles.descriptionText}>{meta.description}</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Segmented style
    segmentedCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.large,
      padding: Spacing.md,
    },
    segmentedControl: {
      height: 36,
    },
    segmentedFont: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.label,
    },
    segmentedActiveFont: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.label,
    },
    descriptionContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      gap: Spacing.md,
    },
    descriptionText: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      flex: 1,
      lineHeight: 18,
    },

    // Radio style
    radioContainer: {
      gap: Spacing.sm,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.medium,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: Spacing.md,
    },
    radioOptionSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
      backgroundColor: colors.accent + '10',
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    radioInfo: {
      flex: 1,
    },
    radioLabel: {
      ...Typography.body,
      color: colors.label,
      fontWeight: '600',
    },
    radioLabelSelected: {
      color: colors.accent,
    },
    radioDescription: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
      marginTop: 2,
    },
  });

export default VariantSelector;
