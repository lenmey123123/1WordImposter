// BarnebyAppNeu/contexts/GameContext.tsx
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useRef, useCallback, useEffect } from 'react';
import { Player, GameState, GamePhase, GameSettings } from '../types/gameTypes';
import { DEFAULT_WORD_LISTS } from '../constants/wordLists';
import { t } from '../i18n';
import { Alert, InteractionManager, Appearance, ColorSchemeName } from 'react-native';
import { AppTheme, getTheme } from '../constants/theme';

// Frühzeitige Überprüfung der Wortlisten
if (!DEFAULT_WORD_LISTS) {
    console.error("[GameContext] CRITICAL ERROR: DEFAULT_WORD_LISTS not imported or undefined!");
    // Man könnte hier einen Fallback-Mechanismus oder eine deutlichere Fehlermeldung für den Nutzer in der UI vorbereiten
} else if (DEFAULT_WORD_LISTS.length === 0) {
    console.warn("[GameContext] WARNING: DEFAULT_WORD_LISTS is empty! Game cannot be initialized correctly.");
}

interface GameContextType {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  initializeGame: (settings: GameSettings) => void;
  proceedToNextRoleReveal: (caller?: string) => void;
  startGameTimer: () => void;
  stopGameTimer: () => void;
  goToResolutionPhase: (params?: { reasonKey?: string, reasonParams?: object }) => void;
  changeSecretWord: (newWord: string, caller?: string) => void;
  theme: AppTheme;
  setAppTheme: (scheme: ColorSchemeName) => void;
  currentSetupStep: number;
  setCurrentSetupStep: Dispatch<SetStateAction<number>>;
  resetSetupToFirstStep: () => void;
}

const initialColorScheme = Appearance.getColorScheme();
const initialTheme = getTheme(initialColorScheme);

// initialGameState ist der Zustand, mit dem die App startet, BEVOR SetupScreen abgeschlossen ist.
// Er muss für alle Screens sicher sein, die potenziell darauf zugreifen könnten.
const initialGameState: GameState = {
  numberOfPlayers: 3, // Standardwert, wird im Setup angepasst
  playerNames: ["", "", ""], // Standardwert, wird im Setup angepasst
  numberOfErzfeinde: 1, // Standardwert
  roundTimeInSeconds: 60, // Standardwert
  selectedCategory: undefined,
  hintModeEnabled: false,
  players: [], // WICHTIG: Startet als leeres Array
  gamePhase: 'Setup', // App startet immer im Setup
  currentSecretWord: '',
  currentCategory: '',
  currentPlayerTurnForRoleReveal: 0,
  timerValue: 60, // Wird durch roundTimeInSeconds beim Initialisieren überschrieben
  isTimerRunning: false,
  isLoading: false, // isLoading bezieht sich auf Ladevorgänge innerhalb des Spiels, nicht den App-Start
  roundEndReason: undefined,
};


