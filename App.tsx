import React, { useEffect, useRef } from 'react';
import { StatusBar, View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { FlightsProvider } from './src/context/FlightsContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { lightColors } from './src/theme';

// Module-level flag — resets each app launch, but prevents showing the dialog
// multiple times in one session. For persistent storage across launches,
// replace with Firestore user-doc flag once backend is integrated.
let gmailPromptShownThisSession = false;

function AppContent() {
  const { user, loading } = useAuth();
  const { themeColors: c } = useSettings();
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    // Only trigger once after a fresh login (uid transitions from null → value)
    if (!user) {
      prevUidRef.current = null;
      return;
    }
    if (prevUidRef.current === user.uid) { return; }
    prevUidRef.current = user.uid;

    if (gmailPromptShownThisSession) { return; }
    gmailPromptShownThisSession = true;

    // Slight delay so the dashboard fully renders before the dialog appears
    const timer = setTimeout(() => {
      Alert.alert(
        '✈️ Auto-Fetch Flight Emails?',
        'Allow FlyEasy to scan your Gmail for flight booking confirmations?\n\nThis lets us import your trips automatically — no manual entry needed.\n\n🔒 We only read airline booking emails. Your messages are never stored or shared.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Allow Gmail',
            onPress: () => {
              // TODO: trigger Google OAuth with Gmail readonly scope
              Alert.alert('Coming Soon', 'Gmail auto-import will be available in an upcoming update!');
            },
          },
        ],
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.primary }}>
        <ActivityIndicator size="large" color={lightColors.white} />
      </View>
    );
  }

  return user ? <TabNavigator /> : <AuthNavigator />;
}

function AppWithTheme() {
  const { isDarkMode, themeColors: c } = useSettings();

  return (
    <>
      <StatusBar
        backgroundColor={isDarkMode ? c.background : c.primary}
        barStyle="light-content"
      />
      <AuthProvider>
        <FlightsProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </FlightsProvider>
      </AuthProvider>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppWithTheme />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;
