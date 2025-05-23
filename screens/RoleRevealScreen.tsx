// screens/RoleRevealScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Animated, Pressable,
    Platform, Appearance, ActivityIndicator, Dimensions, InteractionManager 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useGame } from '../contexts/GameContext';
import { t } from '../i18n';
import { Player } from '../types/gameTypes';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';

type RoleRevealScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RoleReveal'>;

interface Props {
  navigation: RoleRevealScreenNavigationProp;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INTERACTION_BLOCK_DURATION = 700; 
const FADE_DURATION = 300;

const RoleRevealScreen: React.FC<Props> = ({ navigation }) => {
  const { gameState, proceedToNextRoleReveal, theme } = useGame();
  const { 
    players, 
    currentPlayerTurnForRoleReveal, 
    currentCategory, 
    gamePhase: currentGamePhaseFromContext, 
    hintModeEnabled,
    currentSecretWord,
    isLoading: isGameContextLoading 
  } = gameState;

  const styles = getStyles(theme);

  const [isRoleDetailsVisible, setIsRoleDetailsVisible] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(true);
  const [currentDisplayedPlayer, setCurrentDisplayedPlayer] = useState<Player | null>(null);
  const [isScreenLoading, setIsScreenLoading] = useState(true);

  const passToPlayerOpacity = useRef(new Animated.Value(0)).current;
  const cardFrontOpacity = useRef(new Animated.Value(0)).current;
  const cardBackOpacity = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();
  const navigationTriggeredRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { console.log(`[RoleRevealScreen] STATE CHANGE: isRoleDetailsVisible -> ${isRoleDetailsVisible}`); }, [isRoleDetailsVisible]);
  useEffect(() => { console.log(`[RoleRevealScreen] STATE CHANGE: isInteractionBlocked -> ${isInteractionBlocked}`); }, [isInteractionBlocked]);
  useEffect(() => { console.log(`[RoleRevealScreen] STATE CHANGE: isScreenLoading -> ${isScreenLoading}`); }, [isScreenLoading]);
  
  useEffect(() => {
    return () => {
      console.log("[RoleRevealScreen] Cleanup: Clearing timeoutRef and stopping animations.");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      passToPlayerOpacity.stopAnimation();
      cardFrontOpacity.stopAnimation();
      cardBackOpacity.stopAnimation();
    };
  }, [passToPlayerOpacity, cardFrontOpacity, cardBackOpacity]);

  useEffect(() => {
    console.log(`[RoleRevealScreen] Focus/State Sync | isFocused: ${isFocused}, gamePhase: ${currentGamePhaseFromContext}, turn: ${currentPlayerTurnForRoleReveal}, players: ${players?.length}`);
    
    passToPlayerOpacity.setValue(0);
    cardFrontOpacity.setValue(0);
    cardBackOpacity.setValue(0);

    if (isFocused) {
      navigationTriggeredRef.current = false;
      setIsScreenLoading(true);

      if (currentGamePhaseFromContext === 'RoleReveal') {
        if (players && players.length > 0 && currentPlayerTurnForRoleReveal < players.length) {
          const player = players[currentPlayerTurnForRoleReveal];
          console.log("[RoleRevealScreen] Setting up for new player:", player?.name);
          
          setCurrentDisplayedPlayer(player);
          setIsRoleDetailsVisible(false);
          setIsInteractionBlocked(true);

          Animated.timing(passToPlayerOpacity, {
            toValue: 1,
            duration: FADE_DURATION,
            useNativeDriver: false, // TEST: Auf false setzen
          }).start(() => {
            Animated.timing(cardFrontOpacity, {
              toValue: 1,
              duration: FADE_DURATION,
              delay: 100,
              useNativeDriver: false, // TEST: Auf false setzen
            }).start(() => {
              console.log("[RoleRevealScreen] Player setup animations complete. Unblocking interaction.");
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setIsInteractionBlocked(false);
                console.log("[RoleRevealScreen] Interaction UNBLOCKED.");
              }, INTERACTION_BLOCK_DURATION);
            });
          });
          setIsScreenLoading(false);
        } else if (players && players.length > 0 && currentPlayerTurnForRoleReveal >= players.length) {
          setCurrentDisplayedPlayer(null); 
          setIsScreenLoading(true);
        } else if (!players || players.length === 0 && !isGameContextLoading) {
          InteractionManager.runAfterInteractions(() => navigation.replace('Setup'));
        } else {
          setIsScreenLoading(true);
        }
      } else if (currentGamePhaseFromContext !== 'Setup') {
        InteractionManager.runAfterInteractions(() => navigation.replace('Setup'));
      } else {
        setIsScreenLoading(true);
      }
    } else {
      setIsInteractionBlocked(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isFocused, currentGamePhaseFromContext, players, currentPlayerTurnForRoleReveal, isGameContextLoading, navigation, passToPlayerOpacity, cardFrontOpacity, cardBackOpacity]); // Deps hinzugefügt für Animation Refs

