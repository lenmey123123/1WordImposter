// constants/theme.ts
import { Appearance, ColorSchemeName, Platform } from 'react-native';

export interface ThemeColors {
  background: string;
  primaryText: string;
  secondaryText: string;
  primaryAccent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  cardBackground: string;
  modalBackground: string;
  iconColor: string;
  titleText: string;
  highlightText: string;
  borderColor: string;
  floatingElementBackground: string;
  interactiveFocusBackground: string;
  destructiveAction: string;
  positiveAction: string;
}

export interface AppTheme {
  colors: ThemeColors;
  fonts: {
    primary: string;
    primaryMedium: string;
    secondary: string;
    secondaryMedium: string;
  };
  fontSizes: {
    hero: number;
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
    small: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
}

const sharedFontSizes = {
  hero: 38,
  h1: 30,
  h2: 24,
  h3: 20,
  body: 16,
  caption: 14,
  small: 12,
};

const sharedSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const sharedBorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  pill: 999,
};

// WICHTIG: Stelle sicher, dass diese Schriftarten in deinem Projekt geladen werden!
// z.B. über expo-font in deiner App.tsx oder einer ähnlichen Initialisierungsdatei.
// Beispiel:
// async function loadFonts() {
//   await Font.loadAsync({
//     'Poppins_700Bold': require('./assets/fonts/Poppins-Bold.ttf'),
//     'Poppins_600SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
//     'Inter_400Regular': require('./assets/fonts/Inter-Regular.ttf'),
//     'Inter_500Medium': require('./assets/fonts/Inter-Medium.ttf'),
//   });
// }
// Wenn die Schriftarten nicht geladen sind, wird React Native auf System-Fallbacks zurückgreifen,
// was zu unerwartetem Aussehen führen kann.

const sharedFonts = {
    primary: 'Poppins_700Bold', // Ersetze dies, falls du andere Schriftarten verwendest/lädst
    primaryMedium: 'Poppins_600SemiBold',
    secondary: 'Inter_400Regular',
    secondaryMedium: 'Inter_500Medium',
    // System-Fallback, falls die oben genannten nicht geladen werden können:
    // primary: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    // primaryMedium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    // secondary: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    // secondaryMedium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
};


const lightColors: ThemeColors = {
  background: '#F7F9FC',
  primaryText: '#1A1D21',
  secondaryText: '#5F6368',
  iconColor: '#3C4043',
  primaryAccent: '#007AFF',
  secondaryAccent: '#5AC8FA',
  tertiaryAccent: '#E8EAED',
  cardBackground: '#FFFFFF',
  modalBackground: '#FFFFFF',
  borderColor: '#DDE1E6',
  floatingElementBackground: '#FFFFFF',
  interactiveFocusBackground: 'rgba(0, 122, 255, 0.1)',
  destructiveAction: '#FF3B30',
  positiveAction: '#34C759',
  titleText: '#1A1D21', // Definiert, obwohl es oft gleich primaryText ist
  highlightText: '#007AFF', // Definiert, obwohl es oft gleich primaryAccent ist
};

const darkColors: ThemeColors = {
  background: '#0D1117',
  primaryText: '#E6EDF3',
  secondaryText: '#7D8590',
  iconColor: '#C9D1D9',
  primaryAccent: '#3081F7',
  secondaryAccent: '#58A6FF',
  tertiaryAccent: '#21262D',
  cardBackground: '#161B22',
  modalBackground: '#1C2128',
  borderColor: '#30363D',
  floatingElementBackground: '#1C2128',
  interactiveFocusBackground: 'rgba(48, 129, 247, 0.2)',
  destructiveAction: '#F85149',
  positiveAction: '#30A46C',
  titleText: '#E6EDF3',
  highlightText: '#58A6FF',
};


export const getTheme = (colorScheme: ColorSchemeName): AppTheme => {
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  return {
    colors,
    fonts: sharedFonts,
    fontSizes: sharedFontSizes,
    spacing: sharedSpacing,
    borderRadius: sharedBorderRadius,
  };
};

export const currentSystemScheme = Appearance.getColorScheme();
export const DefaultTheme = getTheme(currentSystemScheme);