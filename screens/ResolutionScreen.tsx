// BarnebyAppNeu/screens/ResolutionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Appearance } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGame } from '../contexts/GameContext';
import { t } from '../i18n';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  withSequence, // Nützlich für kombinierte Animationen
  cancelAnimation, // Wichtig zum Aufräumen
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppTheme } from '../constants/theme';

type ResolutionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Resolution'>;

interface Props {
  navigation: ResolutionScreenNavigationProp;
}

const fallbackLightColors = {
  background: '#F7F9FC',
  primaryAccent: '#007AFF',
  secondaryAccent: '#5AC8FA',
  tertiaryAccent: '#E0E0E0',
  cardBackground: '#FFFFFF',
  primaryText: '#121212',
  secondaryText: '#5F6368',
  iconColor: '#5F6368',
  borderColor: '#D1D5DB',
  titleText: '#F5F5F5',
  highlightText: '#F5F5F5',
};

const ResolutionScreen: React.FC<Props> = ({ navigation }) => {
  const { gameState, theme, resetSetupToFirstStep } = useGame();
  const { players, currentSecretWord, roundEndReason, numberOfErzfeinde } = gameState; // numberOfErzfeinde hinzugefügt
  const styles = getStyles(theme);

  const [showSecretWordSection, setShowSecretWordSection] = useState(false);
  const [showArchEnemiesSection, setShowArchEnemiesSection] = useState(false);
  const [showPlayAgainButton, setShowPlayAgainButton] = useState(false);

  // Animation Shared Values
  const wordOpacity = useSharedValue(0);
  const wordScale = useSharedValue(0.7); // Start etwas kleiner
  const wordTranslateY = useSharedValue(20); // Startet etwas tiefer

  const enemyOpacity = useSharedValue(0);
  const enemyScale = useSharedValue(0.7);
  const enemyTranslateY = useSharedValue(20);

  const playAgainOpacity = useSharedValue(0);
  const playAgainTranslateY = useSharedValue(20);


  const erzfeinde = players && Array.isArray(players) ? players.filter(player => player.role === 'Erzfeind') : [];
  const erzfeindNamen = erzfeinde.length > 0 ? erzfeinde.map(player => player.name || t('common.unknown')).join(' & ') : t('roles.archEnemyUnknown');
  const secretWordText = currentSecretWord || t('common.unknown');

  const revealWord = () => {
    if (showSecretWordSection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSecretWordSection(true);
    wordOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    wordScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) }); // Back Easing für leichten "Bounce"
    wordTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    checkShowPlayAgain(true, showArchEnemiesSection);
  };

  const revealEnemies = () => {
    if (showArchEnemiesSection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Stärkere Haptik
    setShowArchEnemiesSection(true);
    // Ähnliche Animation wie für das Wort, aber leicht zeitversetzt oder mit anderer Easing-Kurve für Unterscheidung
    enemyOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    enemyScale.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.3)) }));
    enemyTranslateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));
    checkShowPlayAgain(showSecretWordSection, true);
  };

  const checkShowPlayAgain = (wordShown: boolean, enemiesShown: boolean) => {
     if(wordShown && enemiesShown && !showPlayAgainButton) {
        setShowPlayAgainButton(true);
        playAgainOpacity.value = withDelay(400, withTiming(1, {duration: 500, easing: Easing.out(Easing.quad)}));
        playAgainTranslateY.value = withDelay(400, withTiming(0, {duration: 400, easing: Easing.out(Easing.ease)}));
     }
  };

  const handlePlayAgain = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetSetupToFirstStep();
    navigation.replace('Setup'); // replace, um nicht hierher zurückzukehren
  };

  // Animation Styles
  const animatedWordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ scale: wordScale.value }, { translateY: wordTranslateY.value }],
  }));

  const animatedEnemyStyle = useAnimatedStyle(() => ({
    opacity: enemyOpacity.value,
    transform: [{ scale: enemyScale.value }, { translateY: enemyTranslateY.value }],
  }));

   const animatedPlayAgainStyle = useAnimatedStyle(() => ({
    opacity: playAgainOpacity.value,
    transform: [{ translateY: playAgainTranslateY.value }],
  }));

  // Text für Erzfeind(e) anpassen
  const getArchEnemyLabel = () => {
    if (numberOfErzfeinde > 1 || (erzfeinde.length > 1 && !numberOfErzfeinde)) { // Fallback falls numberOfErzfeinde nicht korrekt gesetzt
        return t('resolutionScreen.enemiesWere'); // "Die Erzfeinde waren:"
    }
    return t('resolutionScreen.enemyWas'); // "Der/Die Erzfeind war:"
  };


  // Stoppe Animationen beim Verlassen des Screens, um Flackern zu verhindern
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Verhindere die Standardaktion, wenn wir die Animationen noch aufräumen müssen
      // Hier nicht unbedingt nötig, da es nur um Ausblenden geht, aber als Muster
      cancelAnimation(wordOpacity);
      cancelAnimation(wordScale);
      cancelAnimation(wordTranslateY);
      cancelAnimation(enemyOpacity);
      cancelAnimation(enemyScale);
      cancelAnimation(enemyTranslateY);
      cancelAnimation(playAgainOpacity);
      cancelAnimation(playAgainTranslateY);
    });
    return unsubscribe;
  }, [navigation, wordOpacity, wordScale, wordTranslateY, enemyOpacity, enemyScale, enemyTranslateY, playAgainOpacity, playAgainTranslateY]);


  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('resolutionScreen.title')}</Text>

      {roundEndReason && (
        <Text style={styles.roundEndReasonText}>{roundEndReason}</Text>
      )}

      <Text style={styles.infoPromptText}>{t('resolutionScreen.revealInfoPrompt')}</Text>

      {/* Wort Enthüllung */}
      {!showSecretWordSection ? (
        <TouchableOpacity style={styles.actionButton} onPress={revealWord}>
          <Ionicons name="key-outline" size={24} color={theme.colors.cardBackground || fallbackLightColors.cardBackground} style={styles.buttonIcon}/>
          <Text style={styles.actionButtonText}>{t('resolutionScreen.revealWordButton')}</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.revealedSection, animatedWordStyle]}>
          <Text style={styles.revealedLabel}>{t('resolutionScreen.wordWas')}</Text>
          <Text style={styles.revealedValueWord}>{secretWordText}</Text>
        </Animated.View>
      )}

      {/* Erzfeind Enthüllung */}
      {!showArchEnemiesSection ? (
        <TouchableOpacity
            style={[styles.actionButton, !showSecretWordSection && styles.actionButtonDisabled]}
            onPress={revealEnemies}
            disabled={!showSecretWordSection} // Button erst aktiv, wenn Wort gezeigt wurde
        >
          <Ionicons name="skull-outline" size={24} color={theme.colors.cardBackground || fallbackLightColors.cardBackground} style={styles.buttonIcon}/>
          <Text style={styles.actionButtonText}>{t('resolutionScreen.revealArchEnemyButton')}</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.revealedSection, animatedEnemyStyle]}>
          <Text style={styles.revealedLabel}>{getArchEnemyLabel()}</Text>
          <Text style={styles.revealedValueEnemy}>{erzfeindNamen}</Text>
        </Animated.View>
      )}


      {/* Nochmal spielen Button */}
      {showPlayAgainButton && (
        <Animated.View style={[styles.playAgainContainer, animatedPlayAgainStyle]}>
          <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.cardBackground || fallbackLightColors.cardBackground} style={styles.buttonIcon} />
            <Text style={styles.playAgainButtonText}>{t('resolutionScreen.playAgain')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const getStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  header: {
    fontSize: theme.fontSizes.h1 + 6,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.primaryText,
    textAlign: 'center',
  },
  roundEndReasonText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  infoPromptText: {
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryAccent,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 10,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Appearance.getColorScheme() === 'light' ? '#000' : '#555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.secondaryText,
    opacity: 0.7,
  },
  actionButtonText: {
    color: theme.colors.cardBackground || fallbackLightColors.cardBackground,
    fontSize: theme.fontSizes.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  revealedSection: {
    marginVertical: 15,
    padding: 20,
    backgroundColor: theme.colors.cardBackground || fallbackLightColors.cardBackground,
    borderRadius: 12,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: Appearance.getColorScheme() === 'light' ? '#000' : '#555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revealedLabel: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondaryText,
    marginBottom: 8,
  },
  revealedValueWord: {
    fontSize: theme.fontSizes.h1 + 4,
    fontWeight: 'bold',
    color: theme.colors.primaryAccent,
    textAlign: 'center',
  },
  revealedValueEnemy: {
    fontSize: theme.fontSizes.h2, // Etwas kleiner als das Wort für Hierarchie
    fontWeight: 'bold',
    color: '#e74c3c', // Bleibt Rot für "Gefahr"
    textAlign: 'center',
  },
  playAgainContainer: {
    marginTop: 40, // Genug Abstand
    width: '80%',
    maxWidth: 300,
  },
  playAgainButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondaryAccent,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Appearance.getColorScheme() === 'light' ? '#000' : '#555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  playAgainButtonText: {
    color: theme.colors.cardBackground || fallbackLightColors.cardBackground,
    fontSize: theme.fontSizes.body + 2,
    fontWeight: 'bold',
  }
});

export default ResolutionScreen;