  useEffect(() => {
    const readyToNavigate = isFocused && !navigationTriggeredRef.current && 
                            currentGamePhaseFromContext === 'WordPhase' &&
                            players && players.length > 0 && 
                            currentPlayerTurnForRoleReveal >= players.length;
    if (readyToNavigate) {
      navigationTriggeredRef.current = true;
      setIsScreenLoading(true); 
      InteractionManager.runAfterInteractions(() => navigation.replace('Game'));
    }
  }, [isFocused, currentGamePhaseFromContext, players, currentPlayerTurnForRoleReveal, navigation]);

  const handleCardPress = () => {
    console.log(`[RoleRevealScreen] --- handleCardPress START ---`);
    console.log(`[RoleRevealScreen] States: isRoleDetailsVisible: ${isRoleDetailsVisible}, isInteractionBlocked: ${isInteractionBlocked}`);

    if (isInteractionBlocked) {
      console.log("[RoleRevealScreen] Press ignored: Interaction BLOCKED.");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsInteractionBlocked(true);

    if (!isRoleDetailsVisible) {
      console.log("[RoleRevealScreen] Path A: Revealing role details.");
      Animated.sequence([
        Animated.timing(cardFrontOpacity, { toValue: 0, duration: FADE_DURATION / 2, useNativeDriver: false }), // TEST: useNativeDriver: false
        Animated.timing(cardBackOpacity, { toValue: 1, duration: FADE_DURATION, useNativeDriver: false })    // TEST: useNativeDriver: false
      ]).start(() => {
        console.log("[RoleRevealScreen] Path A: Role details revealed. Unblocking interaction.");
        setIsRoleDetailsVisible(true);
        setIsInteractionBlocked(false); 
      });
    } else {
      console.log("[RoleRevealScreen] Path B: Proceeding to next.");
      Animated.parallel([
        Animated.timing(passToPlayerOpacity, { toValue: 0, duration: FADE_DURATION, useNativeDriver: false }), // TEST: useNativeDriver: false
        Animated.timing(cardBackOpacity, { toValue: 0, duration: FADE_DURATION, useNativeDriver: false })     // TEST: useNativeDriver: false
      ]).start(() => {
        console.log("[RoleRevealScreen] Path B: Fade out complete. Calling proceedToNextRoleReveal.");
        proceedToNextRoleReveal('RoleRevealScreen.handleCardPress.PathB');
      });
    }
    console.log(`[RoleRevealScreen] --- handleCardPress END ---`);
  };

  if (isScreenLoading || isGameContextLoading || (currentGamePhaseFromContext === 'RoleReveal' && !currentDisplayedPlayer && !(players && currentPlayerTurnForRoleReveal >= players.length))) {
    // ... (Ladeanzeige bleibt gleich)
    let loadingMessageKey = 'common.loadingData';
    if (currentGamePhaseFromContext === 'WordPhase' && players && currentPlayerTurnForRoleReveal >= players.length) {
        loadingMessageKey = 'roleRevealScreen.startingGame';
    }
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
        <Text style={styles.loadingText}>{t(loadingMessageKey)}</Text>
      </View>
    );
  }
  
  if (!currentDisplayedPlayer && currentGamePhaseFromContext === 'RoleReveal') {
     InteractionManager.runAfterInteractions(() => navigation.replace('Setup'));
     return ( 
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>{t('errors.genericError')}</Text>
      </View>
    );
  }

