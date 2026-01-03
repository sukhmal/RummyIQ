/**
 * ActionBar Component
 *
 * Compact game action buttons: Draw, Pick Up, Discard, Declare, Drop, Sort
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
import { ThemeColors, Spacing, Typography } from '../../theme';
import Icon from '../Icon';

type ActionType = 'draw-deck' | 'draw-discard' | 'discard' | 'declare' | 'drop' | 'sort' | 'group';

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
        config: { icon: 'square.stack.3d.up', label: 'Draw' },
      });

      if (hasDiscardCard) {
        actions.push({
          type: 'draw-discard',
          config: { icon: 'arrow.up.square', label: 'Pick Up' },
        });
      }
    } else {
      // Discard phase - only show discard when 0 or 1 card selected
      if (selectedCardCount <= 1) {
        actions.push({
          type: 'discard',
          config: {
            icon: 'arrow.down.square',
            label: selectedCardCount > 0 ? 'Discard' : 'Select',
          },
        });

        if (canDeclare) {
          actions.push({
            type: 'declare',
            config: { icon: 'checkmark.seal.fill', label: 'Declare', color: colors.success },
          });
        }
      }
    }

    // Drop is always available during player's turn (25 pts before draw, 50 pts after)
    if (canDrop) {
      actions.push({
        type: 'drop',
        config: { icon: 'xmark.circle', label: 'Drop', dangerous: true },
      });
    }

    // Group is available when 2+ cards selected
    if (selectedCardCount >= 2) {
      actions.push({
        type: 'group',
        config: { icon: 'rectangle.stack', label: 'Group', color: colors.warning },
      });
    }

    // Sort is always available
    actions.push({
      type: 'sort',
      config: { icon: 'arrow.up.arrow.down', label: 'Sort' },
    });

    return actions;
  };

  const actions = getAvailableActions();

  const renderAction = (type: ActionType, config: ActionConfig) => {
    // Sort and Group are always enabled (not turn-dependent)
    const isTurnIndependent = type === 'sort' || type === 'group';

    // Check if action is disabled due to not being player's turn
    const isActionDisabled = isDisabled && !isTurnIndependent;

    // Visual active state - consider both action availability and turn
    const isActive = !isActionDisabled && (
      (type === 'discard' && selectedCardCount > 0) ||
      type === 'draw-deck' ||
      type === 'draw-discard' ||
      type === 'declare' ||
      type === 'sort' ||
      type === 'group'
    );

    const buttonColor = config.dangerous
      ? colors.destructive
      : config.color || colors.accent;

    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.actionButton,
          !isActive && type === 'discard' && styles.inactiveButton,
        ]}
        onPress={() => onAction(type)}
        disabled={isActionDisabled || (type === 'discard' && selectedCardCount === 0)}
        activeOpacity={0.7}
        accessibilityLabel={config.label}
        accessibilityRole="button"
      >
        <Icon
          name={config.icon}
          size={18}
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
        {actions.map((action) => renderAction(action.type, action.config))}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
    },
    inactiveButton: {
      opacity: 0.5,
    },
    actionLabel: {
      ...Typography.caption2,
      marginTop: 1,
      fontWeight: '500',
    },
  });

export default ActionBar;
