import React, { useEffect, useRef } from 'react';
import { StatusBar, View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { FlightsProvider } from './src/context/FlightsContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { lightColors } from './src/theme';

const GMAIL_ASKED_KEY = 'flyeasy_gmail_asked';

function AppContent() {
  const { user, loading } = useAuth();
  const { themeColors: c } = useSettings();
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      prevUidRef.current = null;
      return;
    }
    if (prevUidRef.current === user.uid) { return; }
    prevUidRef.current = user.uid;

    // Show Gmail permission prompt only ONCE ever (persisted across app restarts)
    const checkGmailPrompt = async () => {
      try {
        const asked = await AsyncStorage.getItem(GMAIL_ASKED_KEY);
        if (asked) { return; }
        await AsyncStorage.setItem(GMAIL_ASKED_KEY, 'true');
      } catch (_) {
        return; // don't show if storage fails
      }

      // Slight delay so the dashboard renders before the dialog
      setTimeout(() => {
        Alert.alert(
          '✈️ Auto-Fetch Flight Details?',
          'Allow FlyEasy to scan your SMS for flight booking confirmations?\n\nThis lets us import your trips automatically — no manual entry needed.\n\n🔒 All parsing happens on your phone. Your messages are never sent to any server.',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Allow',
              onPress: () => {
                // TODO: trigger SMS permission request
                Alert.alert('Coming Soon', 'SMS auto-import will be available in the next update!');
              },
            },
          ],
        );
      }, 1200);
    };

    checkGmailPrompt();
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
