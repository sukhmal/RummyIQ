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
  Switch,
  TextInput,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { ThemeColors, ThemeName, themeNames, themes, Typography, Spacing, IconSize, BorderRadius, TapTargets } from '../theme';
import { GameVariant, PoolType, CURRENCIES } from '../types/game';
import { getCurrencySymbol } from '../context/SettingsContext';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.85;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const themeOrder: ThemeName[] = ['midnight', 'light', 'ocean', 'forest', 'royal'];

const GAME_TYPES: GameVariant[] = ['pool', 'points', 'deals'];
const GAME_TYPE_LABELS = ['Pool', 'Points', 'Deals'];

const POOL_LIMITS: PoolType[] = [101, 201, 250];
const POOL_LIMIT_LABELS = ['101', '201', '250'];

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { colors, themeName, setTheme } = useTheme();
  const { defaults, updateDefaults } = useSettings();
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

  const gameTypeIndex = GAME_TYPES.indexOf(defaults.gameType);
  const poolLimitIndex = POOL_LIMITS.indexOf(defaults.poolLimit as 101 | 201 | 250);

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

            {/* Currency Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="dollarsign.circle.fill" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>Currency</Text>
              </View>

              <View style={styles.currencyCard}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.currencyList}
                >
                  {CURRENCIES.map((currency) => {
                    const isSelected = defaults.currency === currency.code;
                    return (
                      <TouchableOpacity
                        key={currency.code}
                        style={[
                          styles.currencyItem,
                          isSelected && [styles.currencyItemSelected, { borderColor: colors.tint }],
                        ]}
                        onPress={() => updateDefaults({ currency: currency.code })}
                        accessibilityLabel={`Select ${currency.name}`}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.currencySymbol, isSelected && { color: colors.tint }]}>
                          {currency.symbol}
                        </Text>
                        <Text style={[styles.currencyCode, isSelected && { color: colors.tint }]}>
                          {currency.code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text style={styles.selectedCurrencyName}>
                  {CURRENCIES.find(c => c.code === defaults.currency)?.name || 'US Dollar'}
                </Text>
              </View>
            </View>

            {/* Game Defaults Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="slider.horizontal.3" size={IconSize.medium} color={colors.accent} weight="medium" />
                <Text style={styles.sectionTitle}>Game Defaults</Text>
              </View>

              <View style={styles.defaultsCard}>
                {/* Default Game Type */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Game Type</Text>
                  <SegmentedControl
                    values={GAME_TYPE_LABELS}
                    selectedIndex={gameTypeIndex >= 0 ? gameTypeIndex : 0}
                    onChange={(event) => {
                      const index = event.nativeEvent.selectedSegmentIndex;
                      updateDefaults({ gameType: GAME_TYPES[index] });
                    }}
                    style={styles.compactSegmentedControl}
                    fontStyle={styles.segmentedFont}
                    activeFontStyle={styles.segmentedActiveFont}
                    tintColor={colors.tint}
                    backgroundColor={colors.background}
                  />
                </View>

                {/* Default Pool Limit - only show for Pool game type */}
                {defaults.gameType === 'pool' && (
                  <>
                    <View style={styles.settingDivider} />

                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Pool Limit</Text>
                      <SegmentedControl
                        values={POOL_LIMIT_LABELS}
                        selectedIndex={poolLimitIndex >= 0 ? poolLimitIndex : 2}
                        onChange={(event) => {
                          const index = event.nativeEvent.selectedSegmentIndex;
                          updateDefaults({ poolLimit: POOL_LIMITS[index] });
                        }}
                        style={styles.compactSegmentedControl}
                        fontStyle={styles.segmentedFont}
                        activeFontStyle={styles.segmentedActiveFont}
                        tintColor={colors.tint}
                        backgroundColor={colors.background}
                      />
                    </View>

                    <View style={styles.settingDivider} />

                    {/* Drop Penalty */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleLabelContainer}>
                        <Text style={styles.settingLabel}>Drop Penalty</Text>
                        <Text style={styles.settingHint}>Points for dropping</Text>
                      </View>
                      <View style={styles.inputWithSuffix}>
                        <TextInput
                          style={styles.numberInput}
                          value={defaults.dropPenalty.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text, 10) || 0;
                            updateDefaults({ dropPenalty: value });
                          }}
                          keyboardType="numeric"
                          placeholder="25"
                          placeholderTextColor={colors.placeholder}
                        />
                        <Text style={styles.inputSuffix}>pts</Text>
                      </View>
                    </View>

                    <View style={styles.settingDivider} />

                    {/* Join Table Amount */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleLabelContainer}>
                        <Text style={styles.settingLabel}>Join Table Amount</Text>
                        <Text style={styles.settingHint}>Buy-in per player</Text>
                      </View>
                      <View style={styles.inputWithSuffix}>
                        <TextInput
                          style={styles.numberInput}
                          value={defaults.joinTableAmount.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text, 10) || 0;
                            updateDefaults({ joinTableAmount: value });
                          }}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.placeholder}
                        />
                        <Text style={styles.inputSuffix}>{getCurrencySymbol(defaults.currency)}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Default Number of Deals - only show for Deals game type */}
                {defaults.gameType === 'deals' && (
                  <>
                    <View style={styles.settingDivider} />

                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Number of Deals</Text>
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => {
                            if (defaults.numberOfDeals > 1) {
                              updateDefaults({ numberOfDeals: defaults.numberOfDeals - 1 });
                            }
                          }}
                          accessibilityLabel="Decrease number of deals"
                          accessibilityRole="button"
                        >
                          <Icon name="minus" size={IconSize.small} color={defaults.numberOfDeals <= 1 ? colors.tertiaryLabel : colors.tint} weight="bold" />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{defaults.numberOfDeals}</Text>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => {
                            if (defaults.numberOfDeals < 10) {
                              updateDefaults({ numberOfDeals: defaults.numberOfDeals + 1 });
                            }
                          }}
                          accessibilityLabel="Increase number of deals"
                          accessibilityRole="button"
                        >
                          <Icon name="plus" size={IconSize.small} color={defaults.numberOfDeals >= 10 ? colors.tertiaryLabel : colors.tint} weight="bold" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.settingDivider} />

                {/* Default Player Count */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Starting Players</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => {
                        if (defaults.playerCount > 2) {
                          updateDefaults({ playerCount: defaults.playerCount - 1 });
                        }
                      }}
                      accessibilityLabel="Decrease player count"
                      accessibilityRole="button"
                    >
                      <Icon name="minus" size={IconSize.small} color={defaults.playerCount <= 2 ? colors.tertiaryLabel : colors.tint} weight="bold" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{defaults.playerCount}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => {
                        if (defaults.playerCount < 11) {
                          updateDefaults({ playerCount: defaults.playerCount + 1 });
                        }
                      }}
                      accessibilityLabel="Increase player count"
                      accessibilityRole="button"
                    >
                      <Icon name="plus" size={IconSize.small} color={defaults.playerCount >= 11 ? colors.tertiaryLabel : colors.tint} weight="bold" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.settingDivider} />

                {/* Remember Last Game Toggle */}
                <View style={styles.settingRowToggle}>
                  <View style={styles.toggleLabelContainer}>
                    <Text style={styles.settingLabel}>Remember Last Game</Text>
                    <Text style={styles.settingHint}>Auto-fill from previous game</Text>
                  </View>
                  <Switch
                    value={defaults.rememberLastGame}
                    onValueChange={(value) => updateDefaults({ rememberLastGame: value })}
                    trackColor={{ false: colors.separator, true: colors.tint }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.separator}
                  />
                </View>
              </View>
            </View>

            {/* About Section */}
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

  // Currency Styles
  currencyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  currencyList: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  currencyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
    minWidth: 60,
  },
  currencyItemSelected: {
    borderWidth: 2,
  },
  currencySymbol: {
    ...Typography.title2,
    fontWeight: '600',
    color: colors.label,
  },
  currencyCode: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  selectedCurrencyName: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.label,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Game Defaults Styles
  defaultsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TapTargets.minimum,
  },
  settingRowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TapTargets.minimum,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: Spacing.sm,
  },
  settingLabel: {
    ...Typography.subheadline,
    color: colors.label,
  },
  settingHint: {
    ...Typography.caption1,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  compactSegmentedControl: {
    width: 160,
    height: 32,
  },
  segmentedFont: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.label,
  },
  segmentedActiveFont: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.label,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.label,
    minWidth: 32,
    textAlign: 'center',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  numberInput: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: colors.label,
    minWidth: 40,
    textAlign: 'center',
    padding: 0,
  },
  inputSuffix: {
    ...Typography.subheadline,
    color: colors.secondaryLabel,
  },

  // About Styles
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
