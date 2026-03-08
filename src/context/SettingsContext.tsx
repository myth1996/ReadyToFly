import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';

export type Language = 'en' | 'hi';

const DARK_KEY = 'flyeasy_dark_mode';
const LANG_KEY = 'flyeasy_language';

// ─── Translations ────────────────────────────────────────────────────────────
export const translations = {
  en: {
    appTagline: 'Fly Without the Fear',
    quickActions: 'Quick Actions',
    leaveByTitle: 'Leave-By Calculator',
    leaveByDesc: 'When should I leave home?',
    docCheckTitle: 'Document Checklist',
    docCheckDesc: 'Am I ready to fly?',
    flightAlertsTitle: 'Flight Alerts',
    flightAlertsDesc: 'Gate changes & delays',
    calmModeTitle: 'Calm Mode',
    calmModeDesc: 'Relax & breathe',
    // Menu
    settingsTitle: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी (Hindi)',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    appVersion: 'FlyEasy v1.0.0',
    close: 'Close',
    // Flight status (used across screens)
    statusOnTime: 'On Time',
    statusDelayed: 'Delayed',
    statusCancelled: 'Cancelled',
    statusLanded: 'Landed',
    statusDiverted: 'Diverted',
    statusScheduled: 'Scheduled',
    statusActive: 'In Air',
    // Common actions
    comingSoon: 'Coming Soon',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    refresh: 'Refresh',
    search: 'Search',
    addFlight: 'Add Flight',
    noFlights: 'No flights yet',
  },
  hi: {
    appTagline: 'डर के बिना उड़ान',
    quickActions: 'त्वरित क्रियाएं',
    leaveByTitle: 'प्रस्थान समय',
    leaveByDesc: 'घर से कब निकलूं?',
    docCheckTitle: 'दस्तावेज़ जाँच',
    docCheckDesc: 'क्या मैं तैयार हूं?',
    flightAlertsTitle: 'उड़ान अलर्ट',
    flightAlertsDesc: 'गेट बदलाव और देरी',
    calmModeTitle: 'शांत मोड',
    calmModeDesc: 'आराम करें, सांस लें',
    // Menu
    settingsTitle: 'सेटिंग्स',
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी (Hindi)',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    appVersion: 'FlyEasy v1.0.0',
    close: 'बंद करें',
    // Flight status
    statusOnTime: 'समय पर',
    statusDelayed: 'विलंबित',
    statusCancelled: 'रद्द',
    statusLanded: 'उतर चुकी',
    statusDiverted: 'मार्ग बदला',
    statusScheduled: 'निर्धारित',
    statusActive: 'हवा में',
    // Common actions
    comingSoon: 'जल्द आ रहा है',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    refresh: 'रिफ्रेश',
    search: 'खोजें',
    addFlight: 'उड़ान जोड़ें',
    noFlights: 'कोई उड़ान नहीं',
  },
};

// ─── Context type ─────────────────────────────────────────────────────────────
type SettingsContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  themeColors: typeof lightColors;
};

const SettingsContext = createContext<SettingsContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  themeColors: lightColors,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const initialised = useRef(false);

  // Load persisted settings on mount
  useEffect(() => {
    AsyncStorage.multiGet([DARK_KEY, LANG_KEY])
      .then((results: readonly [string, string | null][]) => {
        const darkVal = results[0][1];
        const langVal = results[1][1];
        if (darkVal !== null) { setIsDarkMode(darkVal === 'true'); }
        if (langVal === 'hi' || langVal === 'en') { setLanguageState(langVal); }
      })
      .finally(() => {
        initialised.current = true;
      });
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      AsyncStorage.setItem(DARK_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
  };

  const value: SettingsContextType = {
    isDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
    t: translations[language],
    themeColors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
