// BarnebyAppNeu/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, Theme as NavigationTheme, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Appearance, ColorSchemeName } from 'react-native';

import SetupScreen from '../screens/SetupScreen';
import RoleRevealScreen from '../screens/RoleRevealScreen';
import GameScreen from '../screens/GameScreen';
import ResolutionScreen from '../screens/ResolutionScreen';
import RulesScreen from '../screens/RulesScreen';
import { useGame } from '../contexts/GameContext'; // Your custom theme hook
import { AppTheme } from '../constants/theme'; // Your custom theme type

export type RootStackParamList = {
  Setup: undefined;
  RoleReveal: undefined;
  Game: undefined;
  Resolution: undefined;
  Rules: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Function to map your AppTheme to React Navigation's Theme
const mapAppThemeToNavigationTheme = (appTheme: AppTheme, scheme: ColorSchemeName): NavigationTheme => {
  const isDark = scheme === 'dark';
  const navigationBaseTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...navigationBaseTheme, // Start with React Navigation's base for dark/light
    dark: isDark,
    colors: {
      ...navigationBaseTheme.colors, // Keep existing base colors
      primary: appTheme.colors.primaryAccent,
      background: appTheme.colors.background,
      card: appTheme.colors.cardBackground || appTheme.colors.background,
      text: appTheme.colors.primaryText,
      border: appTheme.colors.borderColor || appTheme.colors.tertiaryAccent,
      notification: appTheme.colors.primaryAccent, // Often same as primary
    },
  };
};


const AppNavigator = () => {
  const { theme: appCustomTheme } = useGame(); // Get your custom theme from context
  const colorScheme = Appearance.getColorScheme() || 'light'; // Get current system color scheme

  // Map your custom theme to the structure React Navigation expects
  const navigationAdaptedTheme = mapAppThemeToNavigationTheme(appCustomTheme, colorScheme);

  return (
    <NavigationContainer theme={navigationAdaptedTheme}>
      <Stack.Navigator
        initialRouteName="Setup"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="RoleReveal" component={RoleRevealScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Resolution" component={ResolutionScreen} />
        <Stack.Screen name="Rules" component={RulesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;