const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [theme, setTheme] = useState<AppTheme>(initialTheme);
  const [currentSetupStep, setCurrentSetupStep] = useState<number>(1);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const setAppTheme = (scheme: ColorSchemeName) => {
    setTheme(getTheme(scheme));
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setAppTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);


  const initializeGame = useCallback((settings: GameSettings) => {
    // console.log("[GameContext] initializeGame - Called with settings:", settings);
    setGameState(prev => ({
        ...initialGameState, // Beginne mit einer sauberen Basis
        ...settings, // Überschreibe mit den neuen Einstellungen aus dem Setup
        playerNames: settings.playerNames.slice(0, settings.numberOfPlayers).map(
            (name, index) => name.trim() === '' ? `${t('setupScreen.playerPlaceholder', {defaultValue: "Player "})}${index + 1}` : name.trim()
        ),
        isLoading: true, // Ladevorgang für Spieler- und Wortgenerierung beginnt
        gamePhase: 'Setup', // Bleibe vorerst im Setup-Modus, bis InteractionManager fertig ist
        players: [], // Wird sofort neu befüllt
        currentPlayerTurnForRoleReveal: 0, // Zurücksetzen
        currentSecretWord: '', // Zurücksetzen
        currentCategory: '', // Zurücksetzen
        timerValue: settings.roundTimeInSeconds, // Timer korrekt setzen
        isTimerRunning: false, // Sicherstellen, dass Timer nicht läuft
        roundEndReason: undefined,
    }));

    InteractionManager.runAfterInteractions(() => {
        // console.log("[GameContext] initializeGame - InteractionManager starts");
        if (!DEFAULT_WORD_LISTS || DEFAULT_WORD_LISTS.length === 0) {
          Alert.alert(t('appTitle', { defaultValue: "BarnebyApp" }), t('errors.wordListUnavailable'));
          setGameState(prev => ({ ...prev, isLoading: false, gamePhase: 'Setup' }));
          return;
        }
        let categoryToUse;
        const randomCategoryValue = t('setupScreen.randomCategoryValue', { defaultValue: "Random"});
        if (settings.selectedCategory && settings.selectedCategory !== randomCategoryValue) {
            categoryToUse = DEFAULT_WORD_LISTS.find(c => c.categoryName === settings.selectedCategory);
        }
        if (!categoryToUse) {
            const randomIndex = Math.floor(Math.random() * DEFAULT_WORD_LISTS.length);
            categoryToUse = DEFAULT_WORD_LISTS[randomIndex];
        }

        if (!categoryToUse || !categoryToUse.words || categoryToUse.words.length === 0) {
            Alert.alert(t('appTitle', { defaultValue: "BarnebyApp" }), t('errors.categoryOrWordUnavailable'));
            setGameState(prev => ({ ...prev, isLoading: false, gamePhase: 'Setup' }));
            return;
        }
        const secretWord = categoryToUse.words[Math.floor(Math.random() * categoryToUse.words.length)];
        const actualPlayerNames = settings.playerNames.slice(0, settings.numberOfPlayers).map(
            (name, index) => name.trim() === '' ? `${t('setupScreen.playerPlaceholder', {defaultValue: "Player "})}${index + 1}` : name.trim()
        );

        let tempPlayers: Player[] = actualPlayerNames.map((name, index) => ({
          id: `player-${index}-${Date.now()}`, name, role: 'Wortkenner', secretWord, fellowArchEnemies: []
        }));

        if (tempPlayers.length < settings.numberOfErzfeinde) {
          Alert.alert(t('appTitle', { defaultValue: "BarnebyApp" }), t('errors.playerImpostorMismatch'));
          setGameState(prev => ({ ...prev, isLoading: false, gamePhase: 'Setup' }));
          return;
        }

        let erzfeindIndices: number[] = [];
        while (erzfeindIndices.length < settings.numberOfErzfeinde) {
          const randomIndex = Math.floor(Math.random() * tempPlayers.length);
          if (!erzfeindIndices.includes(randomIndex)) erzfeindIndices.push(randomIndex);
        }

        const archEnemyNamesList: string[] = [];
        erzfeindIndices.forEach(index => {
            archEnemyNamesList.push(tempPlayers[index].name);
        });

        erzfeindIndices.forEach(index => {
          tempPlayers[index].role = 'Erzfeind';
          tempPlayers[index].secretWord = undefined;
          if (settings.numberOfErzfeinde > 1) {
            tempPlayers[index].fellowArchEnemies = archEnemyNamesList.filter(name => name !== tempPlayers[index].name);
          } else {
            tempPlayers[index].fellowArchEnemies = [];
          }
        });

        for (let i = tempPlayers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tempPlayers[i], tempPlayers[j]] = [tempPlayers[j], tempPlayers[i]];
        }
        // console.log("[GameContext] initializeGame - InteractionManager: Setting to RoleReveal");
        setGameState(prevSetupState => ({
            ...prevSetupState, // Behalte Theme, currentSetupStep
            ...settings, // Wende die neuen Spiel-Einstellungen an
            playerNames: actualPlayerNames, // Sicherstellen, dass die korrekten Namen verwendet werden
            players: tempPlayers, // Die neu generierten Spieler
            currentCategory: categoryToUse!.categoryName,
            currentSecretWord: secretWord!,
            gamePhase: 'RoleReveal', // JETZT zur RoleReveal-Phase wechseln
            currentPlayerTurnForRoleReveal: 0,
            timerValue: settings.roundTimeInSeconds, // Sicherstellen, dass der Timer-Wert gesetzt ist
            isTimerRunning: false,
            isLoading: false, // Ladevorgang abgeschlossen
        }));
    });
  }, [t]); // t für Default-Spielernamen

  const proceedToNextRoleReveal = useCallback((caller: string = "Unknown") => {
    setGameState(prev => {
      if (prev.gamePhase !== 'RoleReveal' || !prev.players || prev.players.length === 0) {
        // console.warn("[GameContext] proceedToNextRoleReveal called in invalid state. Phase:", prev.gamePhase, "Players:", prev.players?.length);
        return prev;
      }

      const nextPlayerIndex = prev.currentPlayerTurnForRoleReveal + 1;
      // console.log(`[GameContext] proceedToNextRoleReveal from ${caller}: Current Index: ${prev.currentPlayerTurnForRoleReveal}, Next Index: ${nextPlayerIndex}, Total Players: ${prev.players.length}`);

      if (nextPlayerIndex < prev.players.length) {
        // console.log(`[GameContext] Proceeding to next player for role reveal: Player ${nextPlayerIndex}`);
        return { ...prev, currentPlayerTurnForRoleReveal: nextPlayerIndex };
      } else {
        // console.log(`[GameContext] All roles revealed. Transitioning to WordPhase.`);
        return {
            ...prev,
            gamePhase: 'WordPhase',
            currentPlayerTurnForRoleReveal: nextPlayerIndex, // Index ist jetzt >= players.length
            isTimerRunning: false, // Timer startet erst im GameScreen explizit
            timerValue: prev.roundTimeInSeconds, // Sicherstellen, dass der Timer für die neue Runde gesetzt ist
        };
      }
    });
  }, []);

  const goToResolutionPhase = useCallback((params?: { reasonKey?: string, reasonParams?: object }) => {
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
    const reasonText = params?.reasonKey ? t(params.reasonKey as any, params.reasonParams) : t('resolutionScreen.roundEndedGeneric', {defaultValue: "The round has ended."});
    setGameState(prev => ({ ...prev, isTimerRunning: false, gamePhase: 'Resolution', roundEndReason: reasonText }));
  }, [t]);

  const decrementTimer = useCallback(() => {
    if (gameStateRef.current.timerValue > 1 && gameStateRef.current.isTimerRunning) {
      setGameState(prev => ({ ...prev, timerValue: prev.timerValue - 1 }));
    } else if ((gameStateRef.current.timerValue === 1 || gameStateRef.current.timerValue === 0) && gameStateRef.current.isTimerRunning) {
      if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
      }
      goToResolutionPhase({ reasonKey: 'resolutionScreen.timeUpInfo' });
      // setGameState wird durch goToResolutionPhase oder nachfolgende Effekte behandelt
      setGameState(prev => ({...prev, timerValue: 0, isTimerRunning: false})); // Doppelt sicherstellen
    }
  }, [goToResolutionPhase]);

  const startGameTimer = useCallback(() => {
    setGameState(prev => {
      if (!prev.isTimerRunning && prev.gamePhase === 'WordPhase' && prev.timerValue > 0 && prev.players && prev.players.length > 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(decrementTimer, 1000);
        return { ...prev, isTimerRunning: true };
      }
      return prev;
    });
  }, [decrementTimer]);

  const stopGameTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setGameState(prev => (prev.isTimerRunning ? { ...prev, isTimerRunning: false } : prev));
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);


  const changeSecretWord = (newWord: string, caller: string = "Unknown") => {
    if (!newWord || newWord.trim() === "") {
        Alert.alert(t('common.error'), t('gameScreen.adminErrorEmptyWord'));
        return;
    }
    const trimmedNewWord = newWord.trim();
    setGameState(prev => {
        const updatedPlayers = prev.players.map(player => {
            if (player.role === 'Wortkenner') {
                return { ...player, secretWord: trimmedNewWord };
            }
            return player;
        });
        return {
            ...prev,
            currentSecretWord: trimmedNewWord,
            players: updatedPlayers,
        };
    });
    Alert.alert(t('common.success'), t('gameScreen.adminSuccessWordChanged', {newWord: trimmedNewWord}));
  };

  const resetSetupToFirstStep = () => {
    setCurrentSetupStep(1);
  };

  const value = {
      gameState,
      setGameState,
      initializeGame,
      proceedToNextRoleReveal,
      startGameTimer,
      stopGameTimer,
      goToResolutionPhase,
      changeSecretWord,
      theme,
      setAppTheme,
      currentSetupStep,
      setCurrentSetupStep,
      resetSetupToFirstStep,
    };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    // Dieser Fehler würde auftreten, wenn useGame außerhalb von GameProvider verwendet wird.
    // Der Call Stack deutet aber darauf hin, dass GameProvider im Baum ist.
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};