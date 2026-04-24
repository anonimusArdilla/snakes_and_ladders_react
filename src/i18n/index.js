/**
 * i18n Configuration
 *
 * Sets up react-i18next with English, Spanish, and Chinese.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.js';
import es from './es.js';
import zh from './zh.js';

const savedLang = localStorage.getItem('snl_language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    zh: { translation: zh },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
