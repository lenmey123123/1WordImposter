// BarnebyAppNeu/screens/GameScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Platform, Pressable, Appearance, ActivityIndicator, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGame } from '../contexts/GameContext';
import { t } from '../i18n';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  interpolate,
  withRepeat,
  withSequence,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme, ThemeColors } from '../constants/theme'; // ThemeColors importieren
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface Props {
  navigation: GameScreenNavigationProp;
}

const ADMIN_PIN = "2004";
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// KORREKTUR: fallbackLightColors muss alle verwendeten ThemeColors-Eigenschaften enthalten
const fallbackLightColors: ThemeColors = {
  background: '#F7F9FC',
  primaryText: '#1A1D21',
  secondaryText: '#5F6368',
  primaryAccent: '#007AFF',
  secondaryAccent: '#5AC8FA',
  tertiaryAccent: '#E8EAED',
  cardBackground: '#FFFFFF', // Hinzugefügt für Vollständigkeit
  modalBackground: '#FFFFFF', // Wichtig für den Fix
  iconColor: '#3C4043',
  titleText: '#1A1D21',
  highlightText: '#007AFF',
  borderColor: '#DDE1E6',
  floatingElementBackground: '#FFFFFF',
  interactiveFocusBackground: 'rgba(0, 122, 255, 0.1)',
  destructiveAction: '#FF3B30',
  positiveAction: '#34C759',
};

const getTimerColorValue = (timerValue: number, roundTimeInSeconds: number, theme: AppTheme) => {
  const percentage = roundTimeInSeconds > 0 && timerValue > 0 ? timerValue / roundTimeInSeconds : 0;
  const primary = theme.colors.primaryAccent;
  const orange = theme.colors.secondaryAccent;
  const red = theme.colors.destructiveAction;

  if (timerValue <= 0) return red;
  if (timerValue <= 10) return red;
  if (percentage < 0.4 && timerValue > 10) return orange;
  return primary;
};

