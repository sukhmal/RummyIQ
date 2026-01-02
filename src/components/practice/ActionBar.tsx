/**
 * ActionBar Component
 *
 * Game action buttons: Draw from Deck, Draw from Discard, Discard, Declare, Drop
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, Spacing, Typography, TapTargets } from '../../theme';
import Icon from '../Icon';

type ActionType = 'draw-deck' | 'draw-discard' | 'discard' | 'declare' | 'drop';

interface ActionConfig {
  icon: string;
  label: string;
  color?: string;
  dangerous?: boolean;
}

interface ActionBarProps {
  turnPhase: 'draw' | 'discard';
  canDeclare?: boolean;
  canDrop?: boolean;
  hasDiscardCard?: boolean;
  selectedCardCount?: number;
  onAction: (action: ActionType) => void;
  isDisabled?: boolean;
  style?: ViewStyle;
}

const ActionBar: React.FC<ActionBarProps> = ({
  turnPhase,
  canDeclare = false,
  canDrop = true,
  hasDiscardCard = true,
  selectedCardCount = 0,
  onAction,
  isDisabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getAvailableActions = (): { type: ActionType; config: ActionConfig }[] => {
    const actions: { type: ActionType; config: ActionConfig }[] = [];

    if (turnPhase === 'draw') {
      actions.push({
        type: 'draw-deck',
        config: { icon: 'square.stack.3d.up', label: 'Draw Deck' },
      });

      if (hasDiscardCard) {
        actions.push({
          type: 'draw-discard',
          config: { icon: 'arrow.up.square', label: 'Pick Up' },
        });
      }

      if (canDrop) {
        actions.push({
          type: 'drop',
          config: { icon: 'xmark.circle', label: 'Drop', dangerous: true },
        });
      }
    } else {
      // Discard phase
      actions.push({
        type: 'discard',
        config: {
          icon: 'arrow.down.square',
          label: selectedCardCount > 0 ? 'Discard' : 'Select Card',
        },
      });

      if (canDeclare) {
        actions.push({
          type: 'declare',
          config: { icon: 'checkmark.seal.fill', label: 'Declare', color: colors.success },
        });
      }

      if (canDrop) {
        actions.push({
          type: 'drop',
          config: { icon: 'xmark.circle', label: 'Drop', dangerous: true },
        });
      }
    }

    return actions;
  };

  const actions = getAvailableActions();

  const renderAction = (type: ActionType, config: ActionConfig, _index: number) => {
    const isActive =
      (type === 'discard' && selectedCardCount > 0) ||
      type === 'draw-deck' ||
      type === 'draw-discard' ||
      type === 'declare';

    const buttonColor = config.dangerous
      ? colors.destructive
      : config.color || colors.accent;

    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.actionButton,
          !isActive && type === 'discard' && styles.inactiveButton,
          config.dangerous && styles.dangerButton,
        ]}
        onPress={() => onAction(type)}
        disabled={isDisabled || (type === 'discard' && selectedCardCount === 0)}
        activeOpacity={0.7}
        accessibilityLabel={config.label}
        accessibilityRole="button"
      >
        <Icon
          name={config.icon}
          size={24}
          color={isActive ? buttonColor : colors.tertiaryLabel}
          weight="medium"
        />
        <Text
          style={[
            styles.actionLabel,
            { color: isActive ? buttonColor : colors.tertiaryLabel },
          ]}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.actionsRow}>
        {actions.map((action, index) => renderAction(action.type, action.config, index))}
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseIndicator}>
        <Icon
          name={turnPhase === 'draw' ? 'arrow.down.circle' : 'arrow.up.circle'}
          size={16}
          color={colors.secondaryLabel}
          weight="medium"
        />
        <Text style={styles.phaseText}>
          {turnPhase === 'draw' ? 'Draw a card' : 'Discard a card'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: TapTargets.minimum,
      minHeight: TapTargets.minimum,
      paddingHorizontal: Spacing.sm,
    },
    inactiveButton: {
      opacity: 0.5,
    },
    dangerButton: {
      // Styling for dangerous actions
    },
    actionLabel: {
      ...Typography.caption1,
      marginTop: 4,
      fontWeight: '500',
    },
    phaseIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      gap: Spacing.xs,
    },
    phaseText: {
      ...Typography.footnote,
      color: colors.secondaryLabel,
    },
  });

export default ActionBar;
