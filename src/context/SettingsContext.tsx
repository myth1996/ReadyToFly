import React, { createContext, useContext, useState } from 'react';
import { lightColors, darkColors } from '../theme';

export type Language = 'en' | 'hi';

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
  const [language, setLanguage] = useState<Language>('en');

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

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
