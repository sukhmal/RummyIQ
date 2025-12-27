import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, ThemeName, themeNames, themes, Spacing, IconSize, BorderRadius } from '../theme';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.65;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const themeOrder: ThemeName[] = ['midnight', 'light', 'ocean', 'forest', 'royal'];

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { colors, themeName, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(MODAL_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleThemeSelect = (theme: ThemeName) => {
    setTheme(theme);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="black"
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close settings"
              accessibilityRole="button">
              <Icon name="xmark.circle.fill" size={IconSize.large} color={colors.secondaryLabel} weight="medium" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Appearance Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="paintpalette.fill" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>Appearance</Text>
              </View>

              {/* Theme Grid */}
              <View style={styles.themeGrid}>
                {themeOrder.map((theme) => {
                  const themeColors = themes[theme];
                  const isSelected = themeName === theme;
                  return (
                    <TouchableOpacity
                      key={theme}
                      style={[
                        styles.themeCard,
                        { backgroundColor: themeColors.cardBackground },
                        isSelected && styles.themeCardSelected,
                        isSelected && { borderColor: colors.accent },
                      ]}
                      onPress={() => handleThemeSelect(theme)}
                      accessibilityLabel={`Select ${themeNames[theme]} theme`}
                      accessibilityRole="button">
                      {/* Color Swatches */}
                      <View style={styles.swatchRow}>
                        <View style={[styles.swatch, { backgroundColor: themeColors.background }]} />
                        <View style={[styles.swatch, { backgroundColor: themeColors.accent }]} />
                        <View style={[styles.swatch, { backgroundColor: themeColors.tint }]} />
                        <View style={[styles.swatch, { backgroundColor: themeColors.gold }]} />
                      </View>

                      {/* Theme Name & Checkmark */}
                      <View style={styles.themeInfo}>
                        <Text style={[styles.themeName, { color: themeColors.label }]}>
                          {themeNames[theme]}
                        </Text>
                        {isSelected && (
                          <Icon name="checkmark.circle.fill" size={IconSize.medium} color={colors.success} weight="medium" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Future Sections Placeholder */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="slider.horizontal.3" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>Game Defaults</Text>
              </View>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="info.circle.fill" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.tertiaryLabel,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.label,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.label,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  themeCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderWidth: 2,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    backgroundColor: colors.cardBackground,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  comingSoonText: {
    color: colors.tertiaryLabel,
    fontSize: 14,
    fontStyle: 'italic',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  aboutLabel: {
    color: colors.label,
    fontSize: 14,
  },
  aboutValue: {
    color: colors.secondaryLabel,
    fontSize: 14,
  },
});

export default SettingsModal;
