// BarnebyAppNeu/screens/RulesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { t } from '../i18n';
import { useGame } from '../contexts/GameContext';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RulesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Rules'>;

interface Props {
  navigation: RulesScreenNavigationProp;
}

interface AccordionItemProps {
  titleKey: string;
  titleDefault: string;
  contentKey: string;
  contentDefault: string;
  iconName: keyof typeof Ionicons.glyphMap; // For icon usage
  theme: ReturnType<typeof useGame>['theme'];
}

const AccordionItem: React.FC<AccordionItemProps> = ({ titleKey, titleDefault, contentKey, contentDefault, iconName, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const styles = getStyles(theme); // Get themed styles

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggleOpen} activeOpacity={0.7}>
        <View style={styles.accordionTitleContainer}>
          <Ionicons name={iconName} size={24} color={theme.colors.primaryAccent} style={styles.accordionIcon} />
          <Text style={styles.accordionTitle}>{t(titleKey, {defaultValue: titleDefault})}</Text>
        </View>
        <Ionicons name={isOpen ? "chevron-up-outline" : "chevron-down-outline"} size={24} color={theme.colors.secondaryText} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.accordionContent}>
          <Text style={styles.paragraph}>{t(contentKey, {defaultValue: contentDefault})}</Text>
        </View>
      )}
    </View>
  );
};


const RulesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useGame();
  const styles = getStyles(theme); // Get themed styles

  const ruleSections = [
    {
      titleKey: 'rulesScreen.objectiveTitle', titleDefault: 'Ziel des Spiels',
      contentKey: 'rulesScreen.objectiveCombined', contentDefault: `Wortkenner: Enttarnt den Erzfeind! Erzfeind: Bleibe unentdeckt.`,
      iconName: 'flag-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      titleKey: 'rulesScreen.rolesTitle', titleDefault: 'Rollen',
      contentKey: 'rulesScreen.rolesDetail', contentDefault: `Es gibt Wortkenner, die ein geheimes Wort kennen, und einen oder mehrere Erzfeinde, die dieses Wort nicht kennen und bluffen müssen.`,
      iconName: 'people-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      titleKey: 'rulesScreen.gameFlowTitle', titleDefault: 'Spielablauf',
      contentKey: 'rulesScreen.gameFlowDetail', contentDefault: `1. Rollen ansehen: Jeder sieht geheim seine Rolle.\n2. Wortrunde: Reihum sagt jeder EIN Wort, das zum Geheimwort passt. Erzfeind(e) bluffen.\n3. Diskussion: Diskutiert frei, wer verdächtig ist.\n4. Stoppen/Aufdecken: Jederzeit kann ein Spieler die Runde stoppen, was zur Auflösung führt.\n5. Auflösung: Am Ende wird alles aufgedeckt.`,
      iconName: 'play-forward-outline' as keyof typeof Ionicons.glyphMap,
    },
     {
      titleKey: 'rulesScreen.scoringTitle', titleDefault: 'Punkte (Beispiel)',
      contentKey: 'rulesScreen.scoringDetail', contentDefault: `Wortkenner gewinnen, wenn sie den/die Erzfeind(e) enttarnen. Erzfeind(e) gewinnen, wenn sie unentdeckt bleiben oder (optional) das Wort erraten. Genaue Punktesysteme könnt ihr selbst festlegen!`,
      iconName: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
    }
    // Add more sections as needed
  ];


  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerBar}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={theme.colors.primaryAccent} />
          </TouchableOpacity>
        <Text style={styles.header}>{t('rulesScreen.title')}</Text>
        <View style={{width: 40}} />{/* Placeholder for balance */}
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcomeText}>
          {t('rulesScreen.welcome', {defaultValue: 'Willkommen bei "Der Erzfeind"! Ein Spieler ist heimlich der Erzfeind, die anderen sind Wortkenner und kennen ein geheimes Wort.'})}
        </Text>

        {ruleSections.map((section, index) => (
          <AccordionItem
            key={index}
            titleKey={section.titleKey}
            titleDefault={section.titleDefault}
            contentKey={section.contentKey}
            contentDefault={section.contentDefault}
            iconName={section.iconName}
            theme={theme}
          />
        ))}

        {/* Interactive Example (Conceptual) - Requires more complex state/logic if implemented */}
        {/*
        <View style={styles.interactiveExample}>
          <Text style={styles.subHeader}>Interaktives Beispiel:</Text>
          <Text style={styles.paragraph}>Du bist der Erzfeind. Das Wort ist "Apfel". Was sagst du?</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton}><Text style={styles.optionText}>A) Rund</Text></TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}><Text style={styles.optionText}>B) Obst</Text></TouchableOpacity>
          </View>
        </View>
        */}

      </ScrollView>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof useGame>['theme']) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.tertiaryAccent,
    backgroundColor: theme.colors.cardBackground, // Slight distinction for header bar
  },
  backButton: {
    padding: 5,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    fontSize: theme.fontSizes.title + 2,
    fontWeight: 'bold',
    color: theme.colors.primaryText,
    textAlign: 'center',
    flex: 1, // Allow header text to take space
  },
  welcomeText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
    lineHeight: theme.fontSizes.body * 1.5,
  },
  accordionItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden', // For smooth animation
    borderWidth: 1,
    borderColor: theme.colors.tertiaryAccent,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
  },
  accordionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow title to take available space
  },
  accordionIcon: {
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: theme.fontSizes.subtitle,
    fontWeight: '600', // Bolder title
    color: theme.colors.primaryText,
    flexShrink: 1, // Allow text to shrink if too long
  },
  accordionContent: {
    paddingHorizontal: 15,
    paddingBottom: 18,
    paddingTop: 5, // Space between title and content
  },
  paragraph: {
    fontSize: theme.fontSizes.body,
    lineHeight: theme.fontSizes.body * 1.6,
    color: theme.colors.secondaryText,
  },
  // Styles for a potential interactive example
  interactiveExample: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.colors.tertiaryAccent, // Different background for emphasis
    borderRadius: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: theme.colors.primaryAccent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  optionText: {
    color: theme.colors.background,
    fontSize: theme.fontSizes.body,
  }
});

export default RulesScreen;