const GameScreen: React.FC<Props> = ({ navigation }) => {
  const { gameState, startGameTimer, stopGameTimer, goToResolutionPhase, changeSecretWord, theme } = useGame();
  const { gamePhase, timerValue, isTimerRunning, currentSecretWord, roundTimeInSeconds, players, isLoading: isGameContextLoading } = gameState;

  const styles = getStyles(theme); // getStyles verwendet jetzt das volle theme
  const isFocused = useIsFocused();
  const [stopButtonConfirm, setStopButtonConfirm] = useState(false);
  const pausedByButtonRef = useRef(false);
  const timerWasRunningBeforeStopConfirm = useRef(false);

  const [isAdminMenuVisible, setIsAdminMenuVisible] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [newWordInput, setNewWordInput] = useState("");
  const [isScreenReady, setIsScreenReady] = useState(false);

  const timerScale = useSharedValue(1);
  const timerColor = useSharedValue(getTimerColorValue(timerValue, roundTimeInSeconds, theme));
  const globalScreenPulseOpacity = useSharedValue(0);
  const actionButtonScale = useSharedValue(1);

  const triggerHapticPulse = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  useEffect(() => {
    if (isFocused && gamePhase === 'WordPhase' && players && players.length > 0 && !isGameContextLoading) {
      setIsScreenReady(true);
      if (timerValue === roundTimeInSeconds && roundTimeInSeconds > 0 && !isTimerRunning && !stopButtonConfirm && !pausedByButtonRef.current) {
        startGameTimer();
      }
    } else if (isFocused && (gamePhase !== 'WordPhase' || !players || players.length === 0)) {
      setIsScreenReady(false);
    } else if (!isFocused) {
      if (isTimerRunning) stopGameTimer();
      cancelAnimation(timerScale);
      cancelAnimation(globalScreenPulseOpacity);
      timerScale.value = withTiming(1);
      globalScreenPulseOpacity.value = withTiming(0);
      setIsScreenReady(false);
    }
  }, [isFocused, gamePhase, players, timerValue, roundTimeInSeconds, isTimerRunning, stopButtonConfirm, startGameTimer, stopGameTimer, isGameContextLoading]);


  useEffect(() => {
    if (!isScreenReady) {
        cancelAnimation(timerScale);
        cancelAnimation(globalScreenPulseOpacity);
        timerScale.value = withTiming(1, {duration: 200});
        globalScreenPulseOpacity.value = withTiming(0, {duration: 200});
        return;
    }

    timerColor.value = getTimerColorValue(timerValue, roundTimeInSeconds, theme);

    if (isTimerRunning && timerValue <= 10 && timerValue > 0) {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.bezier(0.5, 0, 0.5, 1) }),
          withTiming(1, { duration: 500, easing: Easing.bezier(0.5, 0, 0.5, 1) }),
          withTiming(1, { duration: 100 }, () => runOnJS(triggerHapticPulse)(Haptics.ImpactFeedbackStyle.Medium))
        ), -1, false
      );
      globalScreenPulseOpacity.value = withRepeat(
        withSequence(withTiming(0.05, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1, true
      );
    } else {
      cancelAnimation(timerScale);
      cancelAnimation(globalScreenPulseOpacity);
      timerScale.value = withTiming(1, { duration: 300 });
      globalScreenPulseOpacity.value = withTiming(0, { duration: 300 });
    }

    if (timerValue <= 0 && isTimerRunning) {
        cancelAnimation(timerScale);
        cancelAnimation(globalScreenPulseOpacity);
        globalScreenPulseOpacity.value = withTiming(0, {duration: 300});
    }
  }, [timerValue, roundTimeInSeconds, theme, isTimerRunning, isScreenReady, timerScale, timerColor, globalScreenPulseOpacity]);


  useEffect(() => {
    if (isFocused && gamePhase === 'Resolution') {
      navigation.replace('Resolution');
    }
  }, [isFocused, gamePhase, navigation]);

  const handleStopRoundPress = () => {
    if (!isScreenReady || (timerValue === 0 && !stopButtonConfirm)) return;
    runOnJS(triggerHapticPulse)(Haptics.ImpactFeedbackStyle.Heavy);

    if (!stopButtonConfirm) {
      setStopButtonConfirm(true);
      timerWasRunningBeforeStopConfirm.current = isTimerRunning;
      if (isTimerRunning) stopGameTimer();
      pausedByButtonRef.current = false;
      actionButtonScale.value = withSequence(
          withTiming(1.2, {duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1, {duration: 150, easing: Easing.in(Easing.ease) })
      );
    } else {
      stopGameTimer();
      goToResolutionPhase({ reasonKey: 'resolutionScreen.roundStoppedByPlayerConfirm' });
    }
  };

  const handlePausePress = () => {
    if (!isScreenReady || (timerValue === 0 && !stopButtonConfirm)) return;
    runOnJS(triggerHapticPulse)();

    if (stopButtonConfirm) {
      setStopButtonConfirm(false);
      pausedByButtonRef.current = false;
      actionButtonScale.value = withTiming(1, {easing: Easing.out(Easing.ease)});
      if (timerWasRunningBeforeStopConfirm.current && timerValue > 0) {
        startGameTimer();
      }
      timerWasRunningBeforeStopConfirm.current = false;
    } else {
      if (isTimerRunning) {
        stopGameTimer();
        pausedByButtonRef.current = true;
      } else {
        if (gamePhase === 'WordPhase' && timerValue > 0) {
          pausedByButtonRef.current = false;
          startGameTimer();
        }
      }
    }
  };

   useEffect(() => {
      if (!isFocused) {
          setStopButtonConfirm(false);
          timerWasRunningBeforeStopConfirm.current = false;
      }
  }, [isFocused]);


  const handleAdminButtonPress = () => { setIsPinModalVisible(true); setPinInput("");};
  const handlePinSubmit = () => { if (pinInput === ADMIN_PIN) { setIsPinModalVisible(false); setNewWordInput(currentSecretWord); setIsAdminMenuVisible(true); } else { Alert.alert(t('common.error'), t('gameScreen.adminPinIncorrect')); setPinInput(""); }};
  const handleAdminChangeWordInternal = () => { if(newWordInput.trim()){ changeSecretWord(newWordInput); } else { Alert.alert(t('common.error'), t('gameScreen.adminErrorEmptyWord'));}};
  const handleAdminRestartGameInternal = () => { stopGameTimer(); setIsAdminMenuVisible(false); navigation.replace('Setup'); };
  const handleAdminEndRoundInternal = () => { stopGameTimer(); goToResolutionPhase({ reasonKey: 'resolutionScreen.roundStoppedByAdmin' }); setIsAdminMenuVisible(false); };


  const animatedTimerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
    color: timerColor.value,
  }));

  const animatedGlobalScreenPulseStyle = useAnimatedStyle(() => ({
    opacity: globalScreenPulseOpacity.value,
    backgroundColor: theme.colors.destructiveAction,
  }));

  const animatedStopButtonWrapperStyle = useAnimatedStyle(() => ({
      transform: [{scale: stopButtonConfirm ? actionButtonScale.value : 1}]
  }));

  const timerDisplayValue = timerValue > 0 ? Math.ceil(timerValue) : 0;
  let pauseResumeIconName: keyof typeof Ionicons.glyphMap = isTimerRunning ? "pause" : "play";
  if (stopButtonConfirm) pauseResumeIconName = "close";

  if (!isScreenReady || isGameContextLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
        <Text style={styles.loadingText}>{t('common.loadingData')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.globalScreenPulseOverlay, animatedGlobalScreenPulseStyle]} pointerEvents="none" />
      {__DEV__ && (
        <Pressable style={styles.adminGearButton} onPress={handleAdminButtonPress}>
          <Ionicons name="settings-outline" size={28} color={theme.colors.iconColor} />
        </Pressable>
      )}
      <View style={styles.timerSection}>
        <Animated.Text style={[styles.timerText, animatedTimerStyle]}>
            {timerDisplayValue}
        </Animated.Text>
      </View>
      <View style={styles.controlsSection}>
        {stopButtonConfirm ? (
            <Text style={styles.confirmStopText}>{t('gameScreen.confirmStopPrompt')}</Text>
        ) : (
            <Text style={styles.instructionText}>
                {isTimerRunning ? t('gameScreen.roundIsRunning') : (pausedByButtonRef.current ? t('gameScreen.gamePaused') : (timerValue === roundTimeInSeconds && roundTimeInSeconds > 0 ? t('gameScreen.readyToStartInstructions') : t('gameScreen.gamePaused')))}
            </Text>
        )}
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={[styles.iconButtonLarge, styles.pauseResumeButton]}
                onPress={handlePausePress}
                disabled={timerValue === 0 && !stopButtonConfirm}
            >
                <Ionicons name={pauseResumeIconName} size={40} color={stopButtonConfirm ? theme.colors.primaryText : theme.colors.background} />
            </TouchableOpacity>
            <Animated.View style={animatedStopButtonWrapperStyle}>
                <TouchableOpacity
                    style={[
                        styles.iconButtonLarge,
                        stopButtonConfirm ? styles.confirmStopActiveButton : styles.stopButton,
                    ]}
                    onPress={handleStopRoundPress}
                    disabled={timerValue === 0 && !stopButtonConfirm}
                >
                    <Ionicons name={stopButtonConfirm ? "checkmark-done" : "stop"} size={40} color={theme.colors.background} />
                </TouchableOpacity>
            </Animated.View>
        </View>
      </View>
      {/* Modals */}
      <Modal visible={isPinModalVisible} onRequestClose={() => setIsPinModalVisible(false)} transparent animationType="fade">
        <View style={styles.modalCenteredView}><View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('gameScreen.adminEnterPinTitle')}</Text>
            <TextInput style={styles.pinInput} keyboardType="number-pad" secureTextEntry maxLength={4} value={pinInput} onChangeText={setPinInput} autoFocus placeholderTextColor={theme.colors.secondaryText}/>
            <View style={styles.modalButtonRow}>
                <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setIsPinModalVisible(false)}><Text style={[styles.modalButtonText, {color: theme.colors.primaryText}]}>{t('common.cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalSubmitButton]} onPress={handlePinSubmit}><Text style={styles.modalButtonText}>{t('common.submit')}</Text></TouchableOpacity>
            </View>
        </View></View>
      </Modal>
      <Modal visible={isAdminMenuVisible} onRequestClose={() => setIsAdminMenuVisible(false)} transparent animationType="slide">
         <View style={styles.modalCenteredView}><View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('gameScreen.adminMenuTitle')}</Text>
            <Text style={styles.adminLabel}>{t('gameScreen.adminChangeWordLabel')}</Text>
            <TextInput style={styles.adminWordInput} value={newWordInput} onChangeText={setNewWordInput} placeholder={t('gameScreen.adminNewWordPlaceholder')} placeholderTextColor={theme.colors.secondaryText}/>
            <TouchableOpacity style={[styles.adminMenuButton, {backgroundColor: theme.colors.secondaryAccent}]} onPress={handleAdminChangeWordInternal}><Text style={styles.adminMenuButtonText}>{t('gameScreen.adminApplyWordChange')}</Text></TouchableOpacity>
            <View style={styles.adminSeparator} />
            <TouchableOpacity style={[styles.adminMenuButton, {backgroundColor: theme.colors.primaryAccent}]} onPress={handleAdminRestartGameInternal}><Text style={styles.adminMenuButtonText}>{t('gameScreen.adminRestartGame')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.adminMenuButton, {backgroundColor: theme.colors.primaryAccent}]} onPress={handleAdminEndRoundInternal}><Text style={styles.adminMenuButtonText}>{t('gameScreen.adminEndRound')}</Text></TouchableOpacity>
            <View style={styles.adminSeparator} />
            <TouchableOpacity style={[styles.adminMenuButton, {backgroundColor: theme.colors.secondaryText}]} onPress={() => setIsAdminMenuVisible(false)}><Text style={styles.adminMenuButtonText}>{t('common.close')}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
};

