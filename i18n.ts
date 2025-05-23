// BarnebyAppNeu/lib/i18n.ts
import * as Localization from 'expo-localization';
import { I18n, TranslateOptions } from 'i18n-js';

import enTranslations from './locales/en.json';
import deTranslations from './locales/de.json';

const i18n = new I18n();

i18n.translations = {
  en: enTranslations,
  de: deTranslations,
};

const userLocales = Localization.getLocales();
let bestLocale: string = 'en';

if (userLocales && userLocales.length > 0) {
  const languageTag = userLocales[0].languageTag;
  const languageCode = languageTag.split('-')[0];

  if (i18n.translations[languageCode as keyof typeof i18n.translations]) {
    bestLocale = languageCode;
  } else {
    const genericLanguageCode = languageTag.split('-')[0];
    if (i18n.translations[genericLanguageCode as keyof typeof i18n.translations]) {
      bestLocale = genericLanguageCode;
    } else {
      console.warn(`[i18n] Locale for ${languageTag} or ${genericLanguageCode} not found. Falling back to 'en'.`);
      bestLocale = 'en';
    }
  }
}
i18n.locale = bestLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

console.log('[i18n] Initialized Locale:', i18n.locale);

export function t(key: string, options?: TranslateOptions): string {
  const defaultValueFromOptions = options?.defaultValue;
  let translationAttempt = '';

  try {
    translationAttempt = i18n.t(key, options);
  } catch (e) {
    console.error(`[i18n] Error during t('${key}', ${JSON.stringify(options)}):`, e);
    translationAttempt = `ERROR_IN_T(${key})`;
  }

  if (typeof translationAttempt === 'string' &&
      (translationAttempt.startsWith('[missing') || translationAttempt === key || translationAttempt.includes('undefined'))) {
    
    console.warn(`[i18n] Fallback for key: "${key}". Attempted translation: "${translationAttempt}". Options:`, options);

    if (typeof defaultValueFromOptions === 'string') {
      return defaultValueFromOptions;
    }
    return `_{${key}}_`;
  }
  return String(translationAttempt);
}

export default i18n;