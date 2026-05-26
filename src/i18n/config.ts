import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import neTranslations from './locales/ne.json';

const isSSR = typeof window === 'undefined';

const getBrowserLanguage = (): 'en' | 'ne' => {
  if (isSSR) return 'ne';

  let storedLanguage: string | null = null;
  try {
    storedLanguage = window.localStorage.getItem('i18nextLng');
  } catch {
    // Storage blocked or unavailable
  }
  if (storedLanguage?.startsWith('en')) return 'en';
  if (storedLanguage?.startsWith('ne')) return 'ne';

  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ne';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ne: {
        translation: neTranslations,
      },
    },
    fallbackLng: 'ne',
    lng: 'ne',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

if (!isSSR) {
  const syncDocumentLanguage = (language: string) => {
    document.documentElement.lang = language.startsWith('en') ? 'en' : 'ne';
  };

  syncDocumentLanguage(i18n.language || i18n.resolvedLanguage || 'ne');
  i18n.on('languageChanged', syncDocumentLanguage);

  i18n.on('languageChanged', (lng) => {
    try {
      window.localStorage.setItem('i18nextLng', lng);
    } catch {
      // Storage blocked or unavailable
    }
  });

  const browserLanguage = getBrowserLanguage();
  if (browserLanguage !== i18n.language) {
    window.requestAnimationFrame(() => {
      void i18n.changeLanguage(browserLanguage);
    });
  }
}

export default i18n;