// KORREKTUR: getStyles nimmt jetzt das volle theme-Objekt entgegen
const getStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  globalScreenPulseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.destructiveAction,
    zIndex: 1,
  },
   loadingText: {
    fontFamily: theme.fonts.secondary,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  adminGearButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.xl,
    right: theme.spacing.lg,
    padding: theme.spacing.sm,
    zIndex: 10,
    borderRadius: theme.borderRadius.pill,
  },
  timerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timerText: {
    fontFamily: theme.fonts.primary,
    fontSize: SCREEN_WIDTH * 0.35,
    fontWeight: 'bold',
    textAlign: 'center',
    // Farbe wird durch animatedTimerStyle gesetzt
  },
  controlsSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: theme.spacing.md,
  },
  confirmStopText: {
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.destructiveAction,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  instructionText: {
    fontFamily: theme.fonts.secondary,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: theme.fontSizes.body * 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    maxWidth: 350,
  },
  iconButtonLarge: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    maxWidth: 85,
    maxHeight: 85,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  pauseResumeButton: {
    backgroundColor: theme.colors.secondaryAccent,
    shadowOpacity: 0.2,
  },
  stopButton: {
    backgroundColor: theme.colors.primaryAccent,
    shadowOpacity: 0.25,
  },
  confirmStopActiveButton: {
    backgroundColor: theme.colors.destructiveAction,
    shadowOpacity: 0.3,
    shadowColor: theme.colors.destructiveAction,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1001,
  },
  modalView: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.modalBackground, // Sicherer Zugriff
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.h1,
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  pinInput: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primaryAccent,
    backgroundColor: 'transparent',
    color: theme.colors.primaryText,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.h1,
    textAlign: 'center',
    width: 180,
    marginBottom: theme.spacing.xl,
    letterSpacing: theme.spacing.md,
    fontFamily: theme.fonts.primary,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    height: 55,
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: theme.colors.tertiaryAccent,
  },
  modalSubmitButton: {
    backgroundColor: theme.colors.primaryAccent,
  },
  modalButtonText: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.body,
    fontWeight: '600',
    // Farbe je nach Button-Kontext (heller/dunkler Button)
    // Hier als Beispiel für Submit-Button (heller Text auf dunklem Button)
    // Für Cancel-Button ggf. theme.colors.primaryText
    color: theme.colors.background,
  },
  adminLabel: {
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondaryText,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  adminWordInput: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.tertiaryAccent,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    fontSize: theme.fontSizes.body,
    color: theme.colors.primaryText,
    fontFamily: theme.fonts.secondary,
  },
  adminMenuButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
    height: 55,
    justifyContent: 'center',
  },
  adminMenuButtonText: {
    fontFamily: theme.fonts.primaryMedium,
    color: theme.colors.background,
    fontSize: theme.fontSizes.body,
    fontWeight: '600',
  },
  adminSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: theme.colors.tertiaryAccent,
    marginVertical: theme.spacing.md,
  }
});

export default GameScreen;