  const roleText = currentDisplayedPlayer?.role === 'Erzfeind' ? t('roles.archEnemy') : t('roles.wordKnower');
  const fellowEnemiesText = currentDisplayedPlayer?.role === 'Erzfeind' && currentDisplayedPlayer?.fellowArchEnemies && currentDisplayedPlayer.fellowArchEnemies.length > 0
    ? `${t('roleRevealScreen.fellowArchEnemiesTitle')}: ${currentDisplayedPlayer.fellowArchEnemies.join(', ')}`
    : null;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Animated.Text style={[styles.passToPlayerText, {opacity: passToPlayerOpacity}]}>
        {currentDisplayedPlayer ? t('roleRevealScreen.passToPlayer', { playerName: currentDisplayedPlayer.name }) : ""}
      </Animated.Text>

    {currentDisplayedPlayer && (
        <Pressable 
          onPress={handleCardPress}
          style={[styles.cardPressableArea]} // Die Opazität wird jetzt von den inneren Views gesteuert
          testID="card-pressable"
          disabled={isInteractionBlocked}
        >
            <View style={styles.cardBase}> 
                <Animated.View style={[styles.cardFace, styles.cardFaceFront, { opacity: cardFrontOpacity }]}>
                    <Ionicons name="help-circle-outline" size={SCREEN_WIDTH * 0.35} color={theme.colors.primaryAccent} />
                    <Text style={styles.cardFrontText}>{t('roleRevealScreen.tapToReveal')}</Text>
                </Animated.View>
                <Animated.View style={[styles.cardFace, styles.cardFaceBack, { opacity: cardBackOpacity }]}>
                    <Text style={styles.roleTitle}>{roleText}</Text>
                    {currentDisplayedPlayer.role === 'Wortkenner' && currentSecretWord ? (
                        <Text style={styles.secretWordText} numberOfLines={2} adjustsFontSizeToFit>{currentSecretWord}</Text>
                    ) : null}
                    {currentDisplayedPlayer.role === 'Erzfeind' ? (
                        <Text style={styles.hintText}>
                            {hintModeEnabled && currentCategory ? t('roleRevealScreen.archEnemyHint', {category: currentCategory}) : t('roleRevealScreen.erzfeindNoHintShort')}
                        </Text>
                    ) : null}
                    {fellowEnemiesText ? (
                        <Text style={styles.fellowEnemiesText}>{fellowEnemiesText}</Text>
                    ) : null}
                     {isRoleDetailsVisible && (
                        <Text style={styles.tapToContinueText}>
                            {currentPlayerTurnForRoleReveal < players.length - 1
                                ? t('roleRevealScreen.tapCardToContinue')
                                : t('roleRevealScreen.tapToStartGame')
                            }
                        </Text>
                    )}
                </Animated.View>
            </View>
        </Pressable>
    )}
    </View>
  );
};

const getStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.fonts.secondary,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.destructiveAction,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  passToPlayerText: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.h1,
    color: theme.colors.primaryText,
    textAlign: 'center',
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.12,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  cardPressableArea: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.6,
    maxWidth: 380,
    maxHeight: 580,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBase: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xl + theme.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Appearance.getColorScheme() === 'dark' ? 0.5 : 0.25,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: theme.colors.cardBackground, 
    position: 'relative', 
  },
  cardFace: { 
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.xl + theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  cardFaceFront: {
    backgroundColor: theme.colors.floatingElementBackground, 
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: theme.colors.tertiaryAccent + '80',
  },
  cardFaceBack: {
    backgroundColor: theme.colors.primaryAccent, 
  },
  cardFrontText: {
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.secondaryText,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  roleTitle: {
    fontFamily: theme.fonts.primary,
    fontSize: theme.fontSizes.hero + theme.spacing.sm,
    color: theme.colors.background, 
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  secretWordText: {
    fontFamily: theme.fonts.primaryMedium,
    fontSize: theme.fontSizes.h1 + theme.spacing.xs,
    color: theme.colors.background,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  hintText: {
    fontFamily: theme.fonts.secondary,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.background + 'E6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: theme.spacing.sm,
  },
  fellowEnemiesText: {
    fontFamily: theme.fonts.secondary,
    fontSize: theme.fontSizes.body,
    color: theme.colors.background + 'CC',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  tapToContinueText: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    fontFamily: theme.fonts.secondaryMedium,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.background + 'B3',
  }
});

export default RoleRevealScreen;