// BarnebyAppNeu/App.tsx
import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { GameProvider } from './contexts/GameContext';
import './i18n';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons'; // Importieren, falls für Icon-Schriftarten benötigt

// Definiere die zu ladenden Schriftarten
// WICHTIG: Stelle sicher, dass diese Pfade korrekt sind und die Dateien existieren!
// Die Pfade sind relativ zur Datei App.tsx.
// Wenn App.tsx im Root-Verzeichnis ist, dann ist ./assets/... korrekt,
// falls assets/fonts/ im Root-Verzeichnis liegt.
const customFonts = {
  'Poppins_700Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  'Poppins_600SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  'Inter_400Regular': require('./assets/fonts/Inter-Regular.ttf'),
  'Inter_500Medium': require('./assets/fonts/Inter-Medium.ttf'),
  // Falls du Ionicons oder andere Icon-Sets nutzt, die Schriftarten benötigen:
  // Stelle sicher, dass die Schriftart auch hier korrekt geladen wird.
  // Für Ionicons ist es oft nicht nötig, sie hier explizit zu laden, wenn @expo/vector-icons korrekt installiert ist,
  // aber schaden tut es meist auch nicht, wenn man sichergehen will.
  // ...Ionicons.font, // Beispiel für das explizite Laden von Ionicons Schriftart
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadResourcesAsync() {
      try {
        await Font.loadAsync(customFonts);
      } catch (e) {
        console.warn("Fehler beim Laden der Schriftarten:", e);
        // Du könntest hier eine spezifischere Fehlermeldung für den Benutzer ausgeben
        // oder versuchen, mit System-Fallback-Schriftarten weiterzumachen, obwohl das das Design beeinträchtigt.
      } finally {
        setFontsLoaded(true);
      }
    }

    loadResourcesAsync();
  }, []);

  if (!fontsLoaded) {
    return null; // Zeige nichts oder einen Ladebildschirm, bis die Schriftarten geladen sind.
                 // Für eine bessere UX könntest du hier eine Ladeanimation (z.B. ActivityIndicator) anzeigen.
  }

  return (
    <GameProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </GameProvider>
  );
}