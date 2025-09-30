import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonRO from './locales/ro/common.json';
import homepageRO from './locales/ro/homepage.json';
import dashboardRO from './locales/ro/dashboard.json';
import courseBuilderRO from './locales/ro/courseBuilder.json';
import materialsRO from './locales/ro/materials.json';
import authRO from './locales/ro/auth.json';

import commonEN from './locales/en/common.json';
import homepageEN from './locales/en/homepage.json';
import dashboardEN from './locales/en/dashboard.json';
import courseBuilderEN from './locales/en/courseBuilder.json';
import materialsEN from './locales/en/materials.json';
import authEN from './locales/en/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ro: {
        common: commonRO,
        homepage: homepageRO,
        dashboard: dashboardRO,
        courseBuilder: courseBuilderRO,
        materials: materialsRO,
        auth: authRO,
      },
      en: {
        common: commonEN,
        homepage: homepageEN,
        dashboard: dashboardEN,
        courseBuilder: courseBuilderEN,
        materials: materialsEN,
        auth: authEN,
      },
    },
    fallbackLng: 'ro',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
