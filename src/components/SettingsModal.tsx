import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, ThemeName, themeNames, themes, Typography, Spacing, IconSize, BorderRadius } from '../theme';

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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none">
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="black"
          />
        </Animated.View>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
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
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Theme Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="paintpalette.fill" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>Theme</Text>
              </View>

              {/* Custom Color Segmented Control */}
              <View style={styles.segmentedCard}>
                <View style={styles.colorSegments}>
                  {themeOrder.map((theme) => {
                    const themeColors = themes[theme];
                    const isSelected = themeName === theme;
                    return (
                      <TouchableOpacity
                        key={theme}
                        style={[
                          styles.colorSegment,
                          isSelected && [styles.colorSegmentSelected, { borderColor: colors.tint }],
                        ]}
                        onPress={() => handleThemeSelect(theme)}
                        accessibilityLabel={`Select ${themeNames[theme]} theme`}
                        accessibilityRole="button"
                      >
                        <View style={[styles.colorSwatch, { backgroundColor: themeColors.background }]}>
                          <View style={[styles.colorSwatchAccent, { backgroundColor: themeColors.accent }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.selectedThemeName}>{themeNames[themeName]}</Text>
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
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: MODAL_HEIGHT,
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    ...Typography.title3,
    color: colors.label,
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
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.callout,
    fontWeight: '600',
    color: colors.label,
  },
  segmentedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  colorSegments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  colorSegment: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.small,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSegmentSelected: {
    borderWidth: 2,
  },
  colorSwatch: {
    flex: 1,
    borderRadius: BorderRadius.small - 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  colorSwatchAccent: {
    height: '35%',
    width: '100%',
  },
  selectedThemeName: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.label,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  comingSoon: {
    backgroundColor: colors.cardBackground,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  comingSoonText: {
    ...Typography.subheadline,
    color: colors.tertiaryLabel,
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
    ...Typography.subheadline,
    color: colors.label,
  },
  aboutValue: {
    ...Typography.subheadline,
    color: colors.secondaryLabel,
  },
});

export default SettingsModal;
