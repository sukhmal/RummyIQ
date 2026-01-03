import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, Typography, Spacing, IconSize, BorderRadius } from '../theme';

type DialogType = 'warning' | 'error' | 'info';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getIconName = () => {
    switch (type) {
      case 'error':
        return 'xmark.circle.fill';
      case 'info':
        return 'info.circle.fill';
      case 'warning':
      default:
        return 'exclamationmark.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return colors.destructive;
      case 'info':
        return colors.tint;
      case 'warning':
      default:
        return colors.warning;
    }
  };

  const getIconBackgroundColor = () => {
    return getIconColor() + '20';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="black"
        />
        <View style={styles.dialog}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
            <Icon name={getIconName()} size={IconSize.medium} color={getIconColor()} weight="medium" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityLabel={cancelText}
              accessibilityRole="button">
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              accessibilityLabel={confirmText}
              accessibilityRole="button">
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.label,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.tint,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  confirmText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: colors.label,
  },
});

export default ConfirmationDialog;
