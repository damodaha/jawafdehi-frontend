import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import neTranslations from './locales/ne.json';

const isSSR = typeof window === 'undefined';

const getBrowserLanguage = () => {
  if (isSSR) return 'ne';

  const storedLanguage = window.localStorage.getItem('i18nextLng');
  if (storedLanguage?.startsWith('en')) return 'en';
  if (storedLanguage?.startsWith('ne')) return 'ne';

  return window.navigator.language.startsWith('en') ? 'en' : 'ne';
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

  const browserLanguage = getBrowserLanguage();
  if (browserLanguage !== i18n.language) {
    window.requestAnimationFrame(() => {
      void i18n.changeLanguage(browserLanguage);
    });
  }
}

export default i18n;
