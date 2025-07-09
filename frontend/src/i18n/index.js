import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ru from './ru.json';
import kk from './kk.json';

// Ресурсы переводов
const resources = {
  en: {
    translation: en
  },
  ru: {
    translation: ru
  },
  kk: {
    translation: kk
  }
};

i18n
  // Детектор языка браузера
  .use(LanguageDetector)
  // Подключаем react-i18next
  .use(initReactI18next)
  // Инициализируем i18next
  .init({
    resources,
    
    // Язык по умолчанию
    fallbackLng: 'en',
    
    // Языки для детекции
    supportedLngs: ['en', 'ru', 'kk'],
    
    // Отладка только в development
    debug: import.meta.env.DEV,
    
    // Настройки детектора языка
    detection: {
      // Порядок детекции: localStorage -> browser language -> fallback
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Кеш в localStorage
      caches: ['localStorage'],
      
      // Ключ для localStorage
      lookupLocalStorage: 'i18nextLng',
      
      // Проверять только поддерживаемые языки
      checkWhitelist: true
    },
    
    // Настройки интерполяции
    interpolation: {
      // React уже экранирует значения
      escapeValue: false,
      
      // Кастомные форматы для разных типов значений
      format: function(value, format) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    },
    
    // Настройки для React
    react: {
      // Использовать Suspense для ленивой загрузки
      useSuspense: false
    },
    
    // Возвращать ключ, если перевод не найден (для отладки)
    returnKeyIfNotFound: true,
    
    // Добавить пространство имен по умолчанию
    defaultNS: 'translation',
    
    // Разделитель для вложенных ключей
    keySeparator: '.',
    
    // Разделитель для пространств имен
    nsSeparator: ':'
  });

export default i18n; 