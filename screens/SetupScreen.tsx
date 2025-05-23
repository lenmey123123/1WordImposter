// screens/SetupScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, Alert, Platform,
  TouchableOpacity,
  StyleSheet, Appearance, Dimensions, Pressable
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withSequence,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';
import { GameSettings } from '../types/gameTypes';
import { useGame } from '../contexts/GameContext';
import { DEFAULT_WORD_LISTS } from '../constants/wordLists';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';
import * as Haptics from 'expo-haptics';

type SetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Setup'>;

interface Props {
  navigation: SetupScreenNavigationProp;
}

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;
const MIN_PLAYERS_FOR_TWO_IMPOSTORS = 6;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROUND_TIME_OPTIONS: { label: string; value: GameSettings['roundTimeInSeconds'] }[] = [
  { label: t('setupScreen.time.1min', {defaultValue: "1 Min"}), value: 60 },
  { label: t('setupScreen.time.2min', {defaultValue: "2 Min"}), value: 120 },
  { label: t('setupScreen.time.3min', {defaultValue: "3 Min"}), value: 180 },
  { label: t('setupScreen.time.5min', {defaultValue: "5 Min"}), value: 300 },
];

const SetupScreen: React.FC<Props> = ({ navigation }) => {
  const { initializeGame, gameState, theme, resetSetupToFirstStep } = useGame();
  const styles = getSetupScreenStyles(theme); // Verwende deine Design-Styles

  const nextButtonScale = useSharedValue(1);
  const animatedNextButtonStyle = useAnimatedStyle(() => ({
      transform: [{scale: nextButtonScale.value}]
  }));

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', resetSetupToFirstStep);
    return unsubscribe;
  }, [navigation, resetSetupToFirstStep]);

  const initialPlayerCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, gameState.playerNames?.length || MIN_PLAYERS));
  const [playerNames, setPlayerNames] = useState<string[]>(() => 
    Array(initialPlayerCount).fill('').map((_, i) => gameState.playerNames?.[i]?.trim() || '')
  );

  const [numErzfeinde, setNumErzfeinde] = useState<1 | 2>(() => {
    const initialErzfeinde = gameState.numberOfErzfeinde || 1;
    if (initialPlayerCount < MIN_PLAYERS_FOR_TWO_IMPOSTORS && initialErzfeinde === 2) {
      return 1;
    }
    return initialErzfeinde;
  });
  const [hintMode, setHintMode] = useState(gameState.hintModeEnabled || false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    gameState.selectedCategory || t('setupScreen.randomCategoryValue')
  );
  const [roundTimeInSeconds, setRoundTimeInSeconds] = useState<GameSettings['roundTimeInSeconds']>(gameState.roundTimeInSeconds || 120);
  
  const numPlayers = playerNames.length;

  useEffect(() => {
    if (playerNames.length < MIN_PLAYERS) {
        const diff = MIN_PLAYERS - playerNames.length;
        setPlayerNames(prev => [...prev, ...Array(diff).fill('')]);
    }
    if (numPlayers < MIN_PLAYERS_FOR_TWO_IMPOSTORS && numErzfeinde === 2) {
        setNumErzfeinde(1);
    }
  }, [playerNames.length, numPlayers, numErzfeinde]); // numPlayers hinzugefügt


  const handlePlayerNameChange = useCallback((text: string, index: number) => {
    setPlayerNames(currentNames => {
        const newPlayerNames = [...currentNames];
        if (index >= 0 && index < newPlayerNames.length) {
            newPlayerNames[index] = text;
        }
        return newPlayerNames;
    });
  }, []); 

  const handleAddPlayer = useCallback(() => {
    if (playerNames.length < MAX_PLAYERS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayerNames(prev => [...prev, '']); 
    }
  }, [playerNames.length]);

  const handleRemoveLastPlayer = useCallback(() => {
    if (playerNames.length > MIN_PLAYERS) { 
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPlayerNames(prev => prev.slice(0, -1));
    }
  }, [playerNames.length]);

  const handleProceed = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextButtonScale.value = withSequence(withTiming(0.95, {duration:100, easing: Easing.out(Easing.ease)}), withTiming(1, {duration: 200, easing: Easing.in(Easing.ease)}));

    if (gameState.isLoading) return;

    const finalPlayerNames = playerNames.map((name, idx) =>
      name.trim() === '' ? `${t('setupScreen.playerPlaceholderDefault')}${idx + 1}` : name.trim()
    );

    if (finalPlayerNames.length < MIN_PLAYERS) {
        Alert.alert(t('common.error'), t('setupScreen.minPlayersWarning', {defaultValue: `Minimum ${MIN_PLAYERS} players required.`}));
        return;
    }
    const finalNumErzfeinde = numPlayers < MIN_PLAYERS_FOR_TWO_IMPOSTORS ? 1 : numErzfeinde;

    const settings: GameSettings = {
      numberOfPlayers: numPlayers,
      playerNames: finalPlayerNames,
      numberOfErzfeinde: finalNumErzfeinde,
      roundTimeInSeconds: roundTimeInSeconds,
      hintModeEnabled: hintMode, 
      selectedCategory,
    };
    initializeGame(settings);
    navigation.navigate('RoleReveal');
  }, [numPlayers, playerNames, numErzfeinde, roundTimeInSeconds, hintMode, selectedCategory, initializeGame, navigation, gameState.isLoading, t, nextButtonScale]);

  const categoryOptions = [t('setupScreen.randomCategoryValue'), ...DEFAULT_WORD_LISTS.map(cat => cat.categoryName)];

  // Erzfeind-Auswahl Block (Design & Logik angepasst)
  const ImpostorSwitchBlock = () => {
    const canSelectTwoImpostors = numPlayers >= MIN_PLAYERS_FOR_TWO_IMPOSTORS;

    const toggleImpostors = () => {
      Haptics.selectionAsync();
      if (canSelectTwoImpostors) {
        setNumErzfeinde(prev => (prev === 1 ? 2 : 1));
      } else {
        setNumErzfeinde(1); // Bleibt bei 1, kein Alert mehr nötig, da Hinweistext da ist
      }
    };

    return (
      <View style={[styles.settingBlock, styles.impostorSwitchContainerNew]}>
        <Text style={styles.blockTitleAlt}>{t('setupScreen.numberOfArchEnemies', { defaultValue: "Anzahl Erzfeinde" })}</Text>
        {!canSelectTwoImpostors && (
            <Text style={styles.impostorDisabledHintTextTop}>
                {t('warnings.twoArchEnemiesDisabled', {defaultValue: `Min. ${MIN_PLAYERS_FOR_TWO_IMPOSTORS} Spieler für 2 Erzfeinde`})}
            </Text>
        )}
        <View style={styles.impostorButtonRow}>
            <Pressable
                style={({pressed}) => [
                    styles.impostorOptionButton,
                    numErzfeinde === 1 && styles.impostorOptionButtonSelected,
                    pressed && styles.pressedEffectItem
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setNumErzfeinde(1);
                }}
            >
                <Text style={[
                    styles.impostorOptionButtonText,
                    numErzfeinde === 1 && styles.impostorOptionButtonTextSelected
                ]}>{"1"}</Text>
            </Pressable>
            <Pressable
                style={({pressed}) => [
                    styles.impostorOptionButton,
                    numErzfeinde === 2 && styles.impostorOptionButtonSelected,
                    !canSelectTwoImpostors && styles.impostorOptionButtonDisabled, // Visuell deaktivieren
                    pressed && !(!canSelectTwoImpostors) && styles.pressedEffectItem
                ]}
                onPress={toggleImpostors} // Verwendet die Logik, die auch die Spieleranzahl prüft
                disabled={!canSelectTwoImpostors && numErzfeinde === 1} // Deaktiviert, wenn Wechsel zu 2 nicht möglich ist
            >
                <Text style={[
                    styles.impostorOptionButtonText,
                    numErzfeinde === 2 && styles.impostorOptionButtonTextSelected,
                    !canSelectTwoImpostors && styles.impostorOptionButtonTextDisabled
                ]}>{"2"}</Text>
            </Pressable>
        </View>
      </View>
    );
  };

  // PlayerSetupBlock mit direkter TextInput-Integration (basierend auf dem "minimalen" Ansatz)
  const PlayerSetupBlock = () => (
    <View style={[styles.settingBlock, styles.playerSetupBlockNew]}>
        <Text style={styles.blockTitleAlt}>{t('setupScreen.playersSectionTitle')}</Text>
        <View style={styles.playerNamesListContainer}>
            {playerNames.map((name, index) => (
                <View key={`player-input-row-${index}`} style={styles.playerNameInputRow}>
                    {/* Icon links neben dem Input */}
                    <Ionicons 
                        name="person-outline" // Einfacheres Icon
                        size={24} 
                        color={theme.colors.secondaryText} 
                        style={styles.playerNamePrefixIcon} 
                    />
                    <TextInput
                        style={styles.playerNameInput}
                        value={name}
                        onChangeText={(text) => handlePlayerNameChange(text, index)}
                        placeholder={`${t('common.player')} ${index + 1}`}
                        placeholderTextColor={theme.colors.secondaryText + '90'}
                        autoCapitalize="words"
                        maxLength={20}
                        // Wichtig: keyboardShouldPersistTaps="handled" in der äußeren ScrollView ist entscheidend
                    />
                    {(index === playerNames.length - 1 && playerNames.length > MIN_PLAYERS) && (
                        <TouchableOpacity onPress={handleRemoveLastPlayer} style={styles.removePlayerButton}>
                           <Ionicons name="remove-circle-outline" size={26} color={theme.colors.destructiveAction} />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </View>
        {numPlayers < MAX_PLAYERS && (
            <TouchableOpacity
                onPress={handleAddPlayer}
                style={styles.addPlayerButtonNew}
                activeOpacity={0.7}
            >
                <Ionicons name="add" size={32} color={theme.colors.background} />
            </TouchableOpacity>
        )}
    </View>
  );

  const HintButtonBlock = () => ( 
    <Pressable
        style={({pressed}: {pressed: boolean}) => [ styles.settingBlockSmall, styles.hintBlockNew, hintMode ? styles.hintBlockNewActive : {}, pressed && styles.pressedEffect ]}
        onPress={() => { Haptics.selectionAsync(); setHintMode(!hintMode);}}
        accessibilityRole="switch" accessibilityState={{checked: hintMode}} accessibilityLabel={t('setupScreen.hintButton')}
    >
        <Ionicons name={hintMode ? "eye" : "eye-off"} size={32} color={hintMode ? theme.colors.positiveAction : theme.colors.secondaryText} accessibilityElementsHidden />
        <Text style={[styles.hintBlockTextNew, hintMode && {color: theme.colors.positiveAction, fontFamily: theme.fonts.primaryMedium}]}>
            {hintMode ? t('setupScreen.hintOn') : t('setupScreen.hintOff')}
        </Text>
    </Pressable>
  );

  const RoundTimeSelectorBlock = () => ( 
    <View style={[styles.settingBlockLarge, styles.timeSelectorBlockNew]}>
        <Text style={styles.blockTitleAlt}>{t('setupScreen.roundTime')}</Text>
        <View style={styles.timeButtonsContainer}>
            {ROUND_TIME_OPTIONS.map((option) => (
                <Pressable
                    key={`time-${option.value}`}
                    style={({pressed}: {pressed: boolean}) => [ styles.timeButtonNew, roundTimeInSeconds === option.value && styles.timeButtonNewSelected, pressed && styles.pressedEffectItem ]}
                    onPress={() => { Haptics.selectionAsync(); setRoundTimeInSeconds(option.value); }}
                    accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{selected: roundTimeInSeconds === option.value}}
                >
                    <Text style={[styles.timeButtonTextNew, roundTimeInSeconds === option.value && styles.timeButtonTextNewSelected]}>
                        {option.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    </View>
  );

  const CategoryPickerBlock = () => ( 
    <View style={[styles.settingBlockLarge, styles.categoryBlock]}>
        <Text style={styles.blockTitleAlt}>{t('setupScreen.topicSectionTitle')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPickerScrollNew}>
            {categoryOptions.map((category) => (
                <Pressable
                    key={category}
                    style={({pressed}: {pressed: boolean}) => [ styles.categoryChipLargeNew, selectedCategory === category && styles.categoryChipLargeNewSelected, pressed && styles.pressedEffectItem ]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedCategory(category); }}
                    accessibilityRole="button" accessibilityLabel={category} accessibilityState={{selected: selectedCategory === category}}
                >
                    <Ionicons
                        name={category === t('setupScreen.randomCategoryValue') ? "shuffle" : "albums"}
                        size={36}
                        color={selectedCategory === category ? theme.colors.background : theme.colors.primaryText}
                        style={{marginBottom: theme.spacing.xs}} accessibilityElementsHidden
                    />
                    <Text style={[styles.categoryChipTextLargeNew, selectedCategory === category && styles.categoryChipTextLargeNewSelected]} numberOfLines={2} ellipsizeMode="tail">
                        {category}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerNew}>
        <View style={{width: 30}} />
        <TouchableOpacity onPress={() => navigation.navigate('Rules')} style={styles.rulesIconNew} accessibilityLabel={t('setupScreen.navigateToRules')} accessibilityRole="button">
          <Ionicons name="book-outline" size={30} color={theme.colors.iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContentContainerNew}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Dies ist sehr wichtig für TextInputs in ScrollViews
      >
        <PlayerSetupBlock /> 
        <ImpostorSwitchBlock /> 
        <HintButtonBlock />
        <RoundTimeSelectorBlock /> 
        <CategoryPickerBlock />
        <View style={{height: theme.spacing.xxl + theme.spacing.lg}} /> 
      </ScrollView>

      <View style={styles.footerNewLayout}>
        <Animated.View style={[styles.nextButtonContainerNew, animatedNextButtonStyle]}>
            <Pressable
                style={({pressed}: {pressed: boolean}) => [ styles.nextButtonLargeNew, pressed && styles.pressedEffectStrong ]}
                onPress={handleProceed} accessibilityLabel={t('common.next')} accessibilityRole="button"
            >
                <Text style={styles.nextButtonTextLargeNew}>{t('common.next')}</Text>
                <Ionicons name="arrow-forward-circle" size={38} color={theme.colors.background} style={styles.nextButtonIconStyle}/>
            </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const getSetupScreenStyles = (theme: AppTheme) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerNew: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl - theme.spacing.sm : theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    minHeight: 60,
  },
  rulesIconNew: {
    padding: theme.spacing.sm,
  },
  scrollContentContainerNew: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 130, 
    alignItems: 'center',
  },
  settingBlock: { // Allgemeiner Style für Blöcke
    backgroundColor: theme.colors.floatingElementBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md, // Einheitliches Padding für alle Seiten des Blocks
    marginVertical: theme.spacing.md, // Vertikaler Abstand zwischen Blöcken
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 500,
    alignItems: 'stretch', // Damit innere Elemente die Breite füllen können
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  settingBlockLarge: { // Für größere Blöcke wie Kategorie, Zeit
    backgroundColor: theme.colors.floatingElementBackground,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg, // Mehr vertikales Padding
    paddingHorizontal: theme.spacing.lg, // Mehr horizontales Padding
    marginVertical: theme.spacing.md, 
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 500,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
   settingBlockSmall: { // Für Hint-Button
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.floatingElementBackground,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md, 
    width: SCREEN_WIDTH * 0.8, // Kann spezifischer sein
    maxWidth: 350,
    minHeight: 60, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: theme.colors.tertiaryAccent,
  },
  blockTitleAlt: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondaryText,
    marginBottom: theme.spacing.lg, // Mehr Abstand unter dem Titel
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center', // Titel zentrieren
    // alignSelf: 'flex-start', // Nicht mehr nötig, da Block alignItems: 'stretch' hat
    // paddingHorizontal: theme.spacing.sm, 
  },
  // Player Setup Styles
  playerSetupBlockNew: {
    // Verwendet settingBlock Style
  },
  playerNamesListContainer: { 
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.30, 
    marginBottom: theme.spacing.md, // Abstand zum Add-Button, falls vorhanden
  },
  playerNamesListContent: {
     // paddingBottom: theme.spacing.xs,
  },
  playerNameInputRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', 
    backgroundColor: theme.colors.background, 
    borderRadius: theme.borderRadius.lg, // Größerer Radius
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs, // Vertikaler Abstand zwischen den Feldern
    borderWidth: 1,
    borderColor: theme.colors.tertiaryAccent,
    height: 55, // Feste Höhe für Konsistenz
  },
  playerNamePrefixIcon: { // Icon links vom Namen
    marginRight: theme.spacing.sm,
  },
  playerNameInput: {
    flex: 1,
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.primaryText,
    paddingVertical: theme.spacing.sm, // Vertikales Padding im Input
  },
  removePlayerButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  removePlayerButtonPlaceholder: { // Behält Platz, wenn kein Button da ist
    width: 26 + theme.spacing.sm * 2, // Breite des Icons + Padding
    height: 26,
  },
  addPlayerButtonNew: { 
    backgroundColor: theme.colors.positiveAction,
    borderRadius: theme.borderRadius.md, // Weniger rund für Button-Optik
    paddingVertical: theme.spacing.md,
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'row', // Icon und Text nebeneinander
    // marginTop: theme.spacing.md, // Wird vom Container gesteuert
    alignSelf: 'stretch', // Nimmt volle Breite im Container ein, wenn der Container alignItems: 'center' hat
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: { // Text für den Add-Button
      fontFamily: theme.fonts.primaryMedium,
      color: theme.colors.background,
      fontSize: theme.fontSizes.body,
      marginLeft: theme.spacing.sm,
  },
  // Impostor Switch Block Styles (NEU)
  impostorSwitchContainerNew: {
    // Verwendet settingBlock Style
    alignItems: 'center', // Zentriert den Inhalt dieses Blocks
  },
  impostorButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Zentriert die beiden Buttons
    marginTop: theme.spacing.sm,
    width: '100%', // Nimmt volle Breite des Containers ein
  },
  impostorOptionButton: {
    flex: 1, // Teilt den Platz gleichmäßig auf
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.tertiaryAccent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.tertiaryAccent,
  },
  impostorOptionButtonSelected: {
    backgroundColor: theme.colors.primaryAccent,
    borderColor: theme.colors.primaryAccent,
  },
  impostorOptionButtonText: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondaryText,
  },
  impostorOptionButtonTextSelected: {
    color: theme.colors.background,
  },
  impostorOptionButtonDisabled: {
    backgroundColor: theme.colors.tertiaryAccent + '80', // Leichter ausgegraut
    borderColor: theme.colors.tertiaryAccent + '80',
  },
  impostorOptionButtonTextDisabled: {
    color: theme.colors.secondaryText + '80',
  },
  impostorDisabledHintTextTop: { // Für den Hinweis ÜBER den Buttons
      fontSize: theme.fontSizes.caption,
      color: theme.colors.secondaryText,
      fontStyle: 'italic',
      marginBottom: theme.spacing.sm, // Abstand zu den Buttons
      textAlign: 'center',
  },

  // Andere Blöcke (Styles bleiben wie zuletzt oder aus deiner Referenz)
  hintBlockNew: { borderColor: theme.colors.tertiaryAccent, },
  hintBlockNewActive: { borderColor: theme.colors.positiveAction, backgroundColor: theme.colors.positiveAction + '15', },
  hintBlockTextNew: { fontFamily: theme.fonts.secondaryMedium, fontSize: theme.fontSizes.h3, color: theme.colors.secondaryText, marginLeft: theme.spacing.md, },
  timeSelectorBlockNew: { alignItems: 'stretch', paddingHorizontal: theme.spacing.md, },
  timeButtonsContainer: { width: '100%', marginTop: theme.spacing.sm, },
  timeButtonNew: { backgroundColor: theme.colors.floatingElementBackground, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.tertiaryAccent, },
  timeButtonNewSelected: { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent, },
  timeButtonTextNew: { fontFamily: theme.fonts.secondaryMedium, fontSize: theme.fontSizes.body, color: theme.colors.primaryText, },
  timeButtonTextNewSelected: { color: theme.colors.background, fontFamily: theme.fonts.primaryMedium, },
  categoryBlock: {},
  categoryPickerScrollNew: { paddingHorizontal: theme.spacing.xs, paddingVertical: theme.spacing.md, },
  categoryChipLargeNew: { backgroundColor: theme.colors.floatingElementBackground, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.lg, marginHorizontal: theme.spacing.sm, alignItems: 'center', justifyContent: 'center', width: SCREEN_WIDTH * 0.38, height: SCREEN_WIDTH * 0.28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: 'transparent', },
  categoryChipLargeNewSelected: { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent, shadowColor: theme.colors.primaryAccent, },
  categoryChipTextLargeNew: { fontFamily: theme.fonts.primaryMedium, fontSize: theme.fontSizes.caption, color: theme.colors.primaryText, textAlign: 'center', },
  categoryChipTextLargeNewSelected: { color: theme.colors.background, },
  footerNewLayout: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl + theme.spacing.sm : theme.spacing.md + theme.spacing.sm, alignItems: 'center', backgroundColor: theme.colors.background, borderTopWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth, borderTopColor: theme.colors.tertiaryAccent, },
  nextButtonContainerNew: { width: '100%', alignItems: 'center', },
  nextButtonLargeNew: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryAccent, paddingVertical: theme.spacing.md - 2, borderRadius: theme.borderRadius.pill, width: '100%', maxWidth: 420, minHeight: 60, shadowColor: theme.colors.primaryAccent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 7, elevation: 7, },
  nextButtonTextLargeNew: { fontFamily: theme.fonts.primary, fontSize: theme.fontSizes.h2, color: theme.colors.background, },
  nextButtonIconStyle: { marginLeft: theme.spacing.md, },
  pressedEffect: { transform: [{scale: 0.98}], opacity: 0.9, }, // Für Impostor Block (alter Style)
  pressedEffectItem: { transform: [{scale: 0.95}], opacity: 0.85, },
  pressedEffectStrong: { transform: [{scale: 0.97}], backgroundColor: theme.colors.primaryAccent + 'D0' }
});

export default SetupScreen;