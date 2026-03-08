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
    leaveByTitle: 'Leave-By',
    leaveByDesc: 'When should I leave home?',
    docCheckTitle: 'Checklist',
    docCheckDesc: 'Am I ready to fly?',
    flightAlertsTitle: 'Alerts',
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
    upgradePremium: 'Upgrade to Premium 👑',
    appVersion: 'FlyEasy v1.0.0',
    close: 'Close',
    // Flight status
    statusOnTime: 'On Time',
    statusDelayed: 'Delayed',
    statusCancelled: 'Cancelled',
    statusLanded: 'Landed',
    statusDiverted: 'Diverted',
    statusScheduled: 'Scheduled',
    statusActive: 'In Air',
    statusBoardingNow: 'Boarding',
    statusDeparted: 'Departed',
    // Common actions
    comingSoon: 'Coming Soon',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    refresh: 'Refresh',
    search: 'Search',
    addFlight: 'Add Flight',
    noFlights: 'No flights yet',
    back: 'Back',
    done: 'Done',
    loading: 'Loading…',
    tryAgain: 'Try Again',
    // Errors
    errorGeneric: 'Something went wrong. Please try again.',
    errorNoInternet: 'No internet connection.',
    errorFlightNotFound: 'Flight not found. Check number & date.',
    errorApiLimit: 'Too many requests. Please wait a moment.',
    // Leave-By
    leaveByHeading: 'Leave-By Calculator',
    leaveBySubheading: 'Know exactly when to leave home',
    leaveByMissingTime: 'Please enter a valid departure time (e.g. 10:30 AM).',
    leaveByMissingTravel: 'Please enter your travel time to the airport in minutes.',
    leaveByResultLabel: 'Leave home by',
    leaveByReminderSet: '🔔 Reminder set for 15 min before',
    // Doc checklist
    checklistHeading: 'Document Checklist',
    checklistDomestic: '🇮🇳 Domestic',
    checklistIntl: '🌍 International',
    checklistShare: '📤 Share Checklist',
    checklistReset: '🔄 Reset',
    checklistAllDone: '  ✅ All done!',
    // Premium
    premiumTitle: 'FlyEasy Premium',
    premiumSubtitle: 'Fly smarter. Worry less.',
    premiumCta: 'Upgrade to Premium',
    premiumAlreadyActive: 'You\'re Premium!',
    // Number formatting — Indian system
    numberFormat: 'en-IN',
  },
  hi: {
    appTagline: 'डर के बिना उड़ान',
    quickActions: 'त्वरित क्रियाएं',
    leaveByTitle: 'प्रस्थान',
    leaveByDesc: 'घर से कब निकलूं?',
    docCheckTitle: 'जाँच सूची',
    docCheckDesc: 'क्या मैं तैयार हूं?',
    flightAlertsTitle: 'अलर्ट',
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
    upgradePremium: 'प्रीमियम अपग्रेड करें 👑',
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
    statusBoardingNow: 'बोर्डिंग',
    statusDeparted: 'उड़ चुकी',
    // Common actions
    comingSoon: 'जल्द आ रहा है',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    refresh: 'रिफ्रेश',
    search: 'खोजें',
    addFlight: 'उड़ान जोड़ें',
    noFlights: 'कोई उड़ान नहीं',
    back: 'वापस',
    done: 'हो गया',
    loading: 'लोड हो रहा है…',
    tryAgain: 'पुनः प्रयास करें',
    // Errors
    errorGeneric: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
    errorNoInternet: 'इंटरनेट कनेक्शन नहीं है।',
    errorFlightNotFound: 'उड़ान नहीं मिली। नंबर और तारीख जांचें।',
    errorApiLimit: 'बहुत अधिक अनुरोध। थोड़ा इंतज़ार करें।',
    // Leave-By
    leaveByHeading: 'प्रस्थान समय कैलकुलेटर',
    leaveBySubheading: 'जानें घर से कब निकलना है',
    leaveByMissingTime: 'कृपया सही प्रस्थान समय दर्ज करें (जैसे 10:30 AM)।',
    leaveByMissingTravel: 'कृपया हवाई अड्डे तक यात्रा का समय मिनटों में दर्ज करें।',
    leaveByResultLabel: 'घर से निकलें',
    leaveByReminderSet: '🔔 15 मिनट पहले रिमाइंडर सेट हुआ',
    // Doc checklist
    checklistHeading: 'दस्तावेज़ जाँच सूची',
    checklistDomestic: '🇮🇳 घरेलू',
    checklistIntl: '🌍 अंतर्राष्ट्रीय',
    checklistShare: '📤 साझा करें',
    checklistReset: '🔄 रीसेट',
    checklistAllDone: '  ✅ सब तैयार!',
    // Premium
    premiumTitle: 'FlyEasy प्रीमियम',
    premiumSubtitle: 'और स्मार्ट उड़ान भरें।',
    premiumCta: 'प्रीमियम अपग्रेड करें',
    premiumAlreadyActive: 'आप प्रीमियम हैं!',
    // Number formatting — Indian system
    numberFormat: 'hi-IN